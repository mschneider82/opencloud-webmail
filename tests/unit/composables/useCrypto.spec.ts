import {
  base64UrlEncode,
  base64UrlDecode,
  base64Encode,
  base64Decode,
  hmacSign,
  encryptPassword,
  decryptPassword
} from '../../../src/composables/useCrypto'

describe('useCrypto', () => {
  describe('base64UrlEncode / base64UrlDecode', () => {
    it('round-trips arbitrary bytes', () => {
      const original = new Uint8Array([0, 1, 2, 255, 254, 128, 63, 62])
      const encoded = base64UrlEncode(original.buffer)
      const decoded = base64UrlDecode(encoded)
      expect(decoded).toEqual(original)
    })

    it('produces URL-safe output without padding', () => {
      const data = new Uint8Array([62, 63, 255]) // would produce +/= in standard base64
      const encoded = base64UrlEncode(data.buffer)
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
    })

    it('handles empty input', () => {
      const encoded = base64UrlEncode(new ArrayBuffer(0))
      expect(encoded).toBe('')
      const decoded = base64UrlDecode('')
      expect(decoded).toEqual(new Uint8Array([]))
    })
  })

  describe('base64Encode / base64Decode', () => {
    it('round-trips bytes', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50])
      const encoded = base64Encode(original.buffer)
      const decoded = base64Decode(encoded)
      expect(decoded).toEqual(original)
    })
  })

  describe('hmacSign', () => {
    it('produces a non-empty base64url signature', async () => {
      const sig = await hmacSign('test-data.123', 'secret-key')
      expect(sig).toBeTruthy()
      expect(sig).not.toContain('+')
      expect(sig).not.toContain('/')
      expect(sig).not.toContain('=')
    })

    it('produces deterministic output for same inputs', async () => {
      const sig1 = await hmacSign('hello.456', 'key')
      const sig2 = await hmacSign('hello.456', 'key')
      expect(sig1).toBe(sig2)
    })

    it('produces different output for different data', async () => {
      const sig1 = await hmacSign('data-a.1', 'key')
      const sig2 = await hmacSign('data-b.1', 'key')
      expect(sig1).not.toBe(sig2)
    })

    it('produces different output for different keys', async () => {
      const sig1 = await hmacSign('data.1', 'key-a')
      const sig2 = await hmacSign('data.1', 'key-b')
      expect(sig1).not.toBe(sig2)
    })
  })

  describe('encryptPassword / decryptPassword', () => {
    const userId = 'test-user-id'
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

    it('round-trips a password', async () => {
      const password = 'my-secret-password'
      const { ciphertext, iv } = await encryptPassword(password, userId, salt)
      const decrypted = await decryptPassword(ciphertext, iv, userId, salt)
      expect(decrypted).toBe(password)
    })

    it('produces different ciphertext for each encryption (random IV)', async () => {
      const password = 'same-password'
      const result1 = await encryptPassword(password, userId, salt)
      const result2 = await encryptPassword(password, userId, salt)
      expect(result1.ciphertext).not.toBe(result2.ciphertext)
      expect(result1.iv).not.toBe(result2.iv)
    })

    it('fails to decrypt with wrong userId', async () => {
      const { ciphertext, iv } = await encryptPassword('secret', userId, salt)
      await expect(decryptPassword(ciphertext, iv, 'wrong-user', salt)).rejects.toThrow()
    })

    it('fails to decrypt with wrong salt', async () => {
      const { ciphertext, iv } = await encryptPassword('secret', userId, salt)
      const wrongSalt = new Uint8Array(16).fill(99)
      await expect(decryptPassword(ciphertext, iv, userId, wrongSalt)).rejects.toThrow()
    })

    it('handles unicode passwords', async () => {
      const password = 'Passwort mit Umlauten: äöü ß'
      const { ciphertext, iv } = await encryptPassword(password, userId, salt)
      const decrypted = await decryptPassword(ciphertext, iv, userId, salt)
      expect(decrypted).toBe(password)
    })

    it('handles empty password', async () => {
      const password = ''
      const { ciphertext, iv } = await encryptPassword(password, userId, salt)
      const decrypted = await decryptPassword(ciphertext, iv, userId, salt)
      expect(decrypted).toBe(password)
    })
  })
})
