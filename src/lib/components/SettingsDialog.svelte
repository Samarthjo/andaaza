<script lang="ts">
  import { base } from '$app/paths';
  import { PALETTES, settings, type Theme } from '$lib/state/settings.svelte';
  import { clearAll } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let confirmReset = $state(false);
  $effect(() => {
    if (!open) confirmReset = false;
  });

  const themes: { id: Theme; label: string }[] = [
    { id: 'system', label: 'Auto' },
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

<Sheet bind:open side="right" labelledby="settings-title">
  <div class="sheet">
    <header>
      <h2 id="settings-title">Settings</h2>
      <button class="icon-btn" onclick={() => (open = false)} aria-label="Close settings"><Icon name="x" size={20} /></button>
    </header>

    <fieldset>
      <legend>Colour</legend>
      <div class="palettes">
        {#each PALETTES as p (p.id)}
          <button class="palette" aria-pressed={settings.value.palette === p.id} onclick={() => settings.update({ palette: p.id })}>
            <span class="swatch" style="--a:{p.swatch[0]};--b:{p.swatch[1]}"></span>
            <span class="pname">{p.name}</span>
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Mode</legend>
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
    </fieldset>

    <button class="reset" onclick={reset}>
      {confirmReset ? 'Tap again to erase all games and stats' : 'Erase my games and stats'}
    </button>
  </div>
</Sheet>

<style>
  .sheet {
    padding: 1rem 1.25rem 1.5rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  .palette {
    display: grid;
    justify-items: center;
    gap: 0.35rem;
    padding: 0.6rem 0.4rem;
    border-radius: 14px;
    border: 2px solid transparent;
    background: var(--surface);
    box-shadow: var(--shadow);
    cursor: pointer;
  }
  .palette[aria-pressed='true'] {
    border-color: var(--binding);
  }
  .swatch {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 999px;
    background: conic-gradient(var(--b) 0 50%, var(--a) 50%);
    border: 1px solid rgb(0 0 0 / 0.15);
  }
  .pname {
    font-weight: 600;
    font-size: var(--t-sm);
  }
  .reset {
    justify-self: start;
    background: none;
    border: none;
    padding: 0.25rem 0;
    color: var(--bad);
    font-size: var(--t-sm);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
