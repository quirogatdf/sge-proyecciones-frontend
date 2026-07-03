import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'guest';
}

interface LoginResponse {
  token: string;
  user: UserInfo;
}

interface MeResponse {
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  private readonly tokenKey = 'auth_token';

  /** Signal con el usuario actual (null si no autenticado) */
  readonly user = signal<UserInfo | null>(null);

  /** Signal que indica si el auth check inicial terminó */
  readonly ready = signal(false);

  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  /**
   * Se llama desde APP_INITIALIZER.
   * Valida el token existente (si hay) antes de que la app renderice.
   */
  async init(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.ready.set(true);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<MeResponse>(`${this.apiUrl}/me`),
      );
      this.user.set(response.user);
    } catch {
      this.clearToken();
    } finally {
      this.ready.set(true);
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }),
    );
    this.setToken(response.token);
    this.user.set(response.user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/logout`, {}));
    } catch {
      // Si falla (ej: token expirado), igual limpiamos
    } finally {
      this.clearToken();
      this.user.set(null);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearAuth(): void {
    this.clearToken();
    this.user.set(null);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }
}
