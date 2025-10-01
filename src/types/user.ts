export interface SystemUser {
  username: string
  fullName?: string
  domain?: string
  isAdmin?: boolean
  groups?: string[]
}

export interface UserInfo {
  current: SystemUser
  available?: SystemUser[]
}

export interface UserSwitchRequest {
  username: string
  password?: string
}