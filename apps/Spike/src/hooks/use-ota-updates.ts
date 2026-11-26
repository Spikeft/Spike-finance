import * as Updates from 'expo-updates';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export interface OtaReleaseNotes {
    title: string;
    message: string;
    fixes: string[];
    version: string;
    createdAt?: Date;
}

export type OtaUpdatePhase =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'ready'
    | 'restarting'
    | 'error';

const DEFAULT_MESSAGE =
    'We have shipped performance improvements, bug fixes, and a smoother Spike experience.';

const DEFAULT_FIXES = [
    'Improved overall app speed and stability',
    'Fixed minor UI and connectivity issues',
    'Enhanced security and reliability',
];

const CHECK_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes between foreground checks

/**
 * Extracts update message and bulleted "what was fixed" items from an EAS Update manifest.
 *
 * Supports two ways of authoring release notes:
 * 1. `app.json` -> `expo.extra.updateNotes = { title, message, fixes: [...] }`
 * 2. EAS CLI `--message` string, e.g.:
 *    `eas update --branch production --message "Faster transfers | Fixed OTP bug | Improved PIN flow"`
 *    or multi-line `- Fixed ...` bullets.
 */
export function parseUpdateNotes(
    updateInfo?: Updates.UpdateInfo,
): OtaReleaseNotes {
    const manifest = (updateInfo?.manifest ?? {}) as Record<string, any>;
    const expoExtra =
        manifest?.extra?.expoClient?.extra ?? manifest?.extra ?? {};
    const customNotes = expoExtra?.updateNotes as
        | { title?: string; message?: string; fixes?: string[] }
        | undefined;

    const rawMessage: string =
        customNotes?.message ??
        manifest?.metadata?.message ??
        manifest?.extra?.message ??
        '';

    const version: string =
        manifest?.extra?.expoClient?.version ??
        Updates.runtimeVersion ??
        '1.0.0';

    let message = DEFAULT_MESSAGE;
    let fixes: string[] = [];

    if (Array.isArray(customNotes?.fixes) && customNotes.fixes.length > 0) {
        fixes = customNotes.fixes.filter(Boolean);
        if (rawMessage.trim()) {
            message = rawMessage.trim();
        }
    } else if (rawMessage.trim()) {
        // Parse pipe-separated or newline-separated EAS update messages
        const parts = rawMessage
            .split(/\r?\n|\|/)
            .map((line) => line.replace(/^[-•*]\s*/, '').trim())
            .filter(Boolean);

        if (parts.length > 1) {
            message = parts[0];
            fixes = parts.slice(1);
        } else if (parts.length === 1) {
            message = parts[0];
            fixes = DEFAULT_FIXES;
        }
    } else {
        fixes = DEFAULT_FIXES;
    }

    return {
        title: customNotes?.title ?? 'New Update Available',
        message,
        fixes,
        version,
        createdAt: updateInfo?.createdAt,
    };
}

export function useOtaUpdates() {
    const {
        isUpdateAvailable,
        isUpdatePending,
        isChecking,
        isDownloading,
        isRestarting,
        availableUpdate,
        downloadedUpdate,
        downloadProgress,
        checkError,
        downloadError,
    } = Updates.useUpdates();

    const [dismissed, setDismissed] = useState(false);
    const [manualError, setManualError] = useState<string | undefined>(
        undefined,
    );
    const lastCheckAtRef = useRef<number>(0);

    const canCheckUpdates =
        !__DEV__ && Platform.OS !== 'web' && Updates.isEnabled;

    const checkForUpdate = useCallback(async () => {
        if (!canCheckUpdates) return;

        lastCheckAtRef.current = Date.now();
        setManualError(undefined);
        try {
            const result = await Updates.checkForUpdateAsync();
            if (result.isAvailable) {
                setDismissed(false);
            }
        } catch (err: any) {
            // Silent on background check so offline launches aren't disrupted
            console.warn('OTA update check failed:', err?.message ?? err);
        }
    }, [canCheckUpdates]);

    // Check once on startup and again when returning to foreground (throttled)
    useEffect(() => {
        if (!canCheckUpdates) return;

        void checkForUpdate();

        const subscription = AppState.addEventListener(
            'change',
            (nextState: AppStateStatus) => {
                if (
                    nextState === 'active' &&
                    Date.now() - lastCheckAtRef.current > CHECK_THROTTLE_MS
                ) {
                    void checkForUpdate();
                }
            },
        );

        return () => subscription.remove();
    }, [canCheckUpdates, checkForUpdate]);

    const startDownload = useCallback(async () => {
        if (!canCheckUpdates) return;
        setManualError(undefined);
        try {
            await Updates.fetchUpdateAsync();
        } catch (err: any) {
            setManualError(
                err?.message ?? 'Failed to download update. Please try again.',
            );
        }
    }, [canCheckUpdates]);

    const applyUpdate = useCallback(async () => {
        if (!canCheckUpdates) return;
        setManualError(undefined);
        try {
            await Updates.reloadAsync();
        } catch (err: any) {
            setManualError(
                err?.message ?? 'Failed to restart app. Please reopen Spike.',
            );
        }
    }, [canCheckUpdates]);

    const dismiss = useCallback(() => {
        if (isDownloading || isRestarting) return;
        setDismissed(true);
    }, [isDownloading, isRestarting]);

    const activeUpdateInfo = downloadedUpdate ?? availableUpdate;
    const releaseNotes = useMemo(
        () => parseUpdateNotes(activeUpdateInfo),
        [activeUpdateInfo],
    );

    const errorMessage =
        manualError ?? downloadError?.message ?? checkError?.message;

    const phase: OtaUpdatePhase = useMemo(() => {
        if (isRestarting) return 'restarting';
        if (isUpdatePending) return 'ready';
        if (isDownloading) return 'downloading';
        if (manualError || downloadError) return 'error';
        if (isUpdateAvailable) return 'available';
        if (isChecking) return 'checking';
        return 'idle';
    }, [
        downloadError,
        isChecking,
        isDownloading,
        isRestarting,
        isUpdateAvailable,
        isUpdatePending,
        manualError,
    ]);

    const progress = useMemo(() => {
        if (phase === 'ready' || phase === 'restarting') return 100;
        if (typeof downloadProgress === 'number') {
            return Math.max(0, Math.min(100, Math.round(downloadProgress * 100)));
        }
        return 0;
    }, [downloadProgress, phase]);

    const visible =
        !dismissed &&
        (phase === 'available' ||
            phase === 'downloading' ||
            phase === 'ready' ||
            phase === 'restarting' ||
            (phase === 'error' && Boolean(activeUpdateInfo)));

    return {
        visible,
        phase,
        progress,
        releaseNotes,
        errorMessage,
        checkForUpdate,
        startDownload,
        applyUpdate,
        dismiss,
    };
}
