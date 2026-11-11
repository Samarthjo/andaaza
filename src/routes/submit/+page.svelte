<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import { online, submitQuestion } from '$lib/state/online';
  import { copyText } from '$lib/share';

  let question = $state('');
  let answer = $state('');
  let source = $state('');
  let name = $state('');
  let status = $state<'idle' | 'sending' | 'sent' | 'error' | 'copied'>('idle');

  const valid = $derived(question.trim().length >= 15);

  async function send(e: Event) {
    e.preventDefault();
    if (!valid) return;
    if (online) {
      status = 'sending';
      const r = await submitQuestion({ question, answer, source, name });
      status = r === null ? 'error' : 'sent';
      if (status === 'sent') question = answer = source = '';
    } else {
      const text = `Andaaza question idea\n\nQuestion: ${question}\nAnswer: ${answer || 'not sure'}\nSource: ${source || 'none'}\nFrom: ${name || 'anonymous'}`;
      status = (await copyText(text)) ? 'copied' : 'error';
    }
  }
</script>

<Meta title="Suggest a question for Andaaza" description="Know a number about India that would make a great puzzle? Send it in." />

<section class="page">
  <h1>Suggest a question</h1>
  <p class="sub">Something about India that sounds impossible to know but can be worked out.</p>

  <form class="surface" onsubmit={send}>
    <label for="q">Your question</label>
    <textarea id="q" rows="3" bind:value={question} maxlength="400" placeholder="How many auto-rickshaws are there in Delhi?"
    ></textarea>

    <label for="a">The answer, if you know it</label>
    <input id="a" bind:value={answer} maxlength="120" placeholder="About 1 lakh" />

    <label for="s">Where the answer comes from</label>
    <input id="s" bind:value={source} maxlength="300" placeholder="Report, website or news article" />

    <label for="n">Your name (shown if we use it)</label>
    <input id="n" bind:value={name} maxlength="60" placeholder="Optional" />

    <button class="btn" type="submit" disabled={!valid || status === 'sending'}>
      {online ? (status === 'sending' ? 'Sending…' : 'Send question') : 'Copy question to send'}
    </button>

    <p class="status" role="status">
      {#if status === 'sent'}Thanks, your question is in the pile. Good ones show up in a future puzzle.
      {:else if status === 'copied'}Copied. Paste it in a message to the people who run this site.
      {:else if status === 'error'}That didn’t go through. Check your connection and send again.
      {:else if !valid && question.length > 0}Questions need at least 15 characters.{/if}
    </p>
  </form>
</section>

<style>
  .page {
    max-width: 40rem;
    margin: 0 auto;
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  .sub {
    color: var(--ink-soft);
    max-width: 34rem;
  }
  form {
    display: grid;
    gap: 0.45rem;
    padding: 0.75rem 1.25rem 1.5rem;
  }
  label {
    font-weight: 600;
    margin-top: 0.6rem;
  }
  input,
  textarea {
    width: 100%;
    min-height: 3rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius);
    border: 2px solid var(--rule);
    background: var(--page-2);
    resize: vertical;
  }
  .btn {
    margin-top: 1rem;
    justify-self: start;
  }
  .status {
    min-height: 1.4em;
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
</style>
