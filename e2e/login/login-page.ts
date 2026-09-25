import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(public readonly page: Page) {}

  readonly usernameInput = () => this.page.locator('#username');
  readonly passwordInput = () => this.page.locator('#password');
  readonly submitButton = () => this.page.getByRole('button', { name: 'Ingresar' });
  readonly errorAlert = () => this.page.locator('.alert-error');

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.submitButton()).toBeVisible({ timeout: 15000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async expectDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(
      this.page.getByRole('heading', { name: 'Mi escritorio' }),
    ).toBeVisible({ timeout: 20000 });
  }
}