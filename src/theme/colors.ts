export type Palette = {
  bg: string; card: string; cardAlt: string; text: string; sub: string; border: string;
  primary: string; primarySoft: string; success: string; successSoft: string;
  warn: string; warnSoft: string; danger: string; dangerSoft: string;
};

// Flat, airy palette: near-white surfaces, hairline borders, one indigo accent.
export const light: Palette = {
  bg: '#F7F7FB', card: '#FFFFFF', cardAlt: '#F0F0F6', text: '#14141F', sub: '#7A7A8C', border: '#ECECF3',
  primary: '#5B5BD6', primarySoft: '#EEEEFC', success: '#1FA971', successSoft: '#E3F6EE',
  warn: '#E09A2B', warnSoft: '#FDF3E1', danger: '#E5484D', dangerSoft: '#FDEBEC',
};

export const dark: Palette = {
  bg: '#0E0E14', card: '#16161F', cardAlt: '#1E1E29', text: '#F2F2F8', sub: '#8E8EA2', border: '#24242F',
  primary: '#8B8BF2', primarySoft: '#24243F', success: '#3DD598', successSoft: '#16302A',
  warn: '#F2B24C', warnSoft: '#33290F', danger: '#FF6B70', dangerSoft: '#3A1A1C',
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
