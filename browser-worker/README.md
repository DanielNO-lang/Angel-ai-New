# Angel AI isolated browser worker

This is a separate container service, not part of the Vercel frontend/serverless bundle. It runs an isolated Playwright browser and accepts requests only from Angel's server using `ANGEL_BROWSER_WORKER_SECRET`.

## Deploy prerequisites

- Deploy this folder as a container service on a dedicated service such as Cloud Run or another container host.
- Configure `ANGEL_BROWSER_WORKER_SECRET` to a random secret of at least 32 bytes. Set the exact same value as a server-only secret in Angel's application environment.
- Set a private ingress policy when supported, or restrict access to the worker to the Angel backend. Public ingress still requires the shared secret and HTTPS.
- Enforce outbound network rules at the host/firewall level to block loopback, RFC1918, link-local, cloud metadata, service networks, and other internal destinations. The in-process resolver checks are defense-in-depth, not a substitute for egress isolation.
- Set `ANGEL_BROWSER_WORKER_URL` in Angel to the worker's HTTPS base URL.
- Never expose either server-only secret to the client.

## Implemented actions

- Start an isolated browser session at an approved HTTPS URL.
- Navigate among exact hostnames granted by the signed-in user.
- Read the current page's visible text and title.
- Capture a bounded screenshot.
- Click an explicitly selected page element.
- Fill ordinary form fields, while refusing password, payment-card, identity-number, OTP, API-key and token-like fields.
- Close a session.

Downloads, uploads, automated credential entry, OS control, purchases, and destructive actions are deliberately unsupported. The main application denies unsupported worker operations rather than pretending they ran. High-impact actions such as clicks/submissions require a separate server-issued, one-time confirmation from the main application.

## Runtime limits

Sessions live in worker memory and expire after 20 minutes by default. A worker restart closes existing sessions, so the user must start a new session. Deploy multiple replicas only after adding a shared session store or sticky routing. Keep session limits low until measured.

## Local checks

```sh
npm install
npm test
ANGEL_BROWSER_WORKER_SECRET='replace-with-a-long-random-secret' npm start
```

Use only test accounts and test pages during preview testing.
