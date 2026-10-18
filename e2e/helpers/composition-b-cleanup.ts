/** Test-harness cleanup boundaries; no runtime/product behavior. */
type Action = () => unknown | Promise<unknown>;
export async function cleanupCompositionPublic(actions: Action[]) {
    const failures: unknown[] = [];
    for (const action of actions) {
        try {
            await action();
        }
        catch (error) {
            failures.push(error);
        }
    }
    if (failures.length)
        throw new AggregateError(failures, 'Independent Composition public cleanup failed');
}
export interface BuildCleanupState {
    runtimeStopped: boolean;
    pageRestored: boolean;
    projectRestored: boolean;
    sourcesUnchanged: boolean;
    rebuildCommands: number;
    rebuildSkipped: string | null;
    cleanupErrors: string[];
}
export async function cleanupCompositionBuild(options: {
    closeContext: Action;
    stopRuntime: Action;
    restorePage: Action;
    restoreProject: Action;
    sourcesUnchanged: () => boolean;
    rebuild: Action[];
    record: (state: BuildCleanupState) => void;
}) {
    const failures: unknown[] = [];
    const state: BuildCleanupState = { runtimeStopped: false, pageRestored: false, projectRestored: false, sourcesUnchanged: false, rebuildCommands: 0, rebuildSkipped: null, cleanupErrors: [] };
    for (const [action, flag] of [[options.closeContext, null], [options.stopRuntime, 'runtimeStopped'], [options.restorePage, 'pageRestored'], [options.restoreProject, 'projectRestored']] as const) {
        try {
            await action();
            if (flag)
                state[flag] = true;
        }
        catch (error) {
            failures.push(error);
        }
    }
    const checkSources = () => {
        try {
            state.sourcesUnchanged = options.sourcesUnchanged();
            if (!state.sourcesUnchanged)
                throw Error('Source snapshot changed; regeneration refused');
        }
        catch (error) {
            state.sourcesUnchanged = false;
            failures.push(error);
        }
    };
    // A successful owner restore does not establish ownership of unrelated inputs.
    checkSources();
    const skipReason = () => !state.runtimeStopped ? 'runtime shutdown unconfirmed' :
        !state.pageRestored || !state.projectRestored ? 'owner restoration unconfirmed' :
            !state.sourcesUnchanged ? 'source snapshot changed' : failures.length ? 'cleanup failed' : null;
    state.rebuildSkipped = skipReason();
    if (!state.rebuildSkipped) {
        for (const action of options.rebuild) {
            // Recheck before each command, including after configure may have run.
            checkSources();
            state.rebuildSkipped = skipReason();
            if (state.rebuildSkipped)
                break;
            try {
                await action();
                state.rebuildCommands++;
            }
            catch (error) {
                failures.push(error);
                state.rebuildSkipped = 'regeneration command failed';
                break;
            }
        }
    }
    state.cleanupErrors = failures.map(String);
    try {
        options.record(state);
    }
    catch (error) {
        failures.push(error);
    }
    if (failures.length)
        throw new AggregateError(failures, 'Composition build cleanup failed');
    return state;
}
