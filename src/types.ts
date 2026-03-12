import { z } from 'zod'

export const RoundcubeInstanceSchema = z.object({
  id: z.string(),
  label: z.string(),
  roundcubeUrl: z.string().url(),
  sharedSecret: z.string(),
  description: z.string().optional()
})

export type RoundcubeInstance = z.infer<typeof RoundcubeInstanceSchema>

export const WebmailConfigSchema = z.object({
  instances: z.array(RoundcubeInstanceSchema).default([])
})

export type WebmailConfig = z.infer<typeof WebmailConfigSchema>

export const MailAccountSchema = z.object({
  id: z.string(),
  label: z.string(),
  roundcubeInstanceId: z.string(),
  imapUser: z.string(),
  encryptedImapPass: z.string(),
  iv: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type MailAccount = z.infer<typeof MailAccountSchema>
