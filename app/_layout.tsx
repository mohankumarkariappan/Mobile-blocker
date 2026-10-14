import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/components/ui';
import { useTheme } from '../src/hooks/useTheme';
import { useFocusStore } from '../src/store/useFocusStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTaskStore } from '../src/store/useTaskStore';

function useHydrated() {
  const [h, setH] = useState(useSettingsStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSettingsStore.persist.onFinishHydration(() => setH(true));
    setH(useSettingsStore.persist.hasHydrated());
    return unsub;
  }, []);
  return h;
}

export default function RootLayout() {
  const { c, mode } = useTheme();
  const hydrated = useHydrated();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const router = useRouter();
  const segments = useSegments();
  const loadTasks = useTaskStore((s) => s.load);
  const refresh = useFocusStore((s) => s.refresh);

  useEffect(() => {
    loadTasks();
    refresh();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { loadTasks(); refresh(); }
    });
    return () => sub.remove();
  }, [loadTasks, refresh]);

  // When a session's timer runs out while the app is open, sync the result (and celebrate) right away.
  const endTime = useFocusStore((s) => (s.status.active ? s.status.endTime : 0));
  useEffect(() => {
    if (!endTime) return;
    const id = setTimeout(refresh, Math.max(0, endTime - Date.now()) + 800);
    return () => clearTimeout(id);
  }, [endTime, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) router.replace('/onboarding');
    if (onboarded && inOnboarding) router.replace('/');
  }, [hydrated, onboarded, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <ToastProvider>
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: c.bg } }} />
          </View>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
