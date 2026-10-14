import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ progress, size = 120, stroke = 9, label, sub }: {
  progress: number; size?: number; stroke?: number; label?: string; sub?: string;
}) {
  const { c } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [progress, p]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  const done = progress >= 1;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.cardAlt} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={done ? c.success : c.primary}
          strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={props}
        />
      </Svg>
      <Text style={{ color: c.text, fontSize: size * 0.24, fontWeight: '600' }}>{label ?? `${Math.round(progress * 100)}%`}</Text>
      {sub ? <Text style={{ color: c.sub, fontSize: 11 }}>{sub}</Text> : null}
    </View>
  );
}
