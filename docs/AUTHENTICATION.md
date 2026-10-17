# Authentication and roles

Developer-owned `project.json` configures Worker roles. These lists are not CMS-editable and are not included in the generated CMS descriptor. The neutral seed leaves both lists empty, so remote access remains closed until explicitly configured.

```json
{
  "infrastructure": {
    "accessIssuer": "https://your-team.cloudflareaccess.com",
    "accessAudience": "your-access-application-audience",
    "adminEmails": ["owner@example.com"],
    "editorEmails": ["writer@example.com"]
  }
}
```

This example pairs one administrator and one editor for a two-person CMS team. Additional Worker administrators can be listed without becoming Tina members. Merge these fields into the existing infrastructure object. They do not create accounts, invite members or configure a hosted service.

| Role | `/cms` and `/cms/*` | `/admin/*`, `/api/admin/*`, `/api/operations/overview` |
| --- | --- | --- |
| Administrator | Allowed | Allowed when the selected profile exposes the route |
| Editor | Allowed | Denied |
| Unlisted identity | Denied | Denied |

The enquiries profile hides campaign administration routes with 404 before authorization. The operations overview remains administrator-only. Local mail and local APIs remain limited to actual loopback requests in the local environment.

Email identities are trimmed and lowercased in configuration and after signature verification. Invalid emails and duplicate identities within either list are rejected. Overlap between lists is allowed: an administrator retains administrator permissions even when also listed as an editor. Empty administrator lists deny all remote operations; editor-only CMS access still works, but production readiness requires at least one administrator. Lists have no global two-person limit because operations administrators do not necessarily use Tina.

`pnpm configure` emits `ADMIN_EMAILS` and `EDITOR_EMAILS` as JSON arrays in generated Worker configuration. Missing, malformed or invalid runtime arrays fail closed with 503. There is no comma-separated parsing or legacy fallback. Missing Access configuration also returns 503; absent, invalid or unauthorized identities return 403. Responses do not reveal the lists.

Remote authorization verifies the Cloudflare Access JWT assertion using the configured issuer's HTTPS certificate endpoint, the configured application audience, RS256 signatures and a required valid expiry. The signed email claim supplies identity; email headers do not grant access. The issuer must be an HTTPS `cloudflareaccess.com` team hostname. Local development bypass applies only when both `ENVIRONMENT=local` and the actual request hostname is `localhost`, `127.0.0.1` or `[::1]`.

## Hosted setup remains pending

Create one Cloudflare Access application and audience covering `/cms`, `/cms/*`, `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*` and `/api/operations/*`. Its Allow policy must admit the union of administrator and editor identities so editors can reach the CMS. The Worker performs the narrower role checks on operational routes; passing the Access policy alone does not grant administrator permissions. Preserve the Worker-first routing rules for these paths.

Tina membership is a separate invitation and authorization system. Keep Tina on the Free plan with at most two CMS users; invite only the people who need to edit content. Adding a Worker administrator does not create or consume a Tina seat by itself. Do not assume every allowlisted identity is a Tina member. Access login followed by Tina login is the expected current flow. This implementation adds no account synchronization or Tina seat enforcement and performs no plan upgrade, hosted account changes or deployment.

For revocation, remove the identity from the appropriate Worker lists and regenerate/redeploy the Worker. Also update the Access policy and revoke applicable existing Access sessions, and remove Tina membership if content access must end. Existing sessions, deployed configuration and Tina authorization have separate lifecycles; editing a local list does not instantly revoke a live session or a hosted Tina account.

## Migration

Remove the old `infrastructure.adminEmail` key and replace it with `adminEmails` and `editorEmails` arrays. For a configured single administrator, put that email in `adminEmails`; for the unconfigured seed use two empty arrays. The strict configuration schema rejects the old key. Regenerate configuration with `pnpm configure`, run local checks, then deploy only as a separately authorized hosted step. Do not edit `wrangler.generated.json` by hand. Changing lists requires regeneration and redeployment before it affects a remote Worker.

Local tests cover normalized configuration, generated JSON arrays, production readiness, real signed JWT claims and real Worker role routing. Hosted Access policy/path coverage, certificate retrieval, identity-provider login, Tina invitations and the two-login flow still require external verification before release.
