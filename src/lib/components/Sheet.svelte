<!--
  Animated modal sheet built on <dialog> (focus trap, Escape, inert page for free).
  side="bottom": slides up. side="left": full-height panel from the left.
  side="right": bottom sheet on phones, full-height panel from the right on wide screens.
  Closing plays the exit animation before the dialog actually closes.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    side = 'bottom',
    wide = false,
    labelledby,
    children
  }: { open: boolean; side?: 'bottom' | 'left' | 'right'; wide?: boolean; labelledby: string; children: Snippet } = $props();

  let el: HTMLDialogElement | undefined = $state();
  let closing = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (!el) return;
    if (open && !el.open) {
      clearTimeout(timer);
      closing = false;
      el.showModal();
    } else if (!open && el.open && !closing) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      closing = true;
      timer = setTimeout(() => {
        el?.close();
        closing = false;
      }, reduce ? 0 : 230);
    }
  });
</script>

<dialog
  bind:this={el}
  class="sheet {side}"
  class:wide
  class:closing
  aria-labelledby={labelledby}
  oncancel={(e) => {
    e.preventDefault();
    open = false;
  }}
  onclose={() => {
    open = false;
    closing = false;
  }}
  onclick={(e) => {
    if (e.target === el) open = false;
  }}
>
  <div class="body">{@render children()}</div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    max-width: 100vw;
    max-height: 100dvh;
    background: var(--page);
    color: var(--ink);
    box-shadow: 0 0 60px rgb(0 0 0 / 0.28);
    overflow: hidden;
  }
  dialog::backdrop {
    background: rgb(12 10 8 / 0.45);
    animation: fade-in 0.3s ease both;
  }
  dialog.closing::backdrop {
    animation: fade-out 0.23s ease both;
  }
  .body {
    height: 100%;
    max-height: inherit;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .bottom,
  .right {
    margin: auto auto 0;
    width: 100%;
    max-width: 32rem;
    max-height: 92dvh;
    border-radius: 24px 24px 0 0;
    animation: up 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .bottom.closing,
  .right.closing {
    animation: down 0.23s ease-in both;
  }
  .bottom.wide {
    max-width: 52rem;
  }
  @media (min-width: 40rem) {
    .bottom {
      margin: auto;
      border-radius: 24px;
      animation-name: pop;
    }
    .bottom.closing {
      animation-name: unpop;
    }
  }
  @media (min-width: 48rem) {
    .right {
      margin: 0 0 0 auto;
      width: 27rem;
      max-width: 27rem;
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 26px 0 0 26px;
      animation-name: from-right;
    }
    .right.closing {
      animation-name: to-right;
    }
  }
  .left {
    margin: 0 auto 0 0;
    width: min(94vw, 36rem);
    max-width: 94vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0 26px 26px 0;
    animation: from-left 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .left.closing {
    animation: to-left 0.23s ease-in both;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
  @keyframes up {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes down {
    to {
      transform: translateY(100%);
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.97);
    }
  }
  @keyframes unpop {
    to {
      opacity: 0;
      transform: translateY(12px) scale(0.97);
    }
  }
  @keyframes from-left {
    from {
      transform: translateX(-100%);
    }
  }
  @keyframes to-left {
    to {
      transform: translateX(-100%);
    }
  }
  @keyframes from-right {
    from {
      transform: translateX(100%);
    }
  }
  @keyframes to-right {
    to {
      transform: translateX(100%);
    }
  }
</style>
