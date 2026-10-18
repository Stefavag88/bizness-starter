import { Buffer } from "node:buffer";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
/** Byte ownership is established only from caller-known literals, never observed replacements. */
export function createOwnedMedia(
  path: string,
  backupRoot: string,
  options: { uploadsRoot?: string } = {},
) {
  path = resolve(path);
  const uploads = resolve(options.uploadsRoot || "apps/site/public/uploads");
  const contained = (root: string, target: string) => {
    const r = relative(root, target);
    return !!r && !r.startsWith(".." + sep) && r !== ".." && !isAbsolute(r);
  };
  const realUploads = realpathSync(uploads);
  function checkPath() {
    if (
      !contained(uploads, path) ||
      !contained(
        realUploads,
        join(realpathSync(dirname(path)), relative(dirname(path), path)),
      )
    )
      throw Error("Expected contained upload destination: " + path);
    if (
      existsSync(path) &&
      (lstatSync(path).isSymbolicLink() ||
        !lstatSync(path).isFile() ||
        !contained(realUploads, realpathSync(path)))
    )
      throw Error("Expected contained upload file: " + path);
  }
  checkPath();
  const original = existsSync(path) ? readFileSync(path) : undefined;
  mkdirSync(backupRoot, { recursive: true });
  const backup = mkdtempSync(join(backupRoot, "media-"));
  if (original)
    writeFileSync(join(backup, "original.bin"), original, { flag: "wx" });
  writeFileSync(
    join(backup, "manifest.json"),
    JSON.stringify({ path, uploads, exists: original !== undefined }, null, 2),
  );
  let owned: Buffer | undefined,
    revoked = false;
  const observe = () => {
    checkPath();
    return existsSync(path) ? readFileSync(path) : undefined;
  };
  function conflict(error?: unknown): never {
    const expected = owned ?? original;
    owned = undefined;
    revoked = true; // Revoke before diagnostic operations, which may themselves fail.
    try {
      if (expected)
        writeFileSync(join(backup, "conflict-expected.bin"), expected);
      let current: Buffer | undefined;
      try {
        current = observe();
      } catch {}
      if (current)
        writeFileSync(join(backup, "conflict-observed.bin"), current);
      writeFileSync(
        join(backup, "conflict.json"),
        JSON.stringify({
          path,
          error: String(error ?? "byte mismatch"),
          missing: current === undefined,
        }),
      );
    } catch {}
    throw Error(
      "Media ownership conflict; claim permanently revoked: " +
        path +
        "; evidence " +
        backup,
      { cause: error },
    );
  }
  function active() {
    if (revoked)
      throw Error(
        "Media ownership conflict; claim permanently revoked: " + path,
      );
  }
  function compare(expected: Buffer | undefined) {
    active();
    let actual: Buffer | undefined;
    try {
      actual = observe();
    } catch (error) {
      return conflict(error);
    }
    if (
      actual === undefined
        ? expected !== undefined
        : expected === undefined || Buffer.compare(actual, expected) !== 0
    )
      conflict();
  }
  function claim(bytes: Buffer) {
    const next = Buffer.from(bytes);
    owned = next;
    writeFileSync(join(backup, "expected.bin"), next);
  }
  return {
    backup,
    owns: () => owned !== undefined && !revoked,
    originalState: () =>
      original === undefined
        ? { exists: false as const }
        : { exists: true as const, bytes: Buffer.from(original) },
    create(bytes: Buffer) {
      active();
      if (original !== undefined)
        throw Error("Media create requires initially absent destination");
      try {
        checkPath();
        writeFileSync(path, bytes, { flag: "wx" });
      } catch (error) {
        conflict(error);
      }
      claim(bytes);
    },
    capture(bytes: Buffer) {
      active();
      compare(bytes);
      claim(bytes);
    },
    replace(bytes: Buffer) {
      active();
      if (!owned) throw Error("Media replace requires a proven owned Buffer");
      compare(owned);
      try {
        writeFileSync(path, bytes);
      } catch (error) {
        conflict(error);
      }
      claim(bytes);
    },
    restore() {
      active();
      compare(owned ?? original);
      if (owned) {
        try {
          if (original === undefined) unlinkSync(path);
          else writeFileSync(path, original);
        } catch (error) {
          conflict(error);
        }
        owned = undefined;
      }
    },
  };
}
