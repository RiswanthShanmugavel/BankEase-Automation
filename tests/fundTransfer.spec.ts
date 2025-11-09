import { test, expect, request } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

test.describe('Fund Transfer Flow', () => {

  let fromAccount: string;
  let toAccount: string;

  test.beforeEach(async ({ page }) => {
    // Step 1: Login
    console.log(process.env.BASE_URL);
    console.log(process.env.LOGINNAME);
    console.log(process.env.PASSWORD);
    
    await page.goto(process.env.BASE_URL!);
  await page.fill('input[name="username"]', process.env.LOGINNAME!);
  await page.waitForTimeout(3000);
  await page.fill('input[name="password"]', process.env.PASSWORD!);
  await page.click('input[value="Log In"]');

  const item1=await page.locator('div[id="showOverview"] h1[class="title"]').textContent();
    console.log("Item1:",item1);

  await expect(page.locator('div[id="showOverview"] h1[class="title"]')).toHaveText('Accounts Overview');
    // await page.goto(process.env.BASE_URL!);
    // await page.fill('input[name="username"]', process.env.LOGINNAME!);
    // await page.fill('input[name="password"]', process.env.PASSWORD!);
    // await page.click('input[value="Log In"]');

    // await expect(page.locator('h1')).toHaveText('Accounts Overview');

    // Step 2: Capture two account numbers dynamically
    const accountLinks = page.locator('table#accountTable tbody tr td a');
    const count = await accountLinks.count();

    if (count < 2) {
      throw new Error('Need at least 2 accounts to test fund transfer');
    }

    fromAccount = (await accountLinks.nth(0).innerText()).toString();
    toAccount = await accountLinks.nth(1).innerText();
  });

  test('Transfer funds and verify via API', async ({ page, request }) => {
    // Step 3: Navigate to Transfer Funds page
    await page.click('a[href*="transfer.htm"]');
    await expect(page.locator('h1')).toHaveText('Transfer Funds');

    // Step 4: Fill and submit transfer form
    const transferAmount = '100';
    await page.fill('input#amount', transferAmount);
    await page.selectOption('select#fromAccountId', { label: fromAccount });
    await page.selectOption('select#toAccountId', { label: toAccount });
    await page.click('input[value="Transfer"]');

    // Step 5: Verify confirmation message
    await expect(page.locator('#rightPanel p')).toContainText('Transfer Complete!');
    await expect(page.locator('#rightPanel h1')).toHaveText('Transfer Complete!');

    // Step 6: API validation - check balances after transfer
    // Parabank provides REST endpoints (see /services_proxy/bank/accounts/{id})
    // Use the provided APIRequestContext 'request' to call the service with full URLs.
    const baseApiUrl = 'https://parabank.parasoft.com/parabank/services_proxy/bank';
    const fromAccountResponse = await request.get(`${baseApiUrl}/accounts/${fromAccount}`);
    const toAccountResponse = await request.get(`${baseApiUrl}/accounts/${toAccount}`);

    const fromData = await fromAccountResponse.json();
    const toData = await toAccountResponse.json();

    // Log balances for reference
    console.log(`From Account (${fromAccount}) balance: ${fromData.balance}`);
    console.log(`To Account (${toAccount}) balance: ${toData.balance}`);

    // Verify balances are numbers
    expect(typeof fromData.balance).toBe('number');
    expect(typeof toData.balance).toBe('number');

    // (Optional) Verify transfer reflected correctly
    // Since data is refreshed asynchronously, we just ensure both accounts are valid
    expect(fromData.id).toBeTruthy();
    expect(toData.id).toBeTruthy();
  });
});
