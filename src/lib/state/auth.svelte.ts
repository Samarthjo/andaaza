/**
 * Accounts via Supabase Auth: passwordless email link (name + email) or Google when the
 * project has it switched on. Only active when accountsEnabled; the auth client is loaded
 * lazily so builds without accounts never download it.
 *
 * Signed-in players get a profile row (andaaza_profiles: name, colour theme, mode, number
 * style) that follows them across devices, plus their synced games.
 */
import { base } from '$app/paths';
import type { AuthChangeEvent, AuthError, GoTrueClient, Session } from '@supabase/auth-js';
import { accountsEnabled, authProviders, fetchProfile, saveProfile, setAuth, SUPABASE_KEY, SUPABASE_URL, type Profile } from './online';
import { PALETTES, settings, type Palette, type Settings } from './settings.svelte';
import { readJSON, removeKey, writeJSON } from './storage';
import { syncGames } from './sync';

type Listener = (signedIn: boolean) => void;

const EMPTY: Profile = { name: null, palette: null, theme: null, number_style: null };
const clean = (s: unknown) => String(s ?? '').trim().slice(0, 24) || null;

/** Only paths inside the site, so a crafted ?next= can't send people elsewhere. */
export function safeNext(next: string | null | undefined): string {
  return next && /^\/(?!\/)/.test(next) ? next : '/';
}

function friendly(error: AuthError): string {
  const code = (error as AuthError & { code?: string }).code ?? '';
  if (code === 'email_address_not_authorized' || /not authorized/i.test(error.message))
    return 'Email login isn’t open to everyone yet. Please try again later.';
  if (code === 'over_email_send_rate_limit' || error.status === 429)
    return 'Too many login emails right now. Try again in a few minutes.';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'That email address doesn’t look right.';
  return error.message || 'Something went wrong. Try again.';
}

class AuthStore {
  session = $state<Session | null>(null);
  ready = $state(false);
  profile = $state<Profile | null>(null);
  providers = $state({ email: true, google: false });
  /** One-off message after logging in, shown as a toast. */
  notice = $state('');
  #client: GoTrueClient | null = null;
  #starting: Promise<void> | null = null;
  #listeners: Listener[] = [];
  #loadedFor: string | null = null;
  #fromLink = false;
  #queued: Partial<Profile> = {};
  #timer: ReturnType<typeof setTimeout> | undefined;

  get signedIn() {
    return this.session !== null;
  }
  get email() {
    return this.session?.user?.email ?? null;
  }
  get name() {
    return this.profile?.name ?? null;
  }

  onChange(fn: Listener) {
    this.#listeners.push(fn);
  }

  #set(session: Session | null) {
    const was = this.session !== null;
    this.session = session;
    setAuth(session?.access_token ?? null, session?.user?.id ?? null);
    const now = session !== null;
    if (was === now) return;
    settings.setSync(now ? (patch) => this.#queue(patch) : null);
    if (!now) {
      this.profile = null;
      this.#loadedFor = null;
    }
    this.#listeners.forEach((fn) => fn(now));
  }

  init(): Promise<void> {
    this.#starting ??= this.#init();
    return this.#starting;
  }

  async #init() {
    if (!accountsEnabled || typeof window === 'undefined') {
      this.ready = true;
      return;
    }
    // Arriving from a login link (or Google): greet once the session is in.
    this.#fromLink = /access_token=/.test(location.hash);
    authProviders().then((p) => (this.providers = p));
    const { AuthClient } = await import('@supabase/auth-js');
    this.#client = new AuthClient({
      url: `${SUPABASE_URL}/auth/v1`,
      headers: { apikey: SUPABASE_KEY },
      storageKey: 'andaaza-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit'
    });
    this.#client.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this.#set(session);
      // Supabase advises against awaiting other calls inside this callback.
      if (session) setTimeout(() => this.#afterSignIn(), 0);
    });
    const { data } = await this.#client.getSession();
    this.#set(data.session);
    if (data.session) await this.#afterSignIn();
    this.ready = true;
  }

  /** Load the profile, fold in what the player picked before logging in, then apply it. */
  async #afterSignIn() {
    const user = this.session?.user;
    if (!user || this.#loadedFor === user.id) return;
    this.#loadedFor = user.id;
    syncGames();

    const pendingName = clean(readJSON<string>('pendingName', ''));
    const wanted = readJSON<string>('pendingPalette', '');
    const pendingPalette = PALETTES.some((p) => p.id === wanted) ? (wanted as Palette) : null;
    const metaName = clean(user.user_metadata?.name ?? user.user_metadata?.full_name);

    const stored = await fetchProfile();
    const current = stored ?? EMPTY;
    const local = settings.value;
    const patch: Partial<Profile> = {};
    if (pendingName && pendingName !== current.name) patch.name = pendingName;
    else if (!current.name && metaName) patch.name = metaName;
    if (pendingPalette) patch.palette = pendingPalette;
    // A fresh profile starts from the look this device already uses. If the profile
    // couldn't be read, only send what the player just chose.
    if (stored) {
      if (!pendingPalette && !current.palette) patch.palette = local.palette;
      if (!current.theme) patch.theme = local.theme;
      if (!current.number_style) patch.number_style = local.numberStyle;
    }
    if (Object.keys(patch).length) saveProfile(patch);
    removeKey('pendingName');
    removeKey('pendingPalette');

    const merged = { ...current, ...patch };
    this.profile = merged;
    settings.fromProfile(stored ? merged : patch);
    if (this.#fromLink) {
      this.#fromLink = false;
      this.notice = `Welcome${merged.name ? `, ${merged.name}` : ''}! Colour themes are unlocked.`;
    }
  }

  /** Save a signed-in player's settings changes to their profile (batched). */
  #queue(patch: Partial<Settings>) {
    if (patch.palette) this.#queued.palette = patch.palette;
    if (patch.theme) this.#queued.theme = patch.theme;
    if (patch.numberStyle) this.#queued.number_style = patch.numberStyle;
    if (patch.nickname !== undefined) this.#queued.name = clean(patch.nickname);
    if (!Object.keys(this.#queued).length) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const p = this.#queued;
      this.#queued = {};
      if (this.profile) this.profile = { ...this.profile, ...p };
      saveProfile(p);
    }, 400);
  }

  /** A guest picked a locked theme: remember it so it applies right after logging in. */
  want(palette: Palette) {
    writeJSON('pendingPalette', palette);
  }

  /** Email a login link. Returns an error message, or null when sent. */
  async sendLink(email: string, name: string, next = '/'): Promise<string | null> {
    await this.init();
    if (!this.#client) return 'Login isn’t available right now. Try again in a moment.';
    writeJSON('pendingName', name);
    const { error } = await this.#client.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}${base}${safeNext(next)}`,
        shouldCreateUser: true,
        data: { name, full_name: name }
      }
    });
    return error ? friendly(error) : null;
  }

  /** Off to Google; the session comes back in the URL. */
  async signInWithGoogle(next = '/'): Promise<string | null> {
    await this.init();
    if (!this.#client) return 'Login isn’t available right now. Try again in a moment.';
    const { error } = await this.#client.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}${base}${safeNext(next)}` }
    });
    return error ? friendly(error) : null;
  }

  async signOut() {
    await this.#client?.signOut();
    this.#set(null);
    settings.fromProfile({ name: null });
  }
}

export const auth = new AuthStore();
