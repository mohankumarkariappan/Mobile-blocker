import React from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PermissionList } from '../../src/components/PermissionList';
import { Button, Card, Chip, Heading, useToast } from '../../src/components/ui';
import { useTheme } from '../../src/hooks/useTheme';
import { useFocusStore } from '../../src/store/useFocusStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function Settings() {
  const { c } = useTheme();
  const toast = useToast();
  const { theme, setTheme, setOnboarded } = useSettingsStore();
  const clearHistory = useFocusStore((s) => s.clearHistory);

  const confirmClear = () => {
    const run = async () => { await clearHistory(); toast('History cleared.'); };
    if (Platform.OS === 'web') { if (window.confirm('Clear all focus history?')) run(); return; }
    Alert.alert('Clear history?', 'This removes all saved focus sessions.', [
      { text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}>
        <Heading sub="Make it yours">Settings</Heading>

        <Card style={{ gap: 10 }}>
          <Text style={{ color: c.text, fontWeight: '700' }}>Appearance</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="System" selected={theme === 'system'} onPress={() => setTheme('system')} />
            <Chip label="Light" selected={theme === 'light'} onPress={() => setTheme('light')} />
            <Chip label="Dark" selected={theme === 'dark'} onPress={() => setTheme('dark')} />
          </View>
        </Card>

        <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Permissions</Text>
        <PermissionList />

        <Button label="Clear focus history" variant="danger" onPress={confirmClear} />
        <Button label="Show welcome screen again" variant="ghost" onPress={() => setOnboarded(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}
