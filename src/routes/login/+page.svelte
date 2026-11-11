<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { base } from '$app/paths';
  import Icon from '$lib/components/Icon.svelte';
  import { auth, safeNext } from '$lib/state/auth.svelte';
  import { accountsEnabled } from '$lib/state/online';
  import { PALETTES } from '$lib/state/settings.svelte';
  import { readJSON } from '$lib/state/storage';

  let next = $state('/');
  let wanted = $state<(typeof PALETTES)[number] | null>(null);
  let name = $state('');
  let email = $state('');
  let sending = $state(false);
  let sentTo = $state('');
  let error = $state('');
  let code = $state('');
  let verifying = $state(false);
  let nameEl: HTMLInputElement | undefined = $state();
  let emailEl: HTMLInputElement | undefined = $state();

  // Read on the client: the page is prerendered, so query params aren't known at build time.
  onMount(() => {
    next = safeNext(new URLSearchParams(location.search).get('next'));
    const w = readJSON<string>('pendingPalette', '');
    wanted = PALETTES.find((p) => p.id === w) ?? null;
    name = readJSON<string>('pendingName', '');
  });

  const back = $derived(`${base}${next}`);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    const n = name.trim().slice(0, 24);
    const m = email.trim();
    if (!n) {
      error = 'Add a name. A nickname is fine.';
      nameEl?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) {
      error = 'That email address doesn’t look right.';
      emailEl?.focus();
      return;
    }
    sending = true;
    const err = await auth.sendLink(m, n, next);
    sending = false;
    if (err) error = err;
    else sentTo = m;
  }

  async function submitCode(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    const c = code.replace(/\D/g, '');
    if (c.length < 6) {
      error = 'Type the code from the email (6 digits).';
      return;
    }
    verifying = true;
    const err = await auth.verifyCode(sentTo, c);
    verifying = false;
    if (err) error = err;
  }

  async function google() {
    error = '';
    const err = await auth.signInWithGoogle(next);
    if (err) error = err;
  }
</script>

