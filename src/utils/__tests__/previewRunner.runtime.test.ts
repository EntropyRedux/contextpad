import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Runtime verification of the live-preview runner.
 *
 * Extracts the actual PREVIEW_JS_BODY constant from the Rust preview server
 * source and executes it in jsdom against a mocked WebSocket and a real DOM.
 * This validates the browser-side edge cases of the preview protocol without
 * requiring the Tauri runtime:
 *   - late joiner receives persisted settings + content on connect
 *   - content updates replace #content and re-initialize TOC scroll spy
 *   - settings updates apply font scale / max width / margins / custom CSS
 *   - malformed WS payloads are ignored
 *   - abnormal disconnect schedules a reconnect with backoff
 *   - action buttons and TOC toggle work after content updates
 */

const rustPath = resolve(__dirname, '../../../src-tauri/src/preview_server.rs')

class MockWebSocket {
  static instances: MockWebSocket[] = []
  static last: MockWebSocket | null = null
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  sent: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    MockWebSocket.last = this
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    /* no-op */
  }
}

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

function serverPush(ws: MockWebSocket, payload: unknown) {
  ws.onmessage?.({ data: typeof payload === 'string' ? payload : JSON.stringify(payload) })
}

describe('preview runner (runtime, jsdom + extracted PREVIEW_JS_BODY)', () => {
  let status: HTMLElement
  let content: HTMLElement
  let layout: HTMLElement
  let toggle: HTMLElement

  beforeAll(() => {
    document.body.innerHTML = `
      <button id="toc-toggle">TOC</button>
      <div id="layout" class="layout-container"></div>
      <nav class="toc-sidebar"></nav>
      <div id="content" class="markdown-body"><p>initial</p></div>
      <style id="contextpad-custom-css"></style>
      <div id="lib-status">Connecting...</div>
      <h1 id="intro">Intro</h1>
    `
    status = document.getElementById('lib-status')!
    content = document.getElementById('content')!
    layout = document.getElementById('layout')!
    toggle = document.getElementById('toc-toggle')!

    ;(globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket
    ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      IntersectionObserverStub

    const rust = readFileSync(rustPath, 'utf8')
    const match = rust.match(/const PREVIEW_JS_BODY: &str = r#"([\s\S]*?)"#;/)
    if (!match) throw new Error('PREVIEW_JS_BODY not found in preview_server.rs')
    // Execute the exact runner the Rust server serves at /preview.js
    // eslint-disable-next-line no-eval
    ;(0, eval)(match[1])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('connects to the preview WebSocket on boot', () => {
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:3000/ws')
  })

  it('applies persisted settings and content pushed on connect (late joiner)', () => {
    const ws = MockWebSocket.last!
    ws.onopen?.()
    serverPush(ws, {
      type: 'settings',
      value: {
        previewFontScale: 1.25,
        previewMaxWidth: '760px',
        previewContentMargin: '3rem',
        previewCustomCSS: 'p { color: red; }'
      }
    })
    expect(document.body.style.fontSize).toBe('20px') // 16 * 1.25
    expect(layout.style.maxWidth).toBe('760px')

    serverPush(ws, {
      type: 'content',
      value: '<h1 id="intro">Rendered</h1><button class="cm-action-button" data-action-id="fmt">fmt</button>'
    })
    expect(content.innerHTML).toContain('Rendered')
    expect(document.getElementById('contextpad-custom-css')!.textContent).toBe('p { color: red; }')
    expect(status.textContent).toBe('Updated')
  })

  it('re-initializes the TOC toggle after content updates', () => {
    const ws = MockWebSocket.last!
    serverPush(ws, { type: 'content', value: '<p>second</p>' })

    toggle.click()
    expect(layout.classList.contains('sidebar-expanded')).toBe(true)
    toggle.click()
    expect(layout.classList.contains('sidebar-expanded')).toBe(false)
  })

  it('applies subsequent settings pushes', () => {
    const ws = MockWebSocket.last!
    serverPush(ws, { type: 'settings', value: { previewFontScale: 2 } })
    expect(document.body.style.fontSize).toBe('32px')
  })

  it('shows the action id when an action button is clicked', () => {
    const ws = MockWebSocket.last!
    serverPush(ws, {
      type: 'content',
      value: '<button class="cm-action-button" data-action-id="fmt">fmt</button>'
    })
    const btn = content.querySelector('.cm-action-button') as HTMLElement
    expect(btn).toBeTruthy()
    btn.click()
    expect(status.textContent).toBe('Action: fmt')
  })

  it('ignores malformed WebSocket payloads without throwing', () => {
    const ws = MockWebSocket.last!
    const before = content.innerHTML
    expect(() => serverPush(ws, 'not-json{{')).not.toThrow()
    expect(() => serverPush(ws, { unknown: true })).not.toThrow()
    expect(content.innerHTML).toBe(before)
  })

  it('schedules a reconnect after an abnormal close (backoff)', () => {
    vi.useFakeTimers()
    const ws = MockWebSocket.last!
    const countBefore = MockWebSocket.instances.length
    ws.onclose?.({ code: 1006 })

    expect(status.textContent).toContain('Reconnecting')
    vi.advanceTimersByTime(1600) // first backoff delay is 1000 * 1.5^0 = 1000ms
    expect(MockWebSocket.instances.length).toBe(countBefore + 1)
  })
})