/**
 * Client-safe helpers for the article form contract.
 *
 * Keep this module free of DOM/server-only dependencies. It is imported by
 * the public submission form only to decide whether the editor has content.
 */
export function articleHtmlToText(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
