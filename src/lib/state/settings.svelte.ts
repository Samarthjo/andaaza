import type { NumberStyle } from '$lib/core/number';
import { readJSON, writeJSON } from './storage';

export type Theme = 'system' | 'light' | 'dark';
export type Palette = 'haldi' | 'gulabi' | 'neel' | 'mehendi';

export interface Settings {
  theme: Theme;
  palette: Palette;
  numberStyle: NumberStyle;
  nickname: string;
}

const DEFAULTS: Settings = {
  theme: 'system',
  palette: 'haldi',
  numberStyle: 'indian',
  nickname: ''
};

export const PALETTES: {
  id: Palette;
  name: string;
  swatch: [string, string, string];
}[] = [
  { id: 'haldi', name: 'Haldi', swatch: ['#d6432b', '#2c3a9b', '#f2c230'] },
  { id: 'gulabi', name: 'Gulabi', swatch: ['#f4c6d4', '#b0306a', '#7aa874'] },
  { id: 'neel', name: 'Neel', swatch: ['#c9d2f5', '#26338c', '#f2c230'] },
  { id: 'mehendi', name: 'Mehendi', swatch: ['#dde2bf', '#3f5a1a', '#b07a2a'] }
];

class SettingsStore {
  value = $state<Settings>({ ...DEFAULTS });

  load() {
    const saved = readJSON<Partial<Settings> & { paletteActive?: unknown }>('settings', {});
    delete saved.paletteActive; // left over from when colour themes needed a login
    this.value = { ...DEFAULTS, ...saved };
    if (!PALETTES.some((p) => p.id === this.value.palette)) this.value.palette = DEFAULTS.palette;
    this.apply();
  }

  update(patch: Partial<Settings>) {
    this.value = { ...this.value, ...patch };
    this.apply();
  }

  apply() {
    writeJSON('settings', this.value);
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    el.dataset.palette = this.value.palette;
    el.dataset.theme = this.value.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--binding').trim() || '#9e1b1b');
  }
}

export const settings = new SettingsStore();
