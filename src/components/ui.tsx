import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { radius } from '../theme/colors';

export const tap = (kind: 'light' | 'success' | 'warning' = 'light') => {
  if (Platform.OS === 'web') return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function PressableScale({ children, onPress, style, disabled, testID }: {
  children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; testID?: string;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => (s.value = withSpring(0.96, { damping: 15 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 15 }))}
    >
      <Animated.View style={[a, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({ label, onPress, variant = 'primary', disabled, icon, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'soft' | 'danger' | 'ghost';
  disabled?: boolean; icon?: keyof typeof Feather.glyphMap; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'soft' ? c.primarySoft : variant === 'danger' ? c.dangerSoft : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? c.danger : variant === 'ghost' ? c.sub : c.primary;
  return (
    <PressableScale
      disabled={disabled}
      onPress={() => { tap('light'); onPress(); }}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Feather name={icon} size={17} color={fg} /> : null}
        <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress?: () => void; color?: string }) {
  const { c } = useTheme();
  const tint = color ?? c.primary;
  return (
    <Pressable
      onPress={() => { tap('light'); onPress?.(); }}
      style={[styles.chip, { backgroundColor: selected ? tint : 'transparent', borderColor: selected ? tint : c.border }]}
    >
      <Text style={{ color: selected ? '#fff' : c.text, fontWeight: '500', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>{children}</Text>
      {sub ? <Text style={{ color: c.sub, fontSize: 14, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

// ---- Toast (encouraging messages) ----
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ id: Date.now(), text });
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <Animated.View
          key={msg.id}
          entering={FadeInDown.springify().damping(16)}
          exiting={FadeOutUp}
          pointerEvents="none"
          style={[styles.toast, { backgroundColor: c.text }]}
        >
          <Text style={{ color: c.bg, fontWeight: '600', textAlign: 'center' }}>{msg.text}</Text>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16, borderWidth: 1 },
  btn: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '600' },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1 },
  toast: { position: 'absolute', top: 56, left: 24, right: 24, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, elevation: 8, maxWidth: 520, alignSelf: 'center' },
});
