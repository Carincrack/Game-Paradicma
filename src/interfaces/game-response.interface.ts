export interface GameResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}