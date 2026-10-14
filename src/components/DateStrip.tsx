import { addDays, format, isSameDay } from 'date-fns';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fromKey, toKey, todayKey } from '../utils/dates';
import { tap } from './ui';

const PAST = 14;
const FUTURE = 30;
const ITEM = 58; // width + gap

export function DateStrip({ selected, onSelect, dotDates }: { selected: string; onSelect: (k: string) => void; dotDates: Set<string> }) {
  const { c } = useTheme();
  const scroller = useRef<ScrollView>(null);
  const days = useMemo(() => {
    const t = new Date();
    return Array.from({ length: PAST + FUTURE + 1 }, (_, i) => addDays(t, i - PAST));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => scroller.current?.scrollTo({ x: Math.max(0, (PAST - 2) * ITEM), animated: false }), 50);
    return () => clearTimeout(id);
  }, []);

  const today = todayKey();
  return (
    <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {days.map((d) => {
        const k = toKey(d);
        const sel = k === selected;
        const isToday = isSameDay(fromKey(k), fromKey(today));
        return (
          <Pressable
            key={k}
            testID={`date-${k}`}
            onPress={() => { tap('light'); onSelect(k); }}
            style={{
              width: 48, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
              backgroundColor: sel ? c.primary : c.card,
              borderWidth: 1, borderColor: sel ? c.primary : isToday ? c.primary + '88' : c.border,
            }}
          >
            <Text style={{ color: sel ? '#ffffffcc' : c.sub, fontSize: 11, fontWeight: '600' }}>{format(d, 'EEE')}</Text>
            <Text style={{ color: sel ? '#fff' : c.text, fontSize: 17, fontWeight: '600', marginVertical: 2 }}>{format(d, 'd')}</Text>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dotDates.has(k) ? (sel ? '#fff' : c.primary) : 'transparent' }} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
