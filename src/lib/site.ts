/** Absolute address of the live site, for link previews (crawlers need absolute URLs). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://andaaza-two.vercel.app').replace(/\/$/, '');
/**
 * WhatsApp, X and others keep link previews by image address. Bump ?v= whenever og.png
 * changes so they fetch the new picture instead of showing an old saved one.
 */
export const PREVIEW_IMAGE = `${SITE_URL}/og.png?v=2`;
