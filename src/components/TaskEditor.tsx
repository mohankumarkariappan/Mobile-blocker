import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Priority, Task } from '../db/types';
import type { TaskInput } from '../store/useTaskStore';
import { fromKey, shiftKey } from '../utils/dates';
import { Button, Chip } from './ui';

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function TaskEditor({ visible, task, date, onClose, onSave, onDelete }: {
  visible: boolean; task: Task | null; date: string; onClose: () => void;
  onSave: (input: TaskInput) => void; onDelete?: () => void;
}) {
  const { c } = useTheme();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [time, setTime] = useState('');
  const [d, setD] = useState(date);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setPriority(task?.priority ?? 'medium');
    setTime(task?.time ?? '');
    setD(task?.date ?? date);
  }, [visible, task, date]);

  const timeOk = time === '' || TIME_RE.test(time);
  const canSave = title.trim().length > 0 && timeOk;

  const input = { color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 12, fontSize: 15 } as const;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%', width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 14 }}>{task ? 'Edit task' : 'New task'}</Text>

            <TextInput testID="task-title" value={title} onChangeText={setTitle} placeholder="What do you want to do?" placeholderTextColor={c.sub} style={input} autoFocus />
            <TextInput testID="task-notes" value={notes} onChangeText={setNotes} placeholder="Notes (optional)" placeholderTextColor={c.sub} style={[input, { marginTop: 10, minHeight: 64, textAlignVertical: 'top' }]} multiline />

            <Text style={{ color: c.sub, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Low" selected={priority === 'low'} color={c.success} onPress={() => setPriority('low')} />
              <Chip label="Medium" selected={priority === 'medium'} color={c.warn} onPress={() => setPriority('medium')} />
              <Chip label="High" selected={priority === 'high'} color={c.danger} onPress={() => setPriority('high')} />
            </View>

            <Text style={{ color: c.sub, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Time (24h, optional)</Text>
            <TextInput testID="task-time" value={time} onChangeText={setTime} placeholder="e.g. 14:30" placeholderTextColor={c.sub}
              style={[input, !timeOk && { borderWidth: 1, borderColor: c.danger }]} keyboardType="numbers-and-punctuation" maxLength={5} />
            {!timeOk && <Text style={{ color: c.danger, fontSize: 12, marginTop: 4 }}>Use HH:MM, like 09:15</Text>}

            <Text style={{ color: c.sub, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Date</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Button label="‹" variant="soft" onPress={() => setD(shiftKey(d, -1))} />
              <Text style={{ color: c.text, fontWeight: '700', flex: 1, textAlign: 'center' }}>{format(fromKey(d), 'EEE, MMM d')}</Text>
              <Button label="›" variant="soft" onPress={() => setD(shiftKey(d, 1))} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              {task && onDelete ? <Button label="Delete" variant="danger" onPress={onDelete} /> : null}
              <View style={{ flex: 1 }} />
              <Button label="Cancel" variant="ghost" onPress={onClose} />
              <Button label={task ? 'Save' : 'Add'} disabled={!canSave} onPress={() => onSave({ title: title.trim(), notes: notes.trim(), priority, time: time ? time.padStart(5, '0') : null, date: d })} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
