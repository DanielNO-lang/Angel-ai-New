# Phase 5 Findings: Google API SDKs, OAuth and Time-based One-time Passwords

**Review date:** 2026-10-23  
**Evidence level:** selected current source files and entrypoints inspected; no SDK was installed or executed. This is not a complete SDK audit.

## 1. Official Google APIs Node.js client

Repository: https://github.com/googleapis/google-api-nodejs-client  
Pinned revision: `206bd0334f32aee0fefe02595f88641a5899c2d1`  
Source: https://github.com/googleapis/google-api-nodejs-client/blob/206bd0334f32aee0fefe02595f88641a5899c2d1/src/googleapis.ts  
README: https://github.com/googleapis/google-api-nodejs-client/blob/206bd0334f32aee0fefe02595f88641a5899c2d1/README.md

### Observed source/API shape
- `GoogleApis` extends generated API bindings and keeps a `Discovery` helper for dynamic service discovery.
- Internal `addAPIs` adds API constructors; `discoverAsync` loads discovery metadata, calls `discoverAllAPIs`, and resolves a service endpoint for the requested API path.
- The README demonstrates `google.auth.OAuth2`, `generateAuthUrl`, service client factories such as `google.drive({version: 'v3', auth})`, `google.gmail`, and generated resource calls such as `drive.files.list/create/export`, `gmail.users.watch`, and Cloud API calls.
- `getSupportedAPIs()` returns the generated API catalogue.

### Angel relevance
This is the best of the provided language SDKs for a potential Node/TypeScript Google-service backend. Use dedicated, typed provider/service adapters for only the Google products Angel actually needs. Prefer official API scopes and explicit read/write functions. Keep tokens/server secrets out of the browser bundle; never pass arbitrary discovered services to an agent without an allowlist.

## 2. Google APIs Python client

Repository: https://github.com/googleapis/google-api-python-client  
Pinned revision: `d25de7189bedfdc75b69d3ae6ebf684020329206`  
Source: https://github.com/googleapis/google-api-python-client/blob/d25de7189bedfdc75b69d3ae6ebf684020329206/googleapiclient/discovery.py  
README: https://github.com/googleapis/google-api-python-client/blob/d25de7189bedfdc75b69d3ae6ebf684020329206/README.md

### Observed source/API shape
- Discovery-based client generation is central; source defines `Resource` and `ResourceMethodParameters` types/classes and the logic that builds resource methods from discovery documents.
- README labels this library complete/in maintenance mode and recommends Google Cloud client libraries for supported Cloud services in new projects where available.

### Angel relevance
The concepts of service discovery, generated operation schemas and typed resources can inform a connector adapter. The Python SDK is not a direct dependency for Angel's current TypeScript runtime. Only add a Python service if a concrete need justifies separate hosting/runtime/maintenance.

## 3. Google APIs PHP client

Repository: https://github.com/googleapis/google-api-php-client  
Pinned revision: `31b577e7012c4e68d5289d63aaf7e6d471ec1ff1`  
Source: https://github.com/googleapis/google-api-php-client/blob/31b577e7012c4e68d5289d63aaf7e6d471ec1ff1/src/Client.php

### Key methods in `Google\\Client`
- OAuth: `createAuthUrl`, `authenticate`, `fetchAccessTokenWithAuthCode`, `refreshToken`, `fetchAccessTokenWithRefreshToken`, `verifyIdToken`, `revokeToken`.
- Scope/credentials: `setScopes`, `addScope`, `getScopes`, `setAuthConfig`, `setAuthConfigFile`, `setAccessToken`, `getAccessToken`, `getRefreshToken`, `isAccessTokenExpired`.
- Configuration and transport: `setRedirectUri`, `setState`, `setAccessType`, `setLoginHint`, `setHostedDomain`, `setIncludeGrantedScopes`, `setHttpClient`, `getHttpClient`, `setCache`, `setLogger`, `getOAuth2Service`.

