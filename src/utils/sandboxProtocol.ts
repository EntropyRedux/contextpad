/**
 * Message protocol helpers shared by the action executor (parent window) and
 * the sandbox page (iframe). They are kept as pure functions so the origin,
 * source, and id checks are deterministic and unit-testable.
 */

export function isDevHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * The origin the sandbox frame runs under. In development the Vite dev server
 * owns the page; in production the app is served from the Tauri protocol.
 */
export function getSandboxOrigin(): string {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  if (isDevHostname(host)) {
    const port = window.location.port || '5173'
    return `${window.location.protocol}//${host}:${port}`
  }
  return window.location.origin
}

/** Build the sandbox iframe URL, pinning the expected parent origin. */
export function buildSandboxUrl(origin: string): string {
  return `/sandbox.html?origin=${encodeURIComponent(origin)}`
}

/**
 * A message is trusted only when it arrives from the exact origin we expect
 * and from the sandbox's content window. This rejects spoofed messages posted
 * by any other frame the page can reach.
 */
export function isTrustedMessage(
  event: { origin: string; source: unknown },
  expectedOrigin: string,
  expectedSource: unknown
): boolean {
  return (
    !!event &&
    typeof event.origin === 'string' &&
    event.origin === expectedOrigin &&
    !!event.source &&
    event.source === expectedSource
  )
}

/** Execution replies are keyed by an opaque id to prevent reply spoofing. */
export function matchesRequestId(payloadId: unknown, requestId: string): boolean {
  return typeof payloadId === 'string' && payloadId === requestId
}