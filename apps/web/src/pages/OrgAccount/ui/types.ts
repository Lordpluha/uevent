export interface OrgModel {
  id: string
  title: string
  slogan?: string
  description?: string
  category?: string
  location?: string
  phone?: string
  email?: string
  avatarUrl?: string
  coverUrl?: string
  twoFactorEnabled?: boolean
}
