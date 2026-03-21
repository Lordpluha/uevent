import * as argon2 from 'argon2'

// OWASP-recommended argon2id parameters (2024)
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,       // iterations
  parallelism: 4,
  hashLength: 32,
}

export const hashPassword = (password: string) =>
  argon2.hash(password, ARGON2_OPTIONS)

export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password)
