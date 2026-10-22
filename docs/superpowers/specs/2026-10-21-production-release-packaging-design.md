# Production release packaging

The owner approved isolated production builds, artifact/identity verification, guarded release commands and recovery instructions on 2026-10-21. Continue inline with one independent final review. No cloud deployment, remote migration, secret use or provisioning. Preserve local configuration, design, content and existing analytics edits. Staging remains optional.

## Package and build boundary

A release build requires --target production and --config FILE and uses the existing strict production target. An explicit runtime input inventory is copied with canonical project/content/uploads into a unique .generated/releases/run-ID/workspace. No generated CMS/assets, .env, .dev.vars, .wrangler state, .git, node_modules or unknown files are copied. Every copied input has a SHA-256 fingerprint; source and target are rechecked before finalization. Workspaces/artifacts are retained on failure, never broadly cleaned. Source project.json and local generated state remain untouched.

The workspace replaces only its owned project.json with the production projection. A sanitized child environment excludes cloud/AWS/Turnstile/Tina tokens and named-environment overrides; dependency install uses isolated empty npm configuration. Run frozen install, check, public build, a bundled Worker dry-run, local disposable D1 migrations and a no-bundle dry-run of the packaged Worker. Commands are fixed argv arrays with timeouts and recorded exit status. No remote command exists in this build path.

Hosted Tina credentials are not available. Do not copy the local editor or pretend it is a hosted CMS build. The candidate explicitly records CMS not built and remains blocked. Native hosted CMS build/verification is a later required gate; admin operations already rendered by the Worker are independent. The selected production site/key are built into the frontend and Worker from the same projected project.

Package contains only assets/, worker/ bundled output, migrations/, project.json (nonsecret projection), identity.json and wrangler.json, plus release.json. Relative runtime paths are frozen. Manifest records source revision/actual input digest, target hash, selected identities, tool versions, completed local checks, file hashes, releaseId checksum and permanent blocked readiness/issues. Hashes detect accidental tampering, not malicious owner re-signing. Local evidence is not cloud ownership or hosted certification.

## Deployment identity

Configure emits a generated deployment identity for nonlocal builds and null for local builds. It includes app/environment/site/profile/public key; the generated Worker variables contain the exact same serialized identity. Frontend HTML contains a nonvisual deployment identity meta marker. Worker HTTP/queue/scheduled/Workflow entry points validate the compiled identity against the bound identity/environment/site/profile/key before side effects. Legacy local builds with no identity binding retain current local/auth test behavior. Mixed compiled/runtime identities fail closed. Release verification checks frontend markers, compiled Worker marker, config bindings and manifest identity.

## Verification and command guards

release:verify validates regular contained files and exact inventory/hash/checksum, rejects links/extra/missing files and local showcase/template/admin-dev output, and compares the selected target's account/domain/database/resource names to the package. It does not rebuild or modify packages. Migration filenames remain ordered unique forward migrations; local rehearsal is evidence, never permission for remote SQL.

release:deploy and release:migrate require --target production, --artifact DIR, --account ID and --database UUID. They emit a structured command plan using the already verified artifact and exact pinned target; no arbitrary flags or environment overrides. --execute fails closed while existing hosted gates are unresolved. There is no force/yes override and no remote process runner in this milestone. The artifact is a blocked candidate, not a release authorization. CI may rehearse package creation without secrets; it must not deploy on push.

## Acceptance and recovery

Tests cover copied-file ownership, credentials/state exclusion, source changes, target/config mismatch, tampering/extra/link inputs, generated-client exports, environment sanitization and runtime identity mismatch before side effects. A real isolated inert-target package must build/typecheck, migrate local D1 and bundle/no-bundle dry-run; serve representative pages locally to verify markers/key/origin and exclusion of local pages. Test command guards in pure functions, never by attempting a remote command. One independent final review and verified fix pass. Retain prior artifact/schema compatibility and a tested database recovery point; code rollback never reverses migrations. All other production gates remain mandatory.

Acceptance refinement: local D1 rehearsal uses an owned short OS temporary directory, recorded as localState in build-report.json and retained. Reproduced Windows nested-path failure with default persistence; the exact same migrations succeeded when only --persist-to selected a short path. No schema changes or remote SQL were needed.
