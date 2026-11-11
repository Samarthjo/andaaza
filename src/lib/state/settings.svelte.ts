import type { NumberStyle } from '$lib/core/number';
import { accountsEnabled } from './online';
import { readJSON, writeJSON } from './storage';

export type Theme = 'system' | 'light' | 'dark';
export type Palette = 'haldi' | 'gulabi' | 'neel' | 'mehendi';

export interface Settings {
  theme: Theme;
  palette: Palette;
  numberStyle: NumberStyle;
  nickname: string;
  /** The palette actually applied (guests stay on Haldi when accounts are on). Read by app.html before paint. */
  paletteActive?: Palette;
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

/** The look and name kept on a signed-in player's profile. */
export interface ProfileFields {
  name?: string | null;
  palette?: string | null;
  theme?: string | null;
  number_style?: string | null;
}

class SettingsStore {
  value = $state<Settings>({ ...DEFAULTS });
  /** Colour themes are a signed-in perk when accounts are enabled. */
  unlocked = $state(!accountsEnabled);
  #sync: ((patch: Partial<Settings>) => void) | null = null;

  /** Receives each change a signed-in player makes, so it can be saved to their profile. */
  setSync(fn: ((patch: Partial<Settings>) => void) | null) {
    this.#sync = fn;
  }

  /** Take the look and name saved on the player's profile, without echoing it back. */
  fromProfile(p: ProfileFields) {
    const patch: Partial<Settings> = {};
    if (PALETTES.some((x) => x.id === p.palette)) patch.palette = p.palette as Palette;
    if (p.theme === 'system' || p.theme === 'light' || p.theme === 'dark') patch.theme = p.theme;
    if (p.number_style === 'indian' || p.number_style === 'international') patch.numberStyle = p.number_style;
    if (p.name !== undefined) patch.nickname = p.name ?? '';
    this.value = { ...this.value, ...patch };
    this.apply();
  }

  load() {
    const saved = readJSON<Partial<Settings>>('settings', {});
    this.value = { ...DEFAULTS, ...saved };
    this.apply();
  }

  update(patch: Partial<Settings>) {
    this.value = { ...this.value, ...patch };
    this.apply();
    this.#sync?.(patch);
  }

  setUnlocked(v: boolean) {
    this.unlocked = v || !accountsEnabled;
    this.apply();
  }

  get activePalette(): Palette {
    return this.unlocked ? this.value.palette : 'haldi';
  }

  apply() {
    this.value.paletteActive = this.activePalette;
    writeJSON('settings', this.value);
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    el.dataset.palette = this.activePalette;
    el.dataset.theme = this.value.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--binding').trim() || '#9e1b1b');
  }
}

export const settings = new SettingsStore();
