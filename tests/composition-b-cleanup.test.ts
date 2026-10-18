import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCmsSources } from '../e2e/helpers/cms-source-ownership';
import { createOwnedMedia } from '../e2e/helpers/owned-media';
import { createOwnedFileEdit } from '../scripts/owned-file-edit.mjs';
import { cleanupCompositionPublic, cleanupCompositionBuild, type BuildCleanupState } from '../e2e/helpers/composition-b-cleanup';
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true }); });
function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'composition-b-cleanup-'));
    roots.push(root);
    const uploads = join(root, 'uploads');
    mkdirSync(uploads);
    const page = join(root, 'page.json'), image = join(uploads, 'owned.png'), project = join(root, 'project.json'), home = join(root, 'home.json');
    writeFileSync(project, '{"articles":true}\r\n');
    writeFileSync(home, 'Original Home\r\n');
    const sources = createCmsSources([page], join(root, 'page-backup'), { allowCreate: true });
    const document = { contentId: 'owned' };
    sources.createAbsent(page, document, () => true);
    const media = createOwnedMedia(image, join(root, 'media-backup'), { uploadsRoot: uploads });
    media.create(Buffer.from([137, 80, 78, 71]));
    const edit = createOwnedFileEdit(project, join(root, 'project-backup'));
    edit.replace('{"articles":false}\n');
    return { root, page, image, project, home, sources, media, edit };
}
it('attempts Page and owned PNG cleanup even when monitor close rejects', async () => {
    const f = fixture();
    await expect(cleanupCompositionPublic([() => Promise.reject(Error('monitor rejected')), () => f.sources.restore(), () => f.media.restore()])).rejects.toThrow();
    expect(existsSync(f.page)).toBe(false);
    expect(existsSync(f.image)).toBe(false);
});
it('preserves conflicted unknown Page bytes while removing independently owned PNG', async () => {
    const f = fixture();
    const unknown = '{"editor":"unknown Page"}\r\n';
    writeFileSync(f.page, unknown);
    const failure = await cleanupCompositionPublic([() => Promise.reject(Error('monitor rejected')), () => { f.sources.assertUnchanged(); }, () => f.media.restore()]).catch(error => error);
    expect(failure).toBeInstanceOf(AggregateError);
    expect(failure.errors).toHaveLength(2);
    expect(readFileSync(f.page, 'utf8')).toBe(unknown);
    expect(existsSync(f.image)).toBe(false);
    expect(f.sources.owns(f.page)).toBe(false);
    await expect(f.sources.restore()).rejects.toThrow(/Concurrent edits preserved/);
});
function buildOptions(f: ReturnType<typeof fixture>) {
    const commands = [vi.fn(async () => { }), vi.fn(async () => { })];
    let recorded: BuildCleanupState | undefined;
    return { commands, get recorded() { return recorded; }, options: { closeContext: async () => { }, stopRuntime: async () => { }, restorePage: () => f.sources.restore(), restoreProject: () => { f.edit.restore(); expect(readFileSync(f.project, 'utf8')).toBe('{"articles":true}\r\n'); }, sourcesUnchanged: () => readFileSync(f.home, 'utf8') === 'Original Home\r\n' && readFileSync(f.project, 'utf8') === '{"articles":true}\r\n' && !existsSync(f.page) && existsSync(f.image) && Array.from(readFileSync(f.image)).join(',') === '137,80,78,71', rebuild: commands, record: (state: BuildCleanupState) => { recorded = structuredClone(state); } } };
}
it('restores independent owners but runs neither command after rejected runtime shutdown', async () => {
    const f = fixture(), b = buildOptions(f);
    b.options.stopRuntime = async () => { throw Error('stop rejected'); };
    await expect(cleanupCompositionBuild(b.options)).rejects.toThrow();
    expect(b.commands.every(command => command.mock.calls.length === 0)).toBe(true);
    expect(existsSync(f.page)).toBe(false);
    expect(readFileSync(f.project, 'utf8')).toBe('{"articles":true}\r\n');
    expect(b.recorded).toMatchObject({ runtimeStopped: false, rebuildCommands: 0, rebuildSkipped: 'runtime shutdown unconfirmed' });
});
it.each(['home', 'image'] as const)('preserves external %s edits and runs neither regeneration command', async (target) => {
    const f = fixture(), b = buildOptions(f);
    writeFileSync(f[target], 'External input');
    await expect(cleanupCompositionBuild(b.options)).rejects.toThrow();
    expect(b.commands.every(command => command.mock.calls.length === 0)).toBe(true);
    expect(readFileSync(f[target], 'utf8')).toBe('External input');
    expect(existsSync(f.page)).toBe(false);
    expect(b.recorded).toMatchObject({ sourcesUnchanged: false, rebuildCommands: 0, rebuildSkipped: 'source snapshot changed' });
});
it('checks full restored inputs again before the second regeneration command', async () => {
    const f = fixture(), b = buildOptions(f);
    b.commands[0].mockImplementation(async () => { writeFileSync(f.home, 'External after configure'); });
    await expect(cleanupCompositionBuild(b.options)).rejects.toThrow();
    expect(b.commands[0]).toHaveBeenCalledOnce();
    expect(b.commands[1]).not.toHaveBeenCalled();
    expect(readFileSync(f.home, 'utf8')).toBe('External after configure');
    expect(b.recorded).toMatchObject({ rebuildCommands: 1, rebuildSkipped: 'source snapshot changed' });
});
it('regenerates only after confirmed shutdown, exact owners and full source checks', async () => {
    const f = fixture(), b = buildOptions(f);
    await cleanupCompositionBuild(b.options);
    expect(b.commands.every(command => command.mock.calls.length === 1)).toBe(true);
    expect(b.recorded).toMatchObject({ runtimeStopped: true, pageRestored: true, projectRestored: true, sourcesUnchanged: true, rebuildCommands: 2, rebuildSkipped: null, cleanupErrors: [] });
});
