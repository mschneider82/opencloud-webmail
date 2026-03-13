import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MailAccount } from '../types'
import { MailAccountSchema } from '../types'
import { encryptPassword, decryptPassword, getOrCreateSalt } from './useCrypto'
import { z } from 'zod'

function storageKey(userId: string): string {
  return `webmail:accounts:${userId}`
}

export const useMailAccountStore = defineStore('webmail-accounts', () => {
  const accounts = ref<MailAccount[]>([])
  const userId = ref<string>('')

  function load(uid: string) {
    userId.value = uid
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) {
      accounts.value = []
      return
    }
    try {
      const parsed = z.array(MailAccountSchema).parse(JSON.parse(raw))
      accounts.value = parsed
    } catch {
      accounts.value = []
    }
  }

  function persist() {
    localStorage.setItem(storageKey(userId.value), JSON.stringify(accounts.value))
  }

  async function addAccount(
    label: string,
    roundcubeInstanceId: string,
    imapUser: string,
    imapPass: string
  ): Promise<MailAccount> {
    const salt = getOrCreateSalt(userId.value)
    const { ciphertext, iv } = await encryptPassword(imapPass, userId.value, salt)
    const now = new Date().toISOString()
    const account: MailAccount = {
      id: crypto.randomUUID(),
      label,
      roundcubeInstanceId,
      imapUser,
      encryptedImapPass: ciphertext,
      iv,
      createdAt: now,
      updatedAt: now
    }
    accounts.value.push(account)
    persist()
    return account
  }

  async function updateAccount(
    id: string,
    updates: { label?: string; roundcubeInstanceId?: string; imapUser?: string; imapPass?: string }
  ) {
    const index = accounts.value.findIndex((a) => a.id === id)
    if (index === -1) return

    const account = { ...accounts.value[index] }

    if (updates.label !== undefined) account.label = updates.label
    if (updates.roundcubeInstanceId !== undefined)
      account.roundcubeInstanceId = updates.roundcubeInstanceId
    if (updates.imapUser !== undefined) account.imapUser = updates.imapUser
    if (updates.imapPass !== undefined) {
      const salt = getOrCreateSalt(userId.value)
      const { ciphertext, iv } = await encryptPassword(updates.imapPass, userId.value, salt)
      account.encryptedImapPass = ciphertext
      account.iv = iv
    }
    account.updatedAt = new Date().toISOString()

    accounts.value[index] = account
    persist()
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter((a) => a.id !== id)
    persist()
  }

  async function getDecryptedPassword(account: MailAccount): Promise<string> {
    const salt = getOrCreateSalt(userId.value)
    return await decryptPassword(account.encryptedImapPass, account.iv, userId.value, salt)
  }

  return { accounts, load, addAccount, updateAccount, removeAccount, getDecryptedPassword }
})
