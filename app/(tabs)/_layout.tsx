import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

const icon = (name: keyof typeof Feather.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Feather name={name} size={size - 3} color={color as string} />;

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets(); // keeps the bar above the system back/home/recents buttons
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.sub,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, height: 56 + insets.bottom, paddingBottom: insets.bottom + 6, paddingTop: 8, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle: { fontWeight: '500', fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('check-circle') }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus', tabBarIcon: icon('target') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('clock') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('sliders') }} />
    </Tabs>
  );
}
