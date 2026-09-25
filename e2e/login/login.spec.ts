import { test, expect } from '@playwright/test';
import { LoginPage } from './login-page';
import { ADMIN, GUEST } from '../helpers';

test.describe('Login', () => {
  test('admin autenticado llega al dashboard', { tag: ['@critical', '@e2e', '@auth', '@AUTH-E2E-001'] }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(ADMIN.username, ADMIN.password);
    await login.expectDashboard();
  });

  test('credenciales incorrectas muestran error', { tag: ['@high', '@e2e', '@auth', '@AUTH-E2E-002'] }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(ADMIN.username, 'clave-incorrecta');
    await expect(login.errorAlert()).toHaveText('Usuario o contraseña incorrectos');
    await expect(login.page).toHaveURL(/\/login/);
  });

  test('guest autenticado llega al dashboard', { tag: ['@high', '@e2e', '@auth', '@AUTH-E2E-003'] }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(GUEST.username, GUEST.password);
    await login.expectDashboard();
  });
});