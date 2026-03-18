export interface UserPayload {
  sub: number;
  uuid: string;
  email: string;
}

export interface AuthUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
