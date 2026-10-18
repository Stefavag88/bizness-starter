import { afterEach, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createOwnedMedia } from "../e2e/helpers/owned-media";
const roots: string[] = [];
const original = Buffer.from([0, 255, 128, 13, 10, 0]);
const expected = Buffer.from([137, 80, 78, 71, 0, 255, 1]);
function fixture(existing = false) {
  const root = mkdtempSync(join(tmpdir(), "owned-media-"));
  roots.push(root);
  const uploadsRoot = join(root, "apps/site/public/uploads");
  mkdirSync(uploadsRoot, { recursive: true });
  const path = join(uploadsRoot, "literal.png");
  if (existing) writeFileSync(path, original);
  const guard = createOwnedMedia(path, join(root, "backups"), { uploadsRoot });
  return { root, uploadsRoot, path, guard };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
it("exclusively creates an initially absent literal binary and removes only owned bytes", () => {
  const { path, guard } = fixture();
  guard.create(expected);
  expect(guard.owns()).toBe(true);
  expect(readFileSync(path)).toEqual(expected);
  guard.restore();
  expect(existsSync(path)).toBe(false);
});
it("refuses create on an originally present file", () => {
  const { path, guard } = fixture(true);
  expect(() => guard.create(expected)).toThrow(/initially absent/);
  expect(readFileSync(path)).toEqual(original);
  guard.restore();
});
it("preserves concurrent EEXIST and permanently revokes the claim", () => {
  const { path, guard } = fixture();
  writeFileSync(path, original);
  expect(() => guard.create(expected)).toThrow(/conflict/i);
  expect(guard.owns()).toBe(false);
  expect(readFileSync(join(guard.backup, "conflict.json"), "utf8")).toContain(
    "EEXIST",
  );
  expect(() => guard.restore()).toThrow(/conflict/i);
  expect(readFileSync(path)).toEqual(original);
});
it("replaces and restores exact non-UTF8 original bytes from a known capture", () => {
  const { path, guard } = fixture(true);
  guard.capture(original);
  guard.replace(expected);
  guard.restore();
  expect(readFileSync(path)).toEqual(original);
  expect(readFileSync(join(guard.backup, "original.bin"))).toEqual(original);
  expect(readFileSync(join(guard.backup, "expected.bin"))).toEqual(expected);
});
it.each(["replace", "restore"] as const)(
  "permanently refuses %s after an external binary edit",
  (action) => {
    const { path, guard } = fixture();
    guard.create(expected);
    writeFileSync(path, original);
    expect(() =>
      action === "replace" ? guard.replace(Buffer.from([2])) : guard.restore(),
    ).toThrow(/conflict/i);
    expect(guard.owns()).toBe(false);
    writeFileSync(path, expected);
    expect(() => guard.capture(expected)).toThrow(/revoked/i);
    expect(() => guard.restore()).toThrow(/conflict/i);
    expect(readFileSync(path)).toEqual(expected);
  },
);
it.each(["replace", "restore"] as const)(
  "revokes %s when the owned source disappears",
  (action) => {
    const { path, guard } = fixture();
    guard.create(expected);
    rmSync(path);
    expect(() =>
      action === "replace" ? guard.replace(original) : guard.restore(),
    ).toThrow(/conflict/i);
    expect(guard.owns()).toBe(false);
    writeFileSync(path, expected);
    expect(() => guard.restore()).toThrow(/conflict/i);
  },
);
it("cannot claim different disk bytes with a predetermined capture", () => {
  const { path, guard } = fixture(true);
  expect(() => guard.capture(expected)).toThrow(/conflict/i);
  expect(() => guard.restore()).toThrow(/conflict/i);
  expect(readFileSync(path)).toEqual(original);
});
it("claims before optional diagnostic I/O fails and still restores exact bytes", () => {
  const { path, guard } = fixture(true);
  rmSync(guard.backup, { recursive: true });
  writeFileSync(guard.backup, "diagnostic failure");
  expect(() => guard.capture(original)).toThrow();
  expect(guard.owns()).toBe(true);
  expect(() => guard.replace(expected)).toThrow();
  expect(guard.owns()).toBe(true);
  guard.restore();
  expect(readFileSync(path)).toEqual(original);
});
it("rejects destinations outside explicitly named uploads", () => {
  const { root, uploadsRoot } = fixture();
  expect(() =>
    createOwnedMedia(join(root, "outside.png"), join(root, "other-backups"), {
      uploadsRoot,
    }),
  ).toThrow(/contained upload/);
});
it("refuses a symlink parent escaping uploads before creation", () => {
  const { root, uploadsRoot } = fixture();
  const outside = join(root, "outside");
  mkdirSync(outside);
  symlinkSync(outside, join(uploadsRoot, "escape"), "junction");
  expect(() =>
    createOwnedMedia(
      join(uploadsRoot, "escape", "image.png"),
      join(root, "symlink-backups"),
      { uploadsRoot },
    ),
  ).toThrow(/contained upload/);
});
it("revokes ownership when a parent is replaced with an escaping symlink", () => {
  const { root, uploadsRoot } = fixture();
  const folder = join(uploadsRoot, "nested");
  mkdirSync(folder);
  const path = join(folder, "image.png");
  const guard = createOwnedMedia(path, join(root, "nested-backups"), {
    uploadsRoot,
  });
  guard.create(expected);
  rmSync(path);
  rmSync(folder, { recursive: true });
  const outside = join(root, "outside");
  mkdirSync(outside);
  writeFileSync(join(outside, "image.png"), expected);
  symlinkSync(outside, folder, "junction");
  expect(() => guard.restore()).toThrow(/conflict/i);
  expect(guard.owns()).toBe(false);
  expect(readFileSync(join(outside, "image.png"))).toEqual(expected);
});

it("retains a permanent revocation even when conflict diagnostics cannot be written", () => {
  const { path, guard } = fixture();
  guard.create(expected);
  rmSync(guard.backup, { recursive: true });
  writeFileSync(guard.backup, "blocked diagnostics");
  writeFileSync(path, original);
  expect(() => guard.restore()).toThrow(/conflict/i);
  expect(guard.owns()).toBe(false);
  writeFileSync(path, expected);
  expect(() => guard.restore()).toThrow(/revoked/i);
  expect(readFileSync(path)).toEqual(expected);
});
it("does not replace or delete an unclaimed original", () => {
  const { path, guard } = fixture(true);
  expect(() => guard.replace(expected)).toThrow(/proven owned/);
  guard.restore();
  expect(readFileSync(path)).toEqual(original);
});
it("claims an exclusive absent write before diagnostic failure and removes only those literal bytes", () => {
  const { path, guard } = fixture();
  rmSync(guard.backup, { recursive: true });
  writeFileSync(guard.backup, "blocked diagnostics");
  expect(() => guard.create(expected)).toThrow();
  expect(guard.owns()).toBe(true);
  expect(readFileSync(path)).toEqual(expected);
  guard.restore();
  expect(existsSync(path)).toBe(false);
});
