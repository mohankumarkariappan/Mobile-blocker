import { useColorScheme } from 'react-native';
import { dark, light } from '../theme/colors';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTheme() {
  const system = useColorScheme();
  const pref = useSettingsStore((s) => s.theme);
  const mode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return { c: mode === 'dark' ? dark : light, mode };
}
