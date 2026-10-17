import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
  appendFileSync, mkdtempSync,
} from 'node:fs';
import {resolve, dirname, join, relative, basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createOwnedFileEdit} from './owned-file-edit.mjs';
import {runOwnedCommand} from './owned-command.mjs';
import {resolvePorts, assertPortsFree} from './ports.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function files(path) {
  return existsSync(path) ? readdirSync(path, {withFileTypes: true}).flatMap(entry =>
    entry.isDirectory() ? files(join(path, entry.name)) : [join(path, entry.name)]) : [];
}

// Match dedicated compiled DOM selectors, not the reserved route name that also
// legitimately occurs in CMS validation. Shared theme/global CSS stays allowed.
const previewSelector = /(?:#showcase-(?:toolbar|theme|density|language|reset)|\.showcase-(?:shell|toolbar|swatches|swatch|color|controls))\b/;
function assetInventory(dist) {
  return files(dist).filter(file => /\.(js|css|woff2?)$/.test(file)).map(file => {
    const bytes = readFileSync(file);
    const executable = /\.(js|css)$/.test(file);
    const showcase = executable && (
      /(?:ShowcaseLayout\.astro|design-preview)/.test(basename(file)) ||
      previewSelector.test(bytes.toString('utf8'))
    );
    return {
      path: relative(dist, file).replaceAll('\\', '/'),
      bytes: bytes.length,
      sha256: hash(bytes),
      showcase,
    };
  }).sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

function assertOutput(root, local, assets) {
  const dist = join(root, 'apps/site/dist');
  if (existsSync(join(dist, 'design-system')) !== local) {
    throw Error('Unexpected showcase output for ' + (local ? 'local' : 'nonlocal') + ' build');
  }
  if (local && !existsSync(join(dist, 'design-system/index.html'))) {
    throw Error('Missing local showcase index');
  }
  const manifest = join(root, '.generated/manifest.json');
  if (!existsSync(manifest) || readFileSync(manifest, 'utf8').includes('design-system')) {
    throw Error('Missing or leaked showcase manifest');
  }
  for (const file of files(dist).filter(file =>
    /\.(html|xml|json)$/.test(file) && !file.includes(join('dist', 'design-system')))) {
    if (readFileSync(file, 'utf8').includes('/design-system')) {
      throw Error('Showcase navigation/feed output leaked: ' + file);
    }
  }
  if (!local) {
    const leaked = assets.filter(asset => asset.showcase);
    if (leaked.length) throw Error('Showcase asset leaked: ' + leaked.map(asset => asset.path).join(', '));
  }
}

export async function verifyShowcaseBuilds({
  path = 'project.json', backupRoot = '.generated/showcase-builds', run, refresh,
} = {}) {
  path = resolve(path);
  backupRoot = resolve(backupRoot);
  const root = dirname(path);
  const original = readFileSync(path);
  const base = JSON.parse(original);
  let conflict = false;

  // Retain original bytes before any mutation and keep each run independently.
  mkdirSync(backupRoot, {recursive: true});
  const evidenceDirectory = mkdtempSync(join(backupRoot, 'run-'));
  writeFileSync(join(evidenceDirectory, 'original.json'), original, {flag: 'wx'});
  const evidence = {
    originalHash: hash(original), stages: [], commands: [], inventories: [],
    restored: false, conflict: false,
  };
  const proof = () => {
    const value = JSON.stringify(evidence, null, 2) + '\n';
    writeFileSync(join(evidenceDirectory, 'evidence.json'), value);
    writeFileSync(join(backupRoot, 'evidence.json'), value);
  };
  const inspect = environment => {
    const assets = assetInventory(join(root, 'apps/site/dist'));
    evidence.inventories.push({environment, assets});
    proof(); // Retain the failing inventory as well as successful ones.
    assertOutput(root, environment === 'local', assets);
  };
  const command = async (args, cwd = root) => {
    const timeoutMs = Number(process.env.SHOWCASE_BUILD_TIMEOUT_MS || 120000);
    const record = {args, cwd, timeoutMs, pid: null, passed: false};
    evidence.commands.push(record);
    proof();
    await runOwnedCommand(process.execPath, args, {
      cwd, timeoutMs, env: {...process.env, ASTRO_TELEMETRY_DISABLED: '1'},
      onStart: pid => {
        record.pid = pid;
        proof();
      },
      onOutput: text => {
        appendFileSync(join(evidenceDirectory, 'commands.log'), text);
        process.stdout.write(text);
      },
    });
    record.passed = true;
    proof();
  };
  const build = async () => {
    await command(['scripts/configure.mjs']);
    await command([join(root, 'apps/site/node_modules/astro/bin/astro.mjs'), 'build'], join(root, 'apps/site'));
  };

  // Build each nonlocal environment under a separate exact-byte owner.
  try {
    for (const environment of ['staging', 'production']) {
      if (!existsSync(path) || !readFileSync(path).equals(original)) {
        conflict = true;
        throw Error('Showcase source ownership conflict before mutation; original backup: ' + join(evidenceDirectory, 'original.json'));
      }
      const edit = createOwnedFileEdit(path, backupRoot);
      const next = structuredClone(base);
      next.environment = environment;
      try {
        edit.replace(JSON.stringify(next, null, 2) + '\n');
        await (run ?? build)(environment);
        inspect(environment);
        evidence.stages.push(environment);
      } finally {
        try {
          edit.restore();
        } catch (error) {
          conflict = true;
          throw error;
        }
      }
    }
  } catch (error) {
    evidence.error = error.message;
    throw error;
  } finally {
    // Conflicts preserve competing bytes and prevent configuration regeneration.
    if (!existsSync(path) || !readFileSync(path).equals(original)) conflict = true;
    evidence.conflict = conflict;
    evidence.restored = !conflict;
    try {
      if (!conflict) {
        // Rebuild local last, then check ownership again before accepting it.
        await (refresh ?? build)();
        if (!existsSync(path) || !readFileSync(path).equals(original)) {
          evidence.conflict = true;
          evidence.restored = false;
          throw Error('Showcase source ownership conflict during final local build; preserved current source and original backup: ' + join(evidenceDirectory, 'original.json'));
        }
        inspect('local');
        evidence.stages.push('local');
        evidence.finalHash = hash(readFileSync(path));
      }
    } finally {
      proof();
    }
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await assertPortsFree(resolvePorts());
  await verifyShowcaseBuilds();
}
