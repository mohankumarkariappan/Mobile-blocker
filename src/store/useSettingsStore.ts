import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemePref = 'system' | 'light' | 'dark';

type State = {
  theme: ThemePref;
  onboarded: boolean;
  blockedDefaults: string[];   // last-used blocked packages
  setTheme: (t: ThemePref) => void;
  setOnboarded: (v: boolean) => void;
  setBlockedDefaults: (p: string[]) => void;
};

export const useSettingsStore = create<State>()(
  persist(
    (set) => ({
      theme: 'system',
      onboarded: false,
      blockedDefaults: [],
      setTheme: (theme) => set({ theme }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setBlockedDefaults: (blockedDefaults) => set({ blockedDefaults }),
    }),
    { name: 'focusday.settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
