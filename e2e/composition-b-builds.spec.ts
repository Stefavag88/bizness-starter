import { test, expect } from '@playwright/test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { unstable_dev } from 'wrangler';
import { createOwnedFileEdit } from '../scripts/owned-file-edit.mjs';
import { runOwnedCommand } from '../scripts/owned-command.mjs';
import { assertPortsFree, resolvePorts } from '../scripts/ports.mjs';
import { createCompositionBDocument, ownCompositionBPage } from './helpers/composition-b-fixture';
test.skip(process.env.E2E_COMPOSITION_B_ARTICLES_DISABLED !== '1', 'Isolated owned articles-disabled build probe; stop all project stacks first.');
test('articles disabled preserves dormant bytes and all new public sections', async ({ browser }) => {
    test.setTimeout(240000);
    await assertPortsFree(resolvePorts());
    mkdirSync('.generated/composition-b-articles-disabled', { recursive: true });
    const directory = mkdtempSync(resolve('.generated/composition-b-articles-disabled/run-'));
    const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
    const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(path, e.name)) : [join(path, e.name)]);
    const snapshot = () => Object.fromEntries([...walk('content'), ...walk('apps/site/public/uploads')].map(p => [p, hash(readFileSync(p))]));
    const before = snapshot(), projectBytes = readFileSync('project.json');
    const edit = createOwnedFileEdit('project.json', join(directory, 'project'));
    const name = 'composition_b_disabled_' + Date.now(), owner = ownCompositionBPage(name, join(directory, 'page'));
    const document = createCompositionBDocument(name);
    let server: Awaited<ReturnType<typeof unstable_dev>> | undefined, context: Awaited<ReturnType<typeof browser.newContext>> | undefined;
    const commands: any[] = [];
    const command = async (args: string[], cwd = process.cwd()) => { const record: any = { args, cwd, pid: null, passed: false }; commands.push(record); await runOwnedCommand(process.execPath, args, { cwd, timeoutMs: 120000, onStart: pid => { record.pid = pid; }, onOutput: text => appendFileSync(join(directory, 'commands.log'), text) }); record.passed = true; };
    try {
        owner.create(document);
        const config = JSON.parse(projectBytes.toString('utf8'));
        config.articles = false;
        edit.replace(JSON.stringify(config, null, 2) + '\n');
        await command(['scripts/configure.mjs']);
        await command([resolve('apps/site/node_modules/astro/bin/astro.mjs'), 'build'], resolve('apps/site'));
        const worker = JSON.parse(readFileSync('wrangler.generated.json', 'utf8'));
        worker.main = resolve('worker/index.ts');
        worker.assets.directory = resolve('apps/site/dist');
        delete worker.d1_databases;
        delete worker.queues;
        delete worker.triggers;
        delete worker.workflows;
        const workerPath = join(directory, 'wrangler.json');
        writeFileSync(workerPath, JSON.stringify(worker, null, 2));
        server = await unstable_dev(worker.main, { config: workerPath, port: 0, inspectorPort: 0, local: true, persist: false, logLevel: 'error', experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false } });
        context = await browser.newContext({ baseURL: 'http://127.0.0.1:' + server.port });
        const page = await context.newPage();
        const runtimeErrors: string[] = [], csp: string[] = [];
        page.on('pageerror', error => runtimeErrors.push(error.message));
        await page.exposeFunction('captureCSP', (message: string) => csp.push(message));
        await page.addInitScript(() => document.addEventListener('securitypolicyviolation', event => (window as any).captureCSP(event.violatedDirective + ':' + event.blockedURI)));
        for (const locale of ['en', 'el']) {
            const response = await page.goto('/' + locale + '/' + name.replaceAll('_', '-'));
            expect(response!.status()).toBe(200);
            expect(response!.headers()['content-security-policy']).toContain("default-src 'self'");
            await expect(page.locator('h1')).toHaveCount(1);
            for (const id of ['faq_default', 'faq_expanded', 'steps_default', 'steps_cards', 'media_text_default', 'media_text_reversed', 'gallery_default', 'gallery_featured'])
                await expect(page.locator('#' + id)).toBeVisible();
            await expect(page.locator('#article_list_default')).toHaveCount(0);
            for (const image of await page.locator('main img').all()) {
                await image.scrollIntoViewIfNeeded();
                await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
            }
            for (const path of ['/insights', '/insights/a-useful-first-question', '/feed.xml'])
                expect((await context.request.get('/' + locale + path)).status()).toBe(404);
            expect(existsSync('apps/site/dist/' + locale + '/feed.xml')).toBe(false);
            expect(existsSync('apps/site/dist/' + locale + '/insights')).toBe(false);
            await page.screenshot({ path: join(directory, locale + '.png'), fullPage: true });
        }
        expect(runtimeErrors).toEqual([]);
        expect(csp).toEqual([]);
        writeFileSync(join(directory, 'public.json'), JSON.stringify({ locales: ['en', 'el'], newVariants: 8, articleRoutesAbsent: true, feedAbsent: true, runtimeErrors, csp }, null, 2));
    }
    finally {
        const failures: unknown[] = [];
        for (const cleanup of [() => context?.close(), () => server?.stop()]) {
            try { await cleanup(); } catch (error) { failures.push(error); }
        }
        // Restore independent owners even if one refuses a concurrent edit.
        let pageRestored = false, projectRestored = false;
        try { await owner.restore(); pageRestored = true; } catch (error) { failures.push(error); }
        try { edit.restore(); projectRestored = readFileSync('project.json').equals(projectBytes); } catch (error) { failures.push(error); }
        if (pageRestored && projectRestored) {
            try {
                await command(['scripts/configure.mjs']);
                await command([resolve('apps/site/node_modules/astro/bin/astro.mjs'), 'build'], resolve('apps/site'));
            } catch (error) { failures.push(error); }
        }
        writeFileSync(join(directory, 'restoration.json'), JSON.stringify({projectBefore:hash(projectBytes), projectAfter:existsSync('project.json')?hash(readFileSync('project.json')):null, before, after:snapshot(), commands, pageRestored, projectRestored, fixtureRemoved:!existsSync(owner.path), cleanupErrors:failures.map(String)}, null, 2));
        if (failures.length) throw new AggregateError(failures, 'Owned articles-disabled cleanup failed; preserve backups for review');
        expect(readFileSync('project.json')).toEqual(projectBytes);
        expect(snapshot()).toEqual(before);
        expect(existsSync(owner.path)).toBe(false);
    }
});
