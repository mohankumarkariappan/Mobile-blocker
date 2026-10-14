import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PermissionList } from '../src/components/PermissionList';
import { Button } from '../src/components/ui';
import { useTheme } from '../src/hooks/useTheme';
import { useFocusStore } from '../src/store/useFocusStore';
import { useSettingsStore } from '../src/store/useSettingsStore';

export default function Onboarding() {
  const { c } = useTheme();
  const perms = useFocusStore((s) => s.perms);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const coreOk = !!perms && perms.accessibility && perms.overlay;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 16, paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 6, marginTop: 10 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}><Feather name="target" size={26} color="#fff" /></View>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Welcome to FocusDay</Text>
          <Text style={{ color: c.sub, fontSize: 15 }}>Plan your day, then protect your attention. A few permissions make app blocking reliable — even when FocusDay is closed.</Text>
        </View>

        <PermissionList />

        <Button label={coreOk ? 'Continue' : 'Continue (blocking disabled)'} onPress={() => setOnboarded(true)} variant={coreOk ? 'primary' : 'soft'} />
        <Text style={{ color: c.sub, textAlign: 'center', fontSize: 12 }}>You can change this anytime in Settings. * required for blocking</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
