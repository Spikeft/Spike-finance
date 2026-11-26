import '../../global.css'
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from 'react-native-toastify-expo';
import OtaUpdateGate from '@/components/ota/OtaUpdateModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler'


// import { AnimatedSplashOverlay } from '@/components/animated-icon';
// import AppTabs from '@/components/app-tabs';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
    // css variable
    const colorScheme = useColorScheme();
    const [fontsLoaded, fontError] = useFonts({
        'Figtree-Light': require('../../assets/fonts/Figtree-Light.ttf'),
        'Figtree-Regular': require('../../assets/fonts/Figtree-Regular.ttf'),
        'Figtree-Medium': require('../../assets/fonts/Figtree-Medium.ttf'),
        'Figtree-Bold': require('../../assets/fonts/Figtree-Bold.ttf'),
        'Inter_18pt-Regular': require('../../assets/fonts/Inter_18pt-Regular.ttf'),
        'Inter_18pt-Medium': require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            void SplashScreen.hideAsync().catch(() => { });
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <ToastProvider>
                    <QueryClientProvider client={queryClient}>
                        <SafeAreaView edges={['left', 'right']} style={{ width: '100%', height: '100%', backgroundColor: 'white' }}>
                            <Stack screenOptions={{ headerShown: false }} />
                            <OtaUpdateGate />
                        </SafeAreaView>
                    </QueryClientProvider>
                </ToastProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}