import React, { type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0] & {
  navigation?: {
    emit: (event: {
      type: 'tabPress' | 'tabLongPress';
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    icon: number;
    isCompositeHome?: boolean;
  }
> = {
  index: {
    label: 'Home',
    icon: require('@/assets/images/tabs/tab-home-active.svg'),
    isCompositeHome: true,
  },
  savings: {
    label: 'Savings',
    icon: require('@/assets/images/tabs/tab-savings.svg'),
  },
  bills: {
    label: 'Bills',
    icon: require('@/assets/images/tabs/tab-bills.svg'),
  },
};

const VISIBLE_TABS = new Set(['index', 'savings', 'bills']);

export function HomeTabBar({ state, descriptors, navigation }: HomeTabBarProps) {
  const insets = useSafeAreaInsets();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const bottomPadding = Math.max(insets.bottom, 20);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));

  const pillContent = (
    <View style={styles.tabButtonsRow}>
      {visibleRoutes.map((route) => {
        const routeIndex = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === routeIndex;
        const { options } = descriptors[route.key];
        const config = TAB_CONFIG[route.name];

        if (!config) return null;

        const onPress = () => {
          const event = navigation?.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event?.defaultPrevented) {
            navigation?.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation?.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const tintColor = isFocused ? '#0C490C' : '#18181B';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tabItem,
              isFocused && styles.tabItemFocused,
              pressed && styles.tabItemPressed,
            ]}
          >
            {config.isCompositeHome ? (
              <Image
                source={config.icon}
                contentFit="contain"
                tintColor={tintColor}
                style={styles.homeCompositeIcon}
              />
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <Image
                    source={config.icon}
                    contentFit="contain"
                    tintColor={tintColor}
                    style={styles.tabIcon}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: tintColor },
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: bottomPadding }]}
    >
      {useGlass ? (
        <GlassView
          glassEffectStyle="regular"
          style={styles.glassPill}
        >
          {pillContent}
        </GlassView>
      ) : (
        <View style={styles.fallbackPill}>{pillContent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  glassPill: {
    width: 274,
    height: 62,
    borderRadius: 100,
    padding: 4,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 8,
  },
  fallbackPill: {
    width: 274,
    height: 62,
    borderRadius: 100,
    padding: 4,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 27, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  tabItem: {
    flex: 1,
    height: 54,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 7,
    paddingHorizontal: 8,
    gap: 1,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(30, 164, 30, 0.15)',
  },
  tabItemPressed: {
    opacity: 0.75,
  },
  homeCompositeIcon: {
    width: 68,
    height: 41,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 26,
    height: 26,
  },
  tabLabel: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeTabBar;
