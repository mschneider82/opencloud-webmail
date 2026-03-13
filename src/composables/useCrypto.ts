function saltKey(userId: string): string {
  return `webmail:encryption-salt:${userId}`
}

export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function base64Encode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function base64Decode(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64UrlEncode(signature)
}

async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function getOrCreateSalt(userId: string): Uint8Array {
  const key = saltKey(userId)
  const stored = localStorage.getItem(key)
  if (stored) {
    return base64Decode(stored)
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  localStorage.setItem(key, base64Encode(salt))
  return salt
}

export async function encryptPassword(
  password: string,
  userId: string,
  salt: Uint8Array
): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(userId, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(password)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    ciphertext: base64Encode(encrypted),
    iv: base64Encode(iv)
  }
}

export async function decryptPassword(
  ciphertext: string,
  iv: string,
  userId: string,
  salt: Uint8Array
): Promise<string> {
  const key = await deriveKey(userId, salt)
  const ivBytes = base64Decode(iv)
  const ciphertextBytes = base64Decode(ciphertext)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer },
    key,
    ciphertextBytes.buffer as ArrayBuffer
  )
  return new TextDecoder().decode(decrypted)
}
