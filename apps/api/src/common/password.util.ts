import { argon2id, hash, type Options, verify } from 'argon2'

// OWASP-recommended argon2id parameters (2024)
const ARGON2_OPTIONS: Options = {
  type: argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3, // iterations
  parallelism: 4,
  hashLength: 32,
}

export const hashPassword = (password: string) => hash(password, ARGON2_OPTIONS)

export const verifyPassword = (hash: string, password: string) => verify(hash, password)
