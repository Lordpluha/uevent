export type JwtSubjectType = 'user' | 'organization'

export interface JwtPayload {
  sub: number | string
  type: JwtSubjectType
  session_id: number | string
}
