import type { NumberStyle } from '$lib/core/number';
import { readJSON, writeJSON } from './storage';

export type Theme = 'system' | 'light' | 'dark';
export type Palette = 'haldi' | 'neel' | 'mehendi';

export interface Settings {
  theme: Theme;
  palette: Palette;
  numberStyle: NumberStyle;
  nickname: string;
}

const DEFAULTS: Settings = { theme: 'system', palette: 'haldi', numberStyle: 'indian', nickname: '' };

export const PALETTES: { id: Palette; name: string; hint: string; swatch: [string, string] }[] = [
  { id: 'haldi', name: 'Haldi', hint: 'Turmeric paper, bahi-red binding', swatch: ['#fbf1c7', '#9e1b1b'] },
  { id: 'neel', name: 'Neel', hint: 'Indigo-dyed cotton', swatch: ['#e9edfa', '#26338c'] },
  { id: 'mehendi', name: 'Mehendi', hint: 'Henna green on pale leaf', swatch: ['#eef0dc', '#3f5a1a'] }
];

class SettingsStore {
  value = $state<Settings>({ ...DEFAULTS });

  load() {
    const saved = readJSON<Partial<Settings>>('settings', {});
    this.value = { ...DEFAULTS, ...saved };
    this.apply();
  }

  update(patch: Partial<Settings>) {
    this.value = { ...this.value, ...patch };
    writeJSON('settings', this.value);
    this.apply();
  }

  apply() {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    el.dataset.palette = this.value.palette;
    el.dataset.theme = this.value.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--binding').trim() || '#9e1b1b');
  }
}

export const settings = new SettingsStore();
