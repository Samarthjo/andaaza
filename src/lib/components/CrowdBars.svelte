<script lang="ts">
  let {
    counts,
    mine,
    labels,
    caption
  }: { counts: number[]; mine: number; labels: string[]; caption: string } = $props();

  const max = $derived(Math.max(1, ...counts));
  const total = $derived(counts.reduce((a, b) => a + b, 0));
</script>

<figure class="crowd">
  <figcaption>{caption}</figcaption>
  <div class="bars" role="img" aria-label="{caption}: {counts.map((c, i) => `${labels[i]} ${c}`).join(', ')}">
    {#each counts as c, i (i)}
      <div class="col" class:mine={i === mine}>
        <span class="bar" style="height:{Math.max(3, (c / max) * 100)}%"></span>
        <span class="lbl">{labels[i]}</span>
      </div>
    {/each}
  </div>
  <p class="n num">{total.toLocaleString('en-IN')} {total === 1 ? 'player' : 'players'}</p>
</figure>

<style>
  .crowd {
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  figcaption {
    font-weight: 600;
    font-size: var(--t-sm);
  }
  .bars {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 3px;
    height: 5.5rem;
    align-items: end;
  }
  .col {
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    align-items: end;
    gap: 0.2rem;
  }
  .bar {
    display: block;
    align-self: end;
    background: var(--rule);
    border-radius: 3px 3px 0 0;
  }
  .mine .bar {
    background: var(--binding);
  }
  .lbl {
    font-size: 0.625rem;
    color: var(--ink-soft);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
  }
  .mine .lbl {
    color: var(--binding);
    font-weight: 700;
  }
  .n {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
</style>
