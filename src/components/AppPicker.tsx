import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { InstalledApp } from '../../modules/app-blocker';
import { tap } from './ui';

export function AppPicker({ apps, selected, onChange }: { apps: InstalledApp[]; selected: string[]; onChange: (p: string[]) => void }) {
  const { c } = useTheme();
  const [q, setQ] = useState('');
  const list = useMemo(() => apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())), [apps, q]);
  const set = new Set(selected);

  const toggle = (p: string) => {
    tap('light');
    onChange(set.has(p) ? selected.filter((x) => x !== p) : [...selected, p]);
  };

  return (
    <View>
      <TextInput value={q} onChangeText={setQ} placeholder="Search apps" placeholderTextColor={c.sub}
        style={{ color: c.text, backgroundColor: c.cardAlt, borderRadius: 14, padding: 10, marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((a) => {
          const on = set.has(a.packageName);
          return (
            <Pressable key={a.packageName} testID={`app-${a.packageName}`} onPress={() => toggle(a.packageName)}
              style={{
                width: '31%', flexGrow: 1, minWidth: 96, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14,
                backgroundColor: on ? c.primarySoft : c.card, borderWidth: 1.5, borderColor: on ? c.primary : c.border,
              }}>
              {a.icon ? (
                <Image source={{ uri: `data:image/png;base64,${a.icon}` }} style={{ width: 44, height: 44, borderRadius: 10 }} />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.primary + '33', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.primary, fontWeight: '800', fontSize: 18 }}>{a.name[0]}</Text>
                </View>
              )}
              <Text numberOfLines={1} style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 6 }}>{a.name}</Text>
              {on ? <View style={{ position: 'absolute', top: 6, right: 6 }}><Feather name="check-circle" size={15} color={c.primary} /></View> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
