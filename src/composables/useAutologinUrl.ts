import { useUserStore } from '@opencloud-eu/web-pkg'
import { useWebmailConfigStore } from './useWebmailConfigStore'
import { useMailAccountStore } from './useMailAccountStore'
import { base64UrlEncode, hmacSign } from './useCrypto'
import type { MailAccount } from '../types'

export async function buildAutologinUrl(account: MailAccount): Promise<string | null> {
  const userStore = useUserStore()
  const configStore = useWebmailConfigStore()
  const accountStore = useMailAccountStore()

  const instance = configStore.getInstanceById(account.roundcubeInstanceId)
  if (!instance) return null

  const imapPass = await accountStore.getDecryptedPassword(account)

  const ts = Math.floor(Date.now() / 1000)
  const exp = ts + 60

  const payload = {
    sub: userStore.user?.id,
    accountId: account.id,
    email: account.imapUser,
    imapPass,
    exp
  }

  const data = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const message = data + '.' + ts.toString()
  const sig = await hmacSign(message, instance.sharedSecret)

  const url = new URL('/autologin.php', instance.roundcubeUrl)
  url.searchParams.set('data', data)
  url.searchParams.set('sig', sig)
  url.searchParams.set('ts', ts.toString())

  return url.toString()
}
