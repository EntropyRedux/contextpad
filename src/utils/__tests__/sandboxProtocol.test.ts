import { describe, it, expect } from 'vitest'
import {
  getSandboxOrigin,
  isTrustedMessage,
  matchesRequestId,
  buildSandboxUrl,
  isDevHostname
} from '../sandboxProtocol'

describe('sandboxProtocol', () => {
  describe('isDevHostname', () => {
    it('flags localhost and 127.0.0.1 as development hosts', () => {
      expect(isDevHostname('localhost')).toBe(true)
      expect(isDevHostname('127.0.0.1')).toBe(true)
      expect(isDevHostname('tauri.localhost')).toBe(false)
      expect(isDevHostname('example.com')).toBe(false)
    })
  })

  describe('isTrustedMessage', () => {
    const expectedOrigin = 'http://localhost:5173'
    const source = { id: 'iframe-window' }

    it('accepts a message matching both origin and source', () => {
      expect(isTrustedMessage({ origin: expectedOrigin, source }, expectedOrigin, source)).toBe(true)
    })

    it('rejects a message from the wrong origin', () => {
      expect(isTrustedMessage({ origin: 'https://evil.example', source }, expectedOrigin, source)).toBe(false)
    })

    it('rejects a message from the wrong source frame', () => {
      expect(isTrustedMessage({ origin: expectedOrigin, source }, expectedOrigin, { id: 'other' })).toBe(false)
    })

    it('rejects malformed events', () => {
      expect(isTrustedMessage(null as never, expectedOrigin, source)).toBe(false)
      expect(isTrustedMessage({ origin: '', source: null }, expectedOrigin, source)).toBe(false)
    })
  })

  describe('matchesRequestId', () => {
    it('requires an exact string match', () => {
      expect(matchesRequestId('abc-123', 'abc-123')).toBe(true)
      expect(matchesRequestId('abc-124', 'abc-123')).toBe(false)
      expect(matchesRequestId(42, 'abc-123')).toBe(false)
      expect(matchesRequestId(null, 'abc-123')).toBe(false)
      expect(matchesRequestId(undefined, 'abc-123')).toBe(false)
    })
  })

  describe('buildSandboxUrl', () => {
    it('pins the expected origin as a query parameter', () => {
      const url = buildSandboxUrl('http://localhost:5173')
      expect(url).toBe('/sandbox.html?origin=http%3A%2F%2Flocalhost%3A5173')
    })

    it('round-trips through URLSearchParams', () => {
      const origin = 'http://tauri.localhost'
      const url = buildSandboxUrl(origin)
      const parsed = new URL(url, 'http://localhost')
      expect(parsed.searchParams.get('origin')).toBe(origin)
    })
  })

  describe('getSandboxOrigin', () => {
    it('returns tauri origin when not on a dev hostname', () => {
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { hostname: 'tauri.localhost', port: '', protocol: 'http:', origin: 'http://tauri.localhost' },
        writable: true
      })
      try {
        expect(getSandboxOrigin()).toBe('http://tauri.localhost')
      } finally {
        Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
      }
    })
  })
})