<Meta title="Log in to Andaaza" description="Pick a colour theme, keep your streak on every device and join the leaderboard. You never need an account to play." />
<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="wrap">
  <div class="card" in:fly={{ y: 16, duration: 360 }}>
    <a class="back" href={back}><span aria-hidden="true">←</span> Back to the game</a>

    <p class="eyebrow">Andaaza account</p>
    <h1>Your guesses, on every device.</h1>
    <p class="lead">
      Log in to pick a colour theme, keep your streak on every device and join the leaderboard. You never need an account to
      play.
    </p>

    {#if !accountsEnabled}
      <p class="note">Accounts aren’t switched on for this copy of Andaaza.</p>
    {:else if auth.signedIn}
      <div class="done" role="status">
        <p>You’re logged in as <strong>{auth.name ?? auth.email}</strong>{#if auth.name}<span class="soft"> · {auth.email}</span>{/if}.</p>
        <a class="primary" href={back}>Back to the game</a>
        <button class="textbtn" onclick={() => auth.signOut()}>Log out</button>
      </div>
    {:else if sentTo}
      <div class="sent" role="status" in:fly={{ y: 10, duration: 260 }}>
        <span class="mailicon" aria-hidden="true"><Icon name="mail" size={26} /></span>
        <h2>Check your inbox</h2>
        <p>We sent a login link to <strong>{sentTo}</strong>. Open it once, on this device.</p>
        <form class="code" onsubmit={submitCode} novalidate>
          <label for="login-code">Reading it on another device? Type the code instead</label>
          <div class="coderow">
            <input
              id="login-code"
              bind:value={code}
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="10"
              placeholder="123456"
            />
            <button class="primary" type="submit" disabled={verifying}>{verifying ? 'Checking…' : 'Log in'}</button>
          </div>
          {#if error}<p class="err" role="alert">{error}</p>{/if}
        </form>
        <p class="soft small">
          Nothing there? Check spam, or <button class="textbtn" onclick={() => ((sentTo = ''), (error = ''))}>use another email</button>.
        </p>
      </div>
    {:else}
      {#if wanted}
        <p class="want">
          <span class="dots" aria-hidden="true">{#each wanted.swatch as c (c)}<span style="background:{c}"></span>{/each}</span>
          Log in to switch to {wanted.name}.
        </p>
      {/if}

      <button class="google" type="button" onclick={google}>
          <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>
        <div class="or" aria-hidden="true"><span>or</span></div>

      <form onsubmit={submit} novalidate>
        <label for="login-name">Name</label>
        <input
          id="login-name"
          bind:this={nameEl}
          bind:value={name}
          autocomplete="nickname"
          maxlength="24"
          placeholder="What should we call you?"
          aria-describedby="name-hint"
        />
        <p class="hint" id="name-hint">Shown on the leaderboard. A nickname is fine.</p>

        <label for="login-email">Email</label>
        <input
          id="login-email"
          bind:this={emailEl}
          bind:value={email}
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="you@example.com"
        />

        {#if error}<p class="err" role="alert">{error}</p>{/if}
        <button class="primary" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Continue with email'}</button>
        <p class="foot">No password. We email you a link that logs you in.</p>
      </form>
    {/if}
  </div>
</section>

<style>
  .wrap {
    display: grid;
    place-items: start center;
    padding: 0.5rem 0 2rem;
  }
  .card {
    --cta-bg: #1b1a2e;
    --cta-ink: var(--haldi);
    width: 100%;
    max-width: 34rem;
    padding: clamp(1.6rem, 6vw, 3rem);
    border-radius: 32px;
    background: var(--surface);
    box-shadow:
      0 1px 0 rgb(0 0 0 / 0.04),
      0 30px 60px -30px rgb(0 0 0 / 0.35);
    display: grid;
    gap: 1rem;
  }
  :global(:root[data-theme='dark']) .card {
    --cta-bg: var(--haldi);
    --cta-ink: #1b1a2e;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root[data-theme='system']) .card {
      --cta-bg: var(--haldi);
      --cta-ink: #1b1a2e;
    }
  }
  .back {
    justify-self: start;
    color: var(--ink-soft);
    font-weight: 700;
    text-decoration: none;
  }
  .back:hover {
    color: var(--ink);
  }
  .eyebrow {
    margin-top: 0.9rem;
    color: var(--binding);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  h1 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(2.5rem, 9vw, 3.4rem);
    line-height: 1.02;
    letter-spacing: -0.04em;
    max-width: 11ch;
  }
  .lead {
    color: var(--ink-soft);
    font-size: 1.1rem;
    line-height: 1.5;
    max-width: 30rem;
    margin-bottom: 0.6rem;
  }
  .want {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    background: color-mix(in srgb, var(--ink) 5%, transparent);
    font-weight: 700;
  }
  .dots {
    display: inline-flex;
  }
  .dots span {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    border: 1.5px solid var(--surface);
  }
  .dots span + span {
    margin-left: -0.35rem;
  }
  .google,
  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 3.5rem;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 0.2s var(--ease-out),
      background-color 0.2s ease;
  }
  .google {
    border: 1.5px solid color-mix(in srgb, var(--ink) 55%, transparent);
    background: #fff;
    color: #1f1f1f;
  }
  .primary {
    border: none;
    background: var(--cta-bg);
    color: var(--cta-ink);
    font-weight: 800;
  }
  .google:hover,
  .primary:hover {
    transform: translateY(-1px);
  }
  .google:active,
  .primary:active {
    transform: scale(0.98);
  }
  .primary[disabled] {
    opacity: 0.6;
    cursor: progress;
    transform: none;
  }
  .or {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .or::before,
  .or::after {
    content: '';
    flex: 1;
    border-top: 1.5px solid var(--rule);
  }
  form {
    display: grid;
    gap: 0.5rem;
  }
  label {
    margin-top: 0.5rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  input {
    width: 100%;
    min-height: 3.5rem;
    padding: 0 1.1rem;
    border: 2px solid var(--rule);
    border-radius: 18px;
    background: #fff;
    color: #1b1a2e;
    font-size: 1.1rem;
  }
  input::placeholder {
    color: #8a8a96;
  }
  input:focus {
    outline: none;
    border-color: var(--binding);
  }
  .hint {
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
  .err {
    margin-top: 0.3rem;
    color: var(--bad);
    font-weight: 700;
  }
  form .primary {
    margin-top: 1rem;
  }
  .foot {
    margin-top: 0.4rem;
    text-align: center;
    color: var(--ink-soft);
    font-size: 0.92rem;
  }
  .sent,
  .done {
    display: grid;
    gap: 0.7rem;
    justify-items: start;
    padding: 1.25rem;
    border-radius: 20px;
    background: color-mix(in srgb, var(--ink) 5%, transparent);
    overflow-wrap: anywhere;
  }
  .code {
    width: 100%;
    margin-top: 0.4rem;
  }
  .code label {
    margin-top: 0;
    letter-spacing: 0.06em;
    text-transform: none;
    font-size: 0.92rem;
  }
  .coderow {
    display: flex;
    gap: 0.5rem;
  }
  .coderow input {
    flex: 1;
    min-width: 0;
    width: 0;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.3em;
  }
  .coderow .primary {
    width: auto;
    padding: 0 1.4rem;
    flex: none;
  }
  .sent h2 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: 1.5rem;
  }
  .mailicon {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 999px;
    background: var(--cta-bg);
    color: var(--cta-ink);
  }
  .done .primary {
    margin-top: 0.3rem;
  }
  .soft {
    color: var(--ink-soft);
  }
  .small {
    font-size: 0.92rem;
  }
  .textbtn {
    border: none;
    background: none;
    padding: 0;
    color: var(--answer);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .textbtn:hover {
    text-decoration: underline;
  }
  .note {
    font-weight: 700;
  }
</style>
