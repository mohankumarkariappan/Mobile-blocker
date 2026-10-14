import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import AppBlocker, { type PermissionType } from '../../modules/app-blocker';
import { useTheme } from '../hooks/useTheme';
import { useFocusStore } from '../store/useFocusStore';
import { Button, Card } from './ui';

type Item = { type: PermissionType; icon: keyof typeof Feather.glyphMap; title: string; why: string; required: boolean };

const ITEMS: Item[] = [
  { type: 'accessibility', icon: 'eye', title: 'Accessibility service', why: 'Lets FocusDay notice when a blocked app opens. On Android 13+ sideloaded builds you may first need App info → ⋮ → “Allow restricted settings”.', required: true },
  { type: 'overlay', icon: 'layers', title: 'Display over other apps', why: 'Needed to show the block screen on top of the blocked app.', required: true },
  { type: 'notifications', icon: 'bell', title: 'Notifications', why: 'Shows the live countdown while a focus session is running.', required: false },
  { type: 'battery', icon: 'battery-charging', title: 'Battery optimization', why: 'Choose “Unrestricted / Don’t optimize” so Android doesn’t stop blocking in the background.', required: false },
  { type: 'autostart', icon: 'zap', title: 'Autostart (Xiaomi / Oppo / Vivo)', why: 'These phones kill background apps unless autostart is allowed. Android cannot tell us if it’s on — tick it once you’ve done it.', required: false },
];

export function PermissionList() {
  const { c } = useTheme();
  const { perms, refreshPerms } = useFocusStore();
  const [confirmedAuto, setConfirmedAuto] = useState(false);

  const check = useCallback(() => { refreshPerms(); }, [refreshPerms]);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  if (!perms) return null;
  const granted = (t: PermissionType) => (t === 'autostart' ? confirmedAuto || perms.autostart : perms[t]);

  return (
    <View style={{ gap: 12 }}>
      {ITEMS.filter((i) => i.type !== 'autostart' || perms.autostartSupported).map((i) => {
        const ok = granted(i.type);
        return (
          <Card key={i.type} style={{ gap: 8, borderColor: ok ? c.success : c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Feather name={i.icon} size={18} color={c.primary} /></View>
              <Text style={{ color: c.text, fontWeight: '600', flex: 1 }}>{i.title}{i.required ? ' *' : ''}</Text>
              {ok ? <Feather name="check-circle" size={20} color={c.success} /> : <Text style={{ color: c.sub, fontWeight: '500' }}>Off</Text>}
            </View>
            <Text style={{ color: c.sub, fontSize: 13 }}>{i.why}</Text>
            {!ok && (
              <Button
                label={i.type === 'autostart' ? 'Open autostart settings' : 'Enable'}
                variant="soft"
                onPress={async () => { await AppBlocker.openPermissionSettings(i.type); if (i.type === 'autostart') setConfirmedAuto(true); check(); }}
              />
            )}
          </Card>
        );
      })}
    </View>
  );
}
