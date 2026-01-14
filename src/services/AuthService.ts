import { HttpService } from './HttpService';
import { env } from '@/config';

export interface LoginResponse {
    token: string;
    user: {
        username: string;
        role: {
            id: string;
            text: string;
        };
    };
}

export interface RegisterResponse {
    message: string;
    token: string;
}

class AuthService extends HttpService {
    private _currentUser: LoginResponse['user'] | null = null;
    private readonly STORAGE_KEY = 'noc_user';

    constructor() {
        const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
        // Build URL: baseUrl + /api/v1
        const apiPath = baseUrl ? `${baseUrl}/api/${env.apiVersion}` : `/api/${env.apiVersion}`;
        super(apiPath);
        this.loadUser();

        // Clear invalid mock tokens when in API mode
        if (!env.useMockData) {
            const token = localStorage.getItem('noc_token');
            if (token === 'mock-jwt-token') {
                console.warn('[AuthService] Clearing mock token in API mode');
                HttpService.clearToken();
                localStorage.removeItem(this.STORAGE_KEY);
                this._currentUser = null;
            }
        }
    }

    private loadUser() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this._currentUser = JSON.parse(stored);
            } catch {
                this._currentUser = null;
            }
        }
    }

    get currentUser() {
        return this._currentUser;
    }

    async login(username: string, password: string, role: { id: string; text: string }): Promise<LoginResponse> {
        if (env.useMockData) {
            console.log('AuthService: Using Mock Login');
            const mockResponse: LoginResponse = {
                token: 'mock-jwt-token',
                user: {
                    username: username,
                    role: role
                }
            };
            this._currentUser = mockResponse.user;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockResponse.user));
            HttpService.setToken(mockResponse.token);
            return new Promise(resolve => setTimeout(() => resolve(mockResponse), 500));
        }

        const response = await this.post<LoginResponse>('/login', { username, password, role });
        this._currentUser = response.user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.user));
        HttpService.setToken(response.token);
        return response;
    }

    async register(data: { firstName: string, lastName: string, email: string, password: string, role: { id: string, text: string } }): Promise<RegisterResponse> {
        if (env.useMockData) {
            console.log('AuthService: Using Mock Register');
            const mockResponse: RegisterResponse = {
                message: 'User registered successfully',
                token: 'mock-jwt-token'
            };
            HttpService.setToken(mockResponse.token);
            return new Promise(resolve => setTimeout(() => resolve(mockResponse), 500));
        }
        const response = await this.post<RegisterResponse>('/register', data);
        HttpService.setToken(response.token);
        return response;
    }

    logout() {
        this._currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        HttpService.clearToken();
        window.location.href = '/login';
    }

    isAuthenticated(): boolean {
        return this._currentUser !== null || HttpService.hasToken();
    }
}

export const authService = new AuthService();
