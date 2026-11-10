<script lang="ts">
  import { base } from '$app/paths';
  import Icon from '$lib/components/Icon.svelte';

  type Item = { q: string; a: string; link?: { href: string; label: string } };
  const items: Item[] = [
    { q: 'When does the new puzzle come out?', a: 'Every night at 12:00 midnight India time.' },
    {
      q: 'Can I play puzzles I missed?',
      a: 'Yes. Every past puzzle is in the archive. Only the daily one counts toward your streak.',
      link: { href: `${base}/archive`, label: 'Open the archive' }
    },
    { q: 'Is using the calculator cheating?', a: 'No. Working it out is the point. Looking up the answer is the only cheat.' },
    {
      q: 'Where do the answers come from?',
      a: 'Census data, ministries, the Election Commission, ISRO and official sports records. Every answer names its source and year.'
    },
    {
      q: 'Can I suggest a question?',
      a: 'Yes, and add a source for the answer if you have one.',
      link: { href: `${base}/submit`, label: 'Suggest a question' }
    }
  ];
</script>

<section class="faq" aria-labelledby="faq-title">
  <h2 id="faq-title">FAQ</h2>
  <ul class="card-list">
    {#each items as item (item.q)}
      <li>
        <details>
          <summary>
            <span>{item.q}</span>
            <span class="chev"><Icon name="chevron-down" size={18} /></span>
          </summary>
          <p>
            {item.a}
            {#if item.link}<a href={item.link.href}>{item.link.label}</a>{/if}
          </p>
        </details>
      </li>
    {/each}
  </ul>
</section>

<style>
  .faq {
    padding: 4rem var(--gutter) 0;
    display: grid;
    gap: 1rem;
    max-width: 38rem;
    margin: 0 auto;
    width: 100%;
  }
  h2 {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: clamp(1.9rem, 6vw, 2.3rem);
    letter-spacing: -0.02em;
    text-align: center;
  }
  @media (min-width: 48rem) {
    h2 {
      text-align: left;
    }
  }
  summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.95rem 1.1rem;
    font-weight: 600;
    font-size: var(--t-sm);
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: color-mix(in srgb, var(--page-2) 45%, transparent);
  }
  .chev {
    display: grid;
    color: var(--ink-soft);
    transition: transform 0.25s ease;
  }
  details[open] .chev {
    transform: rotate(180deg);
  }
  details p {
    padding: 0 1.1rem 1rem;
    color: var(--ink-soft);
    font-size: var(--t-sm);
    max-width: 34rem;
  }
  details p a {
    margin-left: 0.25rem;
    font-weight: 600;
    color: var(--ink);
  }
</style>