### Angel relevance
This is a useful inventory of OAuth lifecycle concerns: nonce/state, scopes, ID-token verification, refresh, expiry, revocation, cache and audit/log behavior. Do not port PHP code to the React app. For Angel's current web login, preserve one canonical Supabase OAuth flow unless a documented requirement demands a change; verify the callback, session and identity server-side.

## 4. React Native Google Sign-In

Repository: https://github.com/react-native-google-signin/google-signin  
Pinned revision: `0600358d71120b1d8ba0b59f136104ffd8d4b44d`  
Source: https://github.com/react-native-google-signin/google-signin/blob/0600358d71120b1d8ba0b59f136104ffd8d4b44d/src/signIn/GoogleSignin.ts

### Key exported/native bridge operations
- `configure(options)`
- `signIn(options)`
- `hasPlayServices(...)`
- `addScopes(...)`
- `signInSilently()`
- `signOut()`
- `revokeAccess()`
- `hasPreviousSignIn()`
- `getCurrentUser()`
- `clearCachedAccessToken(tokenString)`
- `getTokens()`

The implementation delegates to a native module, so its behavior is coupled to supported native Android/iOS platform implementations.

### Angel relevance
Useful only if Angel later has a React Native client. It does not fix browser-based Supabase OAuth and should not be added to the current web app to solve a web callback/session problem. Avoid maintaining parallel OAuth state systems without a specific architecture need.

## 5. GoogleAuth Java library (TOTP/HOTP)

Repository: https://github.com/wstrange/GoogleAuth  
Pinned revision: `732fbb6958ed35af3454fdeb972d7ddfa305185c`  
Source: https://github.com/wstrange/GoogleAuth/blob/732fbb6958ed35af3454fdeb972d7ddfa305185c/src/main/java/com/warrenstrange/googleauth/GoogleAuthenticator.java

### Key methods observed
- `createCredentials()` / `createCredentials(userName)`: create authenticator credentials, including a shared secret and generated scratch codes.
- `getTotpPassword(secret)` / `getTotpPassword(secret, time)`: produce time-based one-time password values.
- `authorize(secret, verificationCode)` / time-specific variant: verify a supplied OTP against a secret/time window.
- `authorizeUser(userName, verificationCode)`: verify against a stored user credential.
- `setCredentialRepository(...)`: pluggable credential storage.

### Angel relevance
TOTP is a separate second-factor function, not the same as Google OAuth sign-in. For Angel, prefer Supabase's managed MFA where it satisfies the requirement. A custom TOTP implementation would require secure secret provisioning/storage, recovery codes, rate limiting, replay protection, clock-window policy and account-recovery design.

## 6. Google2FA PHP library

Repository: https://github.com/antonioribeiro/google2fa  
Pinned revision: `8c4def923114062983bcded1a3d2ce55abf279b5`  
Source: https://github.com/antonioribeiro/google2fa/blob/8c4def923114062983bcded1a3d2ce55abf279b5/src/Google2FA.php

### Key methods observed
- `generateSecretKey`
- `getCurrentOtp`
- `oathTotp` / `generateHotp`
- `verify`, `verifyKey`, `verifyKeyNewer`
- `getWindow`, `setWindow`, `setAlgorithm`, `setOneTimePasswordLength`, `setKeyRegeneration`
- `getSecret`, `setSecret`

### Angel relevance
Useful as a reference for TOTP verification and clock-window configuration in a PHP service. It is not part of Angel's current stack. Before reuse, verify current maintenance, dependencies and license, and prefer managed MFA if possible.

## 7. Unified Google identity/integration recommendation

- **Web login:** repair and test the existing Supabase Google OAuth path first; check OAuth state/callback, account identity, session restore, logout and user-bound persistence.
- **Future native app:** evaluate React Native Google Sign-In only if the app architecture changes to React Native.
- **Google Workspace data:** prefer the official Node API clients or a reviewed Google Workspace MCP connection with granular scopes, action-specific approvals and an audit trail.
- **MFA:** keep OAuth authentication and TOTP multi-factor verification separate; prefer provider-managed MFA.
- **Other languages:** Python/PHP samples are reference material, not reasons to introduce more runtimes into Angel.
