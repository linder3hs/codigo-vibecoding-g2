export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
