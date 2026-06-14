export const colors = {
  // Brand blue palette (from Figma)
  brand: {
    darkest: '#081520',
    darker:  '#0D2233',
    dark:    '#092B43',
    primary: '#22618D',
    mid:     '#337EB2',
    light:   '#3D749B',
    lighter: '#5FA7D6',
    muted:   '#7A9FBB',
    pale:    '#7BC4F3',
    faint:   '#9CBACD',
    ghost:   '#AFC5D4',
    soft:    '#C0D9E8',
    pastel:  '#CBDFEB',
    subtle:  '#DEE8EF',
    whisper: '#EAEDF0',
  },

  // Semantic
  background: '#081520',
  surface:    '#0D2233',
  primary:    '#22618D',
  accent:     '#0077FF',

  // Text
  text: {
    primary:   '#FFFFFF',
    secondary: '#7A9FBB',
    disabled:  '#AFC5D4',
    inverse:   '#1C1C1E',
  },

  // Status
  success: '#34A853',
  error:   '#E94235',
  warning: '#FABB05',
  info:    '#4285F4',

  // Neutral
  white:      '#FFFFFF',
  black:      '#000000',
  dark:       '#1C1C1E',
  separator:  '#D9D9D9',
  overlay:    'rgba(0,0,0,0.35)',
} as const;

// Figma gradient: #22618D → #337EB2 → #155079
export const gradients = {
  background: ['#22618D', '#337EB2', '#155079'] as string[],
  backgroundDark: ['#092B43', '#BEDBF0'] as string[],
  surface: ['#081520', '#0D2233', '#0D2233', '#081520'] as string[],
} as const;
