export const THEME_OPTIONS = [
  {
    id: 'midnight',
    name: 'Midnight Violet',
    description: 'Deep neutral panels with a violet command color.',
    swatches: ['#0d0f13', '#181b22', '#9b6cff', '#f5c542']
  },
  {
    id: 'ember',
    name: 'Ember Desk',
    description: 'Warm charcoal surfaces with copper and rose accents.',
    swatches: ['#12100f', '#201917', '#f97343', '#ff668a']
  },
  {
    id: 'aurora',
    name: 'Aurora Glass',
    description: 'Cool ink tones with teal and blue gradients.',
    swatches: ['#071113', '#102126', '#28d9b8', '#5aa7ff']
  },
  {
    id: 'paper',
    name: 'Soft Paper',
    description: 'A calmer light workspace for long editing sessions.',
    swatches: ['#f7f3ec', '#fffaf2', '#8464ff', '#c27a27']
  }
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];

export const DEFAULT_THEME: ThemeId = 'midnight';

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEME_OPTIONS.some(theme => theme.id === value);
