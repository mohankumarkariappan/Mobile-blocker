import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyUnlock } from '../src/components/EmergencyUnlock';
import { Button } from '../src/components/ui';
import { useCountdown } from '../src/hooks/useCountdown';
import { useTheme } from '../src/hooks/useTheme';
import { useFocusStore } from '../src/store/useFocusStore';
import { fmtDuration } from '../src/utils/dates';

/**
 * Browser preview of the native block screen (BlockActivity.kt).
 * On Android the real screen is native so it appears even when React Native is closed.
 */
export default function BlockPreview() {
  const { c } = useTheme();
  const router = useRouter();
  const { status, stop } = useFocusStore();
  const remaining = useCountdown(status.endTime, status.active);
  const [open, setOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <View style={{ alignItems: 'center', gap: 14, maxWidth: 420 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Feather name="lock" size={32} color={c.primary} /></View>
        <Text style={{ color: c.sub, fontWeight: '700', letterSpacing: 1 }}>THIS APP IS BLOCKED</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '600', textAlign: 'center' }}>{status.active ? status.goal : 'No active session'}</Text>
        <Text testID="block-remaining" style={{ color: c.primary, fontSize: 48, fontWeight: '300', letterSpacing: -1 }}>{fmtDuration(remaining)}</Text>
        <Text style={{ color: c.sub }}>remaining. You’re doing great — keep going.</Text>
        <Button label="Back to work" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 10 }} />
        <Button label="Emergency unlock" variant="ghost" onPress={() => setOpen(true)} />
      </View>
      <EmergencyUnlock
        visible={open}
        onCancel={() => setOpen(false)}
        onConfirm={async (r) => { setOpen(false); await stop(r); router.back(); }}
      />
    </SafeAreaView>
  );
}
