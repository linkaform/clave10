export interface ApiResponse {
  error?: string;
  success?: boolean;
  response?: {
    data: any;
  };
}
