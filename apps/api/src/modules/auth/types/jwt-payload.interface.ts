export type JwtSubjectType = 'user' | 'organization'

export interface JwtPayload {
  sub: string
  type: JwtSubjectType
  session_id: string
}
