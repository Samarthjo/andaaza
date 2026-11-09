<script lang="ts">
  import { base } from '$app/paths';
  import { PALETTES, settings, type Theme } from '$lib/state/settings.svelte';
  import { clearAll } from '$lib/state/storage';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let dialog: HTMLDialogElement | undefined = $state();
  let confirmReset = $state(false);

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });

  const themes: { id: Theme; label: string }[] = [
    { id: 'system', label: 'Match device' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' }
  ];

  function reset() {
    if (!confirmReset) {
      confirmReset = true;
      return;
    }
    clearAll();
    settings.load();
    confirmReset = false;
    open = false;
    location.href = `${base}/`;
  }
</script>

<dialog
  bind:this={dialog}
  onclose={() => {
    open = false;
    confirmReset = false;
  }}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
  aria-labelledby="settings-title"
>
  <div class="sheet">
    <header>
      <h2 id="settings-title">Settings</h2>
      <button class="btn quiet" onclick={() => (open = false)} aria-label="Close settings">Close</button>
    </header>

    <fieldset>
      <legend>Paper</legend>
      <div class="palettes">
        {#each PALETTES as p (p.id)}
          <button
            class="palette"
            aria-pressed={settings.value.palette === p.id}
            onclick={() => settings.update({ palette: p.id })}
          >
            <span class="swatch" style="--a:{p.swatch[0]};--b:{p.swatch[1]}"></span>
            <span class="pname">{p.name}</span>
            <span class="phint">{p.hint}</span>
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Light or dark</legend>
      <div class="row">
        {#each themes as t (t.id)}
          <button class="chip" aria-pressed={settings.value.theme === t.id} onclick={() => settings.update({ theme: t.id })}>
            {t.label}
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Big numbers</legend>
      <div class="row">
        <button
          class="chip"
          aria-pressed={settings.value.numberStyle === 'indian'}
          onclick={() => settings.update({ numberStyle: 'indian' })}>Lakh and crore</button
        >
        <button
          class="chip"
          aria-pressed={settings.value.numberStyle === 'international'}
          onclick={() => settings.update({ numberStyle: 'international' })}>Million and billion</button
        >
      </div>
      <p class="help">You can type either way when guessing: 40 lakh and 4 million both work.</p>
    </fieldset>

    <fieldset>
      <legend>Your data</legend>
      <p class="help">Games and stats are saved in this browser only.</p>
      <button class="btn secondary danger" onclick={reset}>
        {confirmReset ? 'Tap again to erase everything' : 'Erase my games and stats'}
      </button>
    </fieldset>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    margin: auto auto 0;
    width: min(100%, 32rem);
    max-height: 92dvh;
    border-radius: 18px 18px 0 0;
    background: var(--page);
    color: var(--ink);
    box-shadow: 0 -12px 40px rgb(0 0 0 / 0.25);
  }
  @media (min-width: 40rem) {
    dialog {
      margin: auto;
      border-radius: 18px;
    }
  }
  dialog::backdrop {
    background: rgb(10 8 6 / 0.45);
  }
  .sheet {
    padding: 1rem 1.25rem 1.5rem;
    display: grid;
    gap: 1.1rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    font-size: var(--t-xl);
  }
  fieldset {
    border: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }
  legend {
    font-weight: 600;
    margin-bottom: 0.4rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .palettes {
    display: grid;
    gap: 0.5rem;
  }
  .palette {
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    grid-template-rows: auto auto;
    column-gap: 0.75rem;
    align-items: center;
    text-align: left;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius);
    border: 2px solid var(--rule);
    background: var(--page-2);
    cursor: pointer;
  }
  .palette[aria-pressed='true'] {
    border-color: var(--binding);
  }
  .swatch {
    grid-row: span 2;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--b) 0 30%, var(--a) 30%);
    border: 1px solid rgb(0 0 0 / 0.15);
  }
  .pname {
    font-weight: 600;
  }
  .phint,
  .help {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .danger {
    color: var(--bad);
    border-color: var(--bad);
    justify-self: start;
  }
</style>
