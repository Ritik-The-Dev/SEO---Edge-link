export interface CurrentUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CLIENT'
  clientId: string | null
}
