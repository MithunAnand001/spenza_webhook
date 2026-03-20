export interface AuthUser {
  uuid: string;
  name: string;
  email: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
