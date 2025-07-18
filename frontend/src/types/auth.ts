export type AuthRole = 'admin' | 'user';

export interface AuthSession {
  token: string;
  user_id: string;
  musteri_id: string;
  rol: AuthRole;
}
