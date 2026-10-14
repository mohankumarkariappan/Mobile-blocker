import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Heading } from '../../src/components/ui';
import { useTheme } from '../../src/hooks/useTheme';
import { useFocusStore } from '../../src/store/useFocusStore';
import { fmtMinutes, fromKey } from '../../src/utils/dates';

export default function History() {
  const { c } = useTheme();
  const { sessions, refresh } = useFocusStore();
  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    const done = sessions.filter((s) => s.status === 'completed');
    return { done: done.length, broken: sessions.length - done.length, ms: done.reduce((a, s) => a + s.actualMs, 0) };
  }, [sessions]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }}>
        <Heading sub="Your focus sessions">History</Heading>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Completed" value={String(stats.done)} color={c.success} />
          <Stat label="Broken" value={String(stats.broken)} color={c.danger} />
          <Stat label="Focused" value={fmtMinutes(stats.ms)} color={c.primary} />
        </View>

        {sessions.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Feather name="feather" size={30} color={c.sub} />
            <Text style={{ color: c.sub, marginTop: 8, textAlign: 'center' }}>No sessions yet. Your first focus session will appear here.</Text>
          </Card>
        ) : (
          sessions.map((s, i) => {
            const ok = s.status === 'completed';
            return (
              <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 8) * 40)}>
                <Card style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600' }}>{format(fromKey(s.date), 'EEE, MMM d')} · {format(new Date(s.startedAt), 'HH:mm')}</Text>
                    <View style={{ backgroundColor: ok ? c.successSoft : c.dangerSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: ok ? c.success : c.danger, fontWeight: '700', fontSize: 11 }}>{ok ? 'Completed' : 'Broken'}</Text>
                    </View>
                  </View>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{s.goal}</Text>
                  <Text style={{ color: c.sub, fontSize: 13 }}>
                    {fmtMinutes(s.actualMs)} of {fmtMinutes(s.plannedMs)} planned
                  </Text>
                  {s.reason ? <Text style={{ color: c.sub, fontSize: 12, fontStyle: 'italic' }}>“{s.reason}”</Text> : null}
                </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color, fontSize: 20, fontWeight: '600' }}>{value}</Text>
      <Text style={{ color: c.sub, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
