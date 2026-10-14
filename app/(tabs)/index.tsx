import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateStrip } from '../../src/components/DateStrip';
import { ProgressRing } from '../../src/components/ProgressRing';
import { TaskCard } from '../../src/components/TaskCard';
import { TaskEditor } from '../../src/components/TaskEditor';
import { Button, Card, tap, useToast } from '../../src/components/ui';
import type { Task } from '../../src/db/types';
import { useTheme } from '../../src/hooks/useTheme';
import { useFocusStore } from '../../src/store/useFocusStore';
import { useTaskStore } from '../../src/store/useTaskStore';
import { fromKey, todayKey } from '../../src/utils/dates';
import { allDoneMessage, greeting, taskDoneMessage } from '../../src/utils/messages';

const ORDER = { high: 0, medium: 1, low: 2 } as const;

export default function Today() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { tasks, add, update, toggle, remove } = useTaskStore();
  const setDraftGoal = useFocusStore((s) => s.setDraftGoal);
  const [date, setDate] = useState(todayKey());
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === date).sort((a, b) =>
      Number(a.done) - Number(b.done) || (a.time ?? '99').localeCompare(b.time ?? '99') || ORDER[a.priority] - ORDER[b.priority]),
    [tasks, date],
  );
  const dotDates = useMemo(() => new Set(tasks.map((t) => t.date)), [tasks]);
  const doneCount = dayTasks.filter((t) => t.done).length;
  const progress = dayTasks.length ? doneCount / dayTasks.length : 0;
  const isToday = date === todayKey();

  const onToggle = async (t: Task) => {
    const nowDone = await toggle(t.id);
    if (!nowDone) return;
    const remaining = dayTasks.filter((x) => !x.done && x.id !== t.id).length;
    toast(remaining === 0 ? allDoneMessage() : taskDoneMessage());
  };

  const startFocus = (t: Task) => {
    setDraftGoal(t.title);
    router.push('/focus');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 }}>
          <Text style={{ color: c.sub, fontWeight: '600' }}>{format(fromKey(date), 'EEEE, MMMM d')}</Text>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>{isToday ? 'Today' : 'Plan'}</Text>
        </View>

        <DateStrip selected={date} onSelect={setDate} dotDates={dotDates} />

        <View style={{ padding: 20, gap: 14 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <ProgressRing progress={progress} size={104} sub={`${doneCount}/${dayTasks.length}`} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{greeting(progress, dayTasks.length)}</Text>
              <Text style={{ color: c.sub, marginTop: 4 }}>
                {dayTasks.length === 0 ? 'Nothing planned' : `${dayTasks.length - doneCount} left · ${doneCount} done`}
              </Text>
            </View>
          </Card>

          {dayTasks.length === 0 ? (
            <Animated.View entering={FadeIn}>
              <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Feather name="sun" size={30} color={c.sub} />
                <Text style={{ color: c.sub, marginTop: 8 }}>No tasks for this day yet.</Text>
              </Card>
            </Animated.View>
          ) : (
            dayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={() => onToggle(t)} onEdit={() => { setEditing(t); setOpen(true); }} onFocus={() => startFocus(t)} />
            ))
          )}

          <Button label="Add task" icon="plus" onPress={() => { tap(); setEditing(null); setOpen(true); }} />
        </View>
      </ScrollView>

      <TaskEditor
        visible={open}
        task={editing}
        date={date}
        onClose={() => setOpen(false)}
        onSave={async (input) => {
          if (editing) await update(editing.id, input); else await add(input);
          setOpen(false);
        }}
        onDelete={editing ? async () => { await remove(editing.id); setOpen(false); } : undefined}
      />
    </SafeAreaView>
  );
}
