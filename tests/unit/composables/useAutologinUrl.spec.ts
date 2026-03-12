import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { base64UrlDecode } from '../../../src/composables/useCrypto'
import type { MailAccount } from '../../../src/types'

// Mock the web-pkg user store
vi.mock('@opencloud-eu/web-pkg', () => ({
  useUserStore: () => ({
    user: { id: 'test-user-123' }
  })
}))

// We need to import after mock setup
const { buildAutologinUrl } = await import('../../../src/composables/useAutologinUrl')
const { useWebmailConfigStore } = await import(
  '../../../src/composables/useWebmailConfigStore'
)
const { useMailAccountStore } = await import('../../../src/composables/useMailAccountStore')

describe('useAutologinUrl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function setupStores() {
    const configStore = useWebmailConfigStore()
    configStore.setConfig({
      instances: [
        {
          id: 'rc-test',
          label: 'Test RC',
          roundcubeUrl: 'https://mail.example.com',
          sharedSecret: 'test-secret-key'
        }
      ]
    })

    const accountStore = useMailAccountStore()
    accountStore.load('test-user-123')

    return { configStore, accountStore }
  }

  it('returns null if instance is not found', async () => {
    setupStores()

    const account: MailAccount = {
      id: 'acc-1',
      label: 'Test',
      roundcubeInstanceId: 'nonexistent',
      imapUser: 'user@example.com',
      encryptedImapPass: '',
      iv: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const url = await buildAutologinUrl(account)
    expect(url).toBeNull()
  })

  it('builds a valid autologin URL', async () => {
    const { accountStore } = setupStores()

    const account = await accountStore.addAccount('Test Mail', 'rc-test', 'user@example.com', 'my-imap-pass')

    const url = await buildAutologinUrl(account)
    expect(url).toBeTruthy()

    const parsed = new URL(url!)
    expect(parsed.origin).toBe('https://mail.example.com')
    expect(parsed.pathname).toBe('/autologin.php')
    expect(parsed.searchParams.has('data')).toBe(true)
    expect(parsed.searchParams.has('sig')).toBe(true)
    expect(parsed.searchParams.has('ts')).toBe(true)
  })

  it('includes correct payload fields in data', async () => {
    const { accountStore } = setupStores()

    const account = await accountStore.addAccount('Test Mail', 'rc-test', 'user@example.com', 'my-imap-pass')

    const url = await buildAutologinUrl(account)
    const parsed = new URL(url!)
    const data = parsed.searchParams.get('data')!

    const decoded = new TextDecoder().decode(base64UrlDecode(data))
    const payload = JSON.parse(decoded)

    expect(payload.sub).toBe('test-user-123')
    expect(payload.accountId).toBe(account.id)
    expect(payload.email).toBe('user@example.com')
    expect(payload.imapPass).toBe('my-imap-pass')
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('sets expiry 60 seconds in the future', async () => {
    const { accountStore } = setupStores()

    const account = await accountStore.addAccount('Test Mail', 'rc-test', 'user@example.com', 'pass')

    const beforeTs = Math.floor(Date.now() / 1000)
    const url = await buildAutologinUrl(account)
    const afterTs = Math.floor(Date.now() / 1000)

    const parsed = new URL(url!)
    const data = parsed.searchParams.get('data')!
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(data)))

    expect(payload.exp).toBeGreaterThanOrEqual(beforeTs + 60)
    expect(payload.exp).toBeLessThanOrEqual(afterTs + 60)
  })

  it('timestamp parameter matches payload timing', async () => {
    const { accountStore } = setupStores()

    const account = await accountStore.addAccount('Test Mail', 'rc-test', 'user@example.com', 'pass')

    const url = await buildAutologinUrl(account)
    const parsed = new URL(url!)
    const ts = parseInt(parsed.searchParams.get('ts')!, 10)

    const now = Math.floor(Date.now() / 1000)
    expect(ts).toBeGreaterThanOrEqual(now - 2)
    expect(ts).toBeLessThanOrEqual(now + 2)
  })
})
