import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import type { Task } from '../db/types';
import { fromKey } from '../utils/dates';
import { PressableScale, tap } from './ui';

export function TaskCard({ task, onToggle, onEdit, onFocus }: {
  task: Task; onToggle: () => void; onEdit: () => void; onFocus: () => void;
}) {
  const { c } = useTheme();
  const pColor = task.priority === 'high' ? c.danger : task.priority === 'medium' ? c.warn : c.success;

  return (
    <Animated.View entering={FadeIn.duration(250)} layout={LinearTransition.springify().damping(18)}>
      <PressableScale onPress={onEdit} style={{ backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: 12 }}>
        <Pressable
          testID={`toggle-${task.id}`}
          hitSlop={10}
          onPress={() => { tap(task.done ? 'light' : 'success'); onToggle(); }}
          style={{
            width: 26, height: 26, borderRadius: 13, borderWidth: 2, marginTop: 2,
            borderColor: task.done ? c.success : pColor, backgroundColor: task.done ? c.success : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {task.done ? <Feather name="check" size={15} color="#fff" /> : null}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: task.done ? c.sub : c.text, fontSize: 16, fontWeight: '600', textDecorationLine: task.done ? 'line-through' : 'none' }}>
            {task.title}
          </Text>
          {task.notes ? <Text numberOfLines={2} style={{ color: c.sub, fontSize: 13, marginTop: 2 }}>{task.notes}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <Tag text={task.priority} color={pColor} />
            {task.time ? <Tag text={task.time} icon="clock" color={c.primary} /> : null}
            {task.carriedFrom ? <Tag text={`carried over · ${format(fromKey(task.carriedFrom), 'MMM d')}`} icon="corner-up-right" color={c.warn} /> : null}
          </View>
        </View>

        {!task.done && (
          <Pressable testID={`focus-${task.id}`} onPress={() => { tap('light'); onFocus(); }} hitSlop={8}
            style={{ alignSelf: 'center', backgroundColor: c.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Feather name="target" size={13} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '600', fontSize: 12 }}>Focus</Text>
          </Pressable>
        )}
      </PressableScale>
    </Animated.View>
  );
}

function Tag({ text, color, icon }: { text: string; color: string; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <View style={{ backgroundColor: color + '1F', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon ? <Feather name={icon} size={11} color={color} /> : null}
      <Text style={{ color, fontSize: 11, fontWeight: '600', textTransform: icon ? 'none' : 'capitalize' }}>{text}</Text>
    </View>
  );
}
