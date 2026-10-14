import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui';

const WAIT = 30;

/** Emergency unlock: wait 30 seconds AND type a reason before the session can be broken. */
export function EmergencyUnlock({ visible, onCancel, onConfirm }: {
  visible: boolean; onCancel: () => void; onConfirm: (reason: string) => void;
}) {
  const { c } = useTheme();
  const [left, setLeft] = useState(WAIT);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLeft(WAIT);
    setReason('');
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const reasonOk = reason.trim().length >= 5;
  const ready = left === 0 && reasonOk;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#000a', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 22, width: '100%', maxWidth: 440 }}>
          <Text style={{ color: c.text, fontSize: 19, fontWeight: '600' }}>Emergency unlock</Text>
          <Text style={{ color: c.sub, marginTop: 6 }}>
            Breaking focus is recorded in your history. Take a breath — is this really needed?
          </Text>
          <TextInput
            testID="unlock-reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Why do you need to stop? (min 5 characters)"
            placeholderTextColor={c.sub}
            multiline
            style={{ color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 12, marginTop: 14, minHeight: 70, textAlignVertical: 'top' }}
          />
          <Text testID="unlock-wait" style={{ color: left === 0 ? c.success : c.warn, fontWeight: '700', marginTop: 12 }}>
            {left > 0 ? `Please wait ${left}s…` : reasonOk ? 'You can unlock now.' : 'Now type your reason.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Button label="Stay focused" style={{ flex: 1 }} onPress={onCancel} />
            <Button label="Unlock" variant="danger" disabled={!ready} style={{ flex: 1 }} onPress={() => onConfirm(reason.trim())} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
