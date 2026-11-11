<!--
  Animated modal sheet built on <dialog> (focus trap, Escape, inert page for free).
  side="bottom": slides up. side="left": full-height panel from the left.
  side="right": full-height panel from the right.
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
  // Browsers without modal dialogs (iOS before 15.4) get a plain fixed overlay instead.
  let fallback = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (!el) return;
    if (open && !el.open) {
      clearTimeout(timer);
      closing = false;
      try {
        el.showModal();
        fallback = false;
      } catch {
        fallback = true;
        el.setAttribute('open', '');
      }
    } else if (!open && el.open && !closing) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      closing = true;
      timer = setTimeout(() => {
        if (typeof el?.close === 'function' && !fallback) el.close();
        else el?.removeAttribute('open');
        closing = false;
      }, reduce ? 0 : 230);
    }
  });
</script>

<dialog
  bind:this={el}
  class="sheet {side}"
  class:wide
  class:fallback
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
  onkeydown={(e) => {
    if (fallback && e.key === 'Escape') open = false;
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
  dialog.fallback[open] {
    position: fixed;
    z-index: 1000;
    inset: auto 0 0 0;
    display: block;
    box-shadow: 0 0 0 100vmax rgb(12 10 8 / 0.45);
  }
  dialog.fallback.left[open] {
    inset: 0 auto 0 0;
  }
  dialog.fallback.right[open] {
    inset: 0 0 0 auto;
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

  /* Side panels (You, Settings): a full-height drawer on every screen, the mirror image of
     the menu. iPhone Safari failed to show these as bottom sheets placed with auto margins. */
  .right {
    margin: 0 0 0 auto;
    width: min(94vw, 27rem);
    max-width: 94vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 26px 0 0 26px;
    animation: from-right 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .right.closing {
    animation: to-right 0.23s ease-in both;
  }

  /* Bottom sheet (calculator): pinned to the bottom edge with a fixed height on phones,
     a centred card on wider screens. */
  .bottom {
    inset: auto 0 0 0;
    margin: 0 auto;
    width: 100%;
    max-width: 32rem;
    height: 92dvh;
    max-height: 92dvh;
    border-radius: 24px 24px 0 0;
    animation: up 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .bottom.closing {
    animation: down 0.23s ease-in both;
  }
  .bottom.wide {
    max-width: 52rem;
  }
  @media (min-width: 40rem) {
    .bottom {
      inset: 0;
      margin: auto;
      height: fit-content;
      border-radius: 24px;
      animation-name: pop;
    }
    .bottom.closing {
      animation-name: unpop;
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
