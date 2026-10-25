import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppPicker } from '../../src/components/AppPicker';
import { EmergencyUnlock } from '../../src/components/EmergencyUnlock';
import { ProgressRing } from '../../src/components/ProgressRing';
import { Button, Card, Chip, Heading, tap, useToast } from '../../src/components/ui';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useTheme } from '../../src/hooks/useTheme';
import { useFocusStore } from '../../src/store/useFocusStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { fmtDuration } from '../../src/utils/dates';
import { focusDoneMessage } from '../../src/utils/messages';

type Mode = '25' | '60' | 'custom' | 'until';

function endFromClock(hhmm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() <= Date.now() + 60_000) d.setDate(d.getDate() + 1); // already passed → tomorrow
  return d.getTime();
}

export default function Focus() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { status, apps, loadApps, perms, refreshPerms, draftGoal, setDraftGoal, start, startUntil, stop, justCompleted, ackCompleted } = useFocusStore();
  const { blockedDefaults, setBlockedDefaults } = useSettingsStore();

  const [goal, setGoal] = useState('');
  const [blocked, setBlocked] = useState<string[]>(blockedDefaults);
  const [mode, setMode] = useState<Mode>('25');
  const [custom, setCustom] = useState('45');
  const [until, setUntil] = useState('');
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadApps(); refreshPerms(); }, [loadApps, refreshPerms]);

  // pre-fill goal from "Start focus for this task"
  useEffect(() => {
    if (draftGoal) { setGoal(draftGoal); setDraftGoal(''); }
  }, [draftGoal, setDraftGoal]);

  // celebrate a session that finished while the screen was open
  useEffect(() => {
    if (justCompleted) { tap('success'); toast(focusDoneMessage()); ackCompleted(); }
  }, [justCompleted, ackCompleted, toast]);

  const remaining = useCountdown(status.endTime, status.active);
  const total = Math.max(1, status.endTime - status.startTime);

  const durationMs = mode === '25' ? 25 * 60_000 : mode === '60' ? 60 * 60_000 : Math.max(0, Math.round(Number(custom) || 0)) * 60_000;
  const untilEnd = mode === 'until' ? endFromClock(until) : null;
  const valid = goal.trim().length > 0 && blocked.length > 0 && (mode === 'until' ? untilEnd !== null : durationMs >= 60_000);
  const missingCore = perms ? !perms.accessibility || !perms.overlay : false;

  const begin = useCallback(async () => {
    setBusy(true);
    try {
      setBlockedDefaults(blocked);
      if (mode === 'until' && untilEnd) await startUntil(goal.trim(), blocked, untilEnd);
      else await start(goal.trim(), blocked, durationMs);
      tap('success');
      toast('Focus started. You’ve got this.');
      router.navigate('/'); // home shows the running session with its remaining time
    } finally { setBusy(false); }
  }, [blocked, durationMs, goal, mode, router, start, startUntil, untilEnd, setBlockedDefaults, toast]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Heading sub={status.active ? 'Stay with it' : 'Block distractions and get one thing done'}>Focus</Heading>

        {status.active ? (
          <>
            <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 28 }}>
              <ProgressRing progress={1 - remaining / total} size={200} stroke={16} label={fmtDuration(remaining)} sub="remaining" />
              <Text style={{ color: c.sub, fontWeight: '600' }}>Your goal</Text>
              <Text testID="active-goal" style={{ color: c.text, fontSize: 21, fontWeight: '600', textAlign: 'center' }}>{status.goal}</Text>
              <Text style={{ color: c.sub }}>{status.blockedPackages.length} apps blocked</Text>
            </Card>
            {Platform.OS === 'web' && (
              <Button label="Simulate opening a blocked app" variant="soft" onPress={() => router.push('/block-preview')} />
            )}
            <Button label="Emergency unlock" variant="danger" onPress={() => setUnlockOpen(true)} />
            <EmergencyUnlock
              visible={unlockOpen}
              onCancel={() => setUnlockOpen(false)}
              onConfirm={async (reason) => { setUnlockOpen(false); await stop(reason); toast('Session ended. Tomorrow is a fresh start.'); }}
            />
          </>
        ) : (
          <>
            {missingCore && (
              <Card style={{ backgroundColor: c.warnSoft, borderColor: c.warn }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>Blocking needs a couple of permissions</Text>
                <Text style={{ color: c.sub, marginTop: 4, marginBottom: 10 }}>Enable Accessibility and Display over other apps so blocked apps can be intercepted.</Text>
                <Button label="Set up permissions" variant="soft" onPress={() => router.push('/onboarding')} />
              </Card>
            )}

            <Card style={{ gap: 10 }}>
              <Text style={{ color: c.text, fontWeight: '700' }}>What do you want to get done?</Text>
              <TextInput testID="goal-input" value={goal} onChangeText={setGoal} placeholder="e.g. Finish the project report" placeholderTextColor={c.sub}
                style={{ color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 12, fontSize: 15 }} />
            </Card>

            <Card style={{ gap: 12 }}>
              <Text style={{ color: c.text, fontWeight: '700' }}>Duration</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label="25 min" selected={mode === '25'} onPress={() => setMode('25')} />
                <Chip label="1 hour" selected={mode === '60'} onPress={() => setMode('60')} />
                <Chip label="Custom" selected={mode === 'custom'} onPress={() => setMode('custom')} />
                <Chip label="Until time" selected={mode === 'until'} onPress={() => setMode('until')} />
              </View>
              {mode === 'custom' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TextInput testID="custom-min" value={custom} onChangeText={(t) => setCustom(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3}
                    style={{ color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 12, width: 90, fontSize: 16 }} />
                  <Text style={{ color: c.sub }}>minutes</Text>
                </View>
              )}
              {mode === 'until' && (
                <View style={{ gap: 6 }}>
                  <TextInput testID="until-time" value={until} onChangeText={setUntil} placeholder="End time, 24h (e.g. 17:30)" placeholderTextColor={c.sub} maxLength={5}
                    style={{ color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 12, fontSize: 16 }} />
                  {untilEnd ? <Text style={{ color: c.sub, fontSize: 12 }}>Ends in {Math.round((untilEnd - Date.now()) / 60000)} min</Text> : null}
                </View>
              )}
            </Card>

            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>Apps to block</Text>
                <Text style={{ color: c.primary, fontWeight: '700' }}>{blocked.length} selected</Text>
              </View>
              {Platform.OS === 'web' && (
                <Text style={{ color: c.sub, fontSize: 12 }}>
                  Browser preview shows sample apps. On your Android phone this lists only the apps installed on it, with their real icons.
                </Text>
              )}
              <AppPicker apps={apps} selected={blocked} onChange={setBlocked} />
            </Card>

            <Button label="Start focus" icon="play" disabled={!valid || busy} onPress={begin} />
            {!valid && <Text style={{ color: c.sub, textAlign: 'center', fontSize: 12 }}>Add a goal, pick at least one app and set a valid duration.</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
