import { apiService } from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/auth';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.data.accessToken) {
      apiService.setAuthToken(response.data.data.accessToken);
    }
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    
    if (response.data.success && response.data.data.accessToken) {
      apiService.setAuthToken(response.data.data.accessToken);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      apiService.clearAuthToken();
    }
  }

  async getProfile(): Promise<User> {
    const response = await apiService.get<{ success: boolean; data: { user: User } }>('/auth/profile');
    return response.data.data.user;
  }

  async updateProfile(data: { firstName: string; lastName: string }): Promise<User> {
    const response = await apiService.put<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    return response.data.data.user;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiService.put('/auth/change-password', data);
  }

  isAuthenticated(): boolean {
    return !!apiService.getAuthToken();
  }
}

export const authService = new AuthService();