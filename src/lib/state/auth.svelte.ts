/**
 * Optional accounts via Supabase Auth (passwordless email link).
 * Only active when accountsEnabled; the auth client is loaded lazily so guests
 * on builds without accounts never download it.
 */
import { base } from '$app/paths';
import type { AuthChangeEvent, GoTrueClient, Session } from '@supabase/auth-js';
import { accountsEnabled, setAccessToken, SUPABASE_KEY, SUPABASE_URL } from './online';
import { syncGames } from './sync';

type Listener = (signedIn: boolean) => void;

class AuthStore {
  session = $state<Session | null>(null);
  ready = $state(false);
  #client: GoTrueClient | null = null;
  #listeners: Listener[] = [];

  get signedIn() {
    return this.session !== null;
  }
  get email() {
    return this.session?.user?.email ?? null;
  }

  onChange(fn: Listener) {
    this.#listeners.push(fn);
  }

  #set(session: Session | null) {
    const was = this.session !== null;
    this.session = session;
    setAccessToken(session?.access_token ?? null);
    if (was !== (session !== null)) this.#listeners.forEach((fn) => fn(session !== null));
  }

  async init() {
    if (!accountsEnabled || this.#client || typeof window === 'undefined') {
      this.ready = true;
      return;
    }
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
    this.#client.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.#set(session);
      if (event === 'SIGNED_IN') syncGames();
    });
    const { data } = await this.#client.getSession();
    this.#set(data.session);
    if (data.session) syncGames();
    this.ready = true;
  }

  /** Email a sign-in link. Returns an error message, or null when sent. */
  async sendLink(email: string): Promise<string | null> {
    if (!this.#client) return 'Sign-in isn’t available right now.';
    const { error } = await this.#client.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}${base}/`,
        shouldCreateUser: true
      }
    });
    return error ? error.message : null;
  }

  async signOut() {
    await this.#client?.signOut();
    this.#set(null);
  }
}

export const auth = new AuthStore();
