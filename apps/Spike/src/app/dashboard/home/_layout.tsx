import React from 'react';
import { Tabs } from 'expo-router';

import { HomeTabBar } from '@/components/home/HomeTabBar';

export default function DashboardHomeLayout() {
  return (
    <Tabs
      tabBar={(props) => <HomeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
