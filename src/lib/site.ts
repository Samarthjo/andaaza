/** Absolute address of the live site, for link previews (crawlers need absolute URLs). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://andaaza-two.vercel.app').replace(/\/$/, '');
export const PREVIEW_IMAGE = `${SITE_URL}/og.png`;
