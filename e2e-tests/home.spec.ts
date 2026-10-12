import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
        await expect(page.getByTestId('role-location')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on its card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('filters roles by department', async ({ page }) => {
        await page.goto('/?department=Technology');
        await expect(page.getByTestId('department-filter')).toHaveValue('Technology');
        await expect(page.getByTestId('role-card')).toHaveCount(2);
        await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Data Platform Engineer' })).toBeVisible();
    });

    test('filters roles by location', async ({ page }) => {
        await page.goto('/?location=Remote%20%28US%20%26%20Canada%29');
        await expect(page.getByTestId('location-filter')).toHaveValue('Remote (US & Canada)');
        await expect(page.getByTestId('role-card')).toHaveCount(2);
        await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Data Platform Engineer' })).toBeVisible();
    });

    test('combines department and location filters', async ({ page }) => {
        await page.goto('/?department=Technology&location=Remote%20%28US%20%26%20Canada%29');
        await expect(page.getByTestId('department-filter')).toHaveValue('Technology');
        await expect(page.getByTestId('location-filter')).toHaveValue('Remote (US & Canada)');
        await expect(page.getByTestId('role-card')).toHaveCount(2);
        await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Data Platform Engineer' })).toBeVisible();
    });

    test('resets filters back to the full list', async ({ page }) => {
        await page.goto('/?department=Technology&location=Remote%20%28US%20%26%20Canada%29');
        await page.getByTestId('reset-filters').click();
        await expect(page).toHaveURL('/');
        await expect(page.getByTestId('department-filter')).toHaveValue('');
        await expect(page.getByTestId('location-filter')).toHaveValue('');
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('shows an empty state when no roles match the selected filters', async ({ page }) => {
        await page.goto('/?department=Technology&location=Woodinville%2C%20WA%2C%20USA');
        await expect(page.getByTestId('empty-state')).toBeVisible();
        await expect(page.getByTestId('empty-state-text')).toHaveText(
            'No roles match the selected filters. Try another department or location.',
        );
        await expect(page.getByTestId('role-card')).toHaveCount(0);
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
