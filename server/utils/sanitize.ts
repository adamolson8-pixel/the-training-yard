/**
 * Escape HTML special characters to prevent XSS injection in email templates.
 * Use this on ALL user-supplied input before embedding in HTML.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Escape HTML and convert newlines to <br> tags (for message fields).
 */
export function escapeHtmlWithBreaks(str: string | null | undefined): string {
  return escapeHtml(str).replace(/\n/g, '<br>')
}
