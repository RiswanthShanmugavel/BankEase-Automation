import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

test('Login with valid credentials', async ({ page }) => {
    console.log(process.env.BASE_URL);
    console.log(process.env.LOGINNAME);
    console.log(process.env.PASSWORD);

  await page.goto(process.env.BASE_URL!);
  await page.fill('input[name="username"]', process.env.LOGINNAME!);
  await page.waitForTimeout(3000);
  await page.fill('input[name="password"]', process.env.PASSWORD!);
  await page.click('input[value="Log In"]');

  await expect(page.locator('div[id="showOverview"] h1[class="title"]')).toHaveText('Accounts Overview');
});


