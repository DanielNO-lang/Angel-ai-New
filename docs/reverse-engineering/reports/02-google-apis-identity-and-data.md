# Capability audit 02: Google APIs, identity, maps, and data

**Evidence level:** Public README/documentation review. Individual API versions and source implementations need further inspection before integration. This is not a claim that REA was executed or every file was analyzed.

## 25. googleapis/googleapis
**Capabilities:** Protocol Buffer interface definitions for Google APIs, commonly shared across REST/JSON and gRPC services; versioned API directories and code-generator configuration.
**Architecture:** API/service directories, version subdirectories, proto schemas, and generator metadata.
**Angel recommendation:** Reference for typed Google service integration. Do not vendor the full repository into Angel.

## 26. gaowanlu/google
**Capabilities:** Vercel serverless website proxy example using http-proxy-middleware, configurable target host, origin handling, and path rewriting.
**Architecture:** Proxy entrypoint and deployment instructions.
**Angel recommendation:** A controlled proxy can be useful for services Angel owns, but do not adopt this as a Google-access workaround, regional restriction bypass, or open proxy. Prefer official APIs and a strict host allowlist.

## 27. googlesamples/google-services
**Capabilities:** Quickstart samples demonstrating Google APIs on Android and iOS.
**Architecture:** Independent mobile examples and setup instructions.
**Angel recommendation:** Reference only if native mobile wrappers are built. These samples are not directly reusable in the existing React/TypeScript web app.

## 28. googleapis/google-api-php-client
**Capabilities:** PHP client for Google APIs such as Gmail, Drive, and YouTube; shared authentication and API request helpers. README says it is in maintenance mode and recommends service-specific Cloud libraries for Cloud APIs.
**Architecture:** PHP package, docs, and examples.
**Angel recommendation:** Low direct fit for the TypeScript app. Do not add a PHP runtime solely to use this client.

## 29. googleapis/google-api-python-client
**Capabilities:** Python client for discovery-based Google APIs; bundled/cached discovery documents and typed service resources. README describes maintenance-mode status and recommends Cloud Client Libraries for new development where appropriate.
**Architecture:** Generated service clients and shared request/auth helpers.
**Angel recommendation:** Use only if Angel adds a Python backend/worker. Prefer modern service-specific clients when appropriate.

## 30. googleapis/google-api-nodejs-client
**Capabilities:** Node.js Google API client; OAuth 2.0, API keys, JWT/service-account auth, request options, media uploads, HTTP/2, and TypeScript support.
**Architecture:** Generated service clients plus common auth/transport.
**Angel recommendation:** Candidate for a server-side Google API adapter, especially Drive/Gmail/Calendar. Never expose client secrets or service-account private keys in browser code. Request minimal scopes and support revocation.

## 31. first20hours/google-10000-english
**Capabilities:** Frequency-ranked list of 10,000 common English words based on n-gram analysis; README marks the repository as not maintained.
**Architecture:** Static lexical dataset, not an application.
**Angel recommendation:** Optional resource for vocabulary practice, spelling, or word games. Validate license, quality, and educational suitability; word frequency is not a complete curriculum.

## 32. mxrch/GHunt
**Capabilities:** Google-focused OSINT CLI/Python library with asynchronous modules, JSON export, and browser companion for login/session assistance. README documents cookie-based authentication.
**Architecture:** Modular reconnaissance commands with authenticated account/session context.
**Angel recommendation:** Do not port account reconnaissance or cookie collection into Angel. For personal-account security, use consent-based official APIs and narrow scopes. Never ask users to paste or store Google session cookies.

## 33. justjavac/google-ips
**Capabilities:** Historical public IP address data organized by country/region, packaged as npm/JSON with lookup helpers.
**Architecture:** Static/generated dataset and small query API.
**Angel recommendation:** Low product value. For network diagnostics use maintained official sources and live checks rather than relying on a potentially stale IP list.

## 34. wstrange/GoogleAuth
**Capabilities:** Java server-side TOTP library for creating shared secrets, generating time-based one-time passwords, and verifying them.
**Architecture:** Reusable library implementing RFC 6238.
**Angel recommendation:** MFA is relevant, but use a maintained library in Angel's actual backend language or the identity provider's MFA service. Do not implement custom cryptography.

## 35. react-native-google-signin/google-signin
**Capabilities:** Google Sign-In for React Native/Expo on Android and iOS. README describes a public edition using legacy Android sign-in SDK and distinguishes it from a paid universal cross-platform offering.
**Architecture:** Native platform bridge plus SDK configuration.
**Angel recommendation:** Relevant only for a React Native mobile client. For Angel's web app, use supported web identity/OAuth flows and verify redirect URI, state/nonce, scopes, session persistence, and post-login routing. This library does not by itself fix web OAuth.

## 36. gosom/google-maps-scraper
**Capabilities:** Google Maps business-data extraction with CLI, web UI, and REST API.
**Architecture:** Scraping engine, job inputs, result outputs, and service interfaces.
**Angel recommendation:** Business discovery could be useful, but use official Places/Maps APIs or other licensed sources, respect terms/rate limits, and minimize data collection. Do not add bulk scraping that circumvents service restrictions.

## 37. protocolbuffers/protobuf
**Capabilities:** Language/platform-neutral structured-data serialization, schema compiler, and runtimes for many languages.
**Architecture:** .proto schema definitions compiled into language bindings plus runtime libraries.
**Angel recommendation:** Consider for typed messages between independent services or native/server components. JSON and TypeScript types are simpler for Angel's current app; add protobuf only when interoperability justifies complexity.

## 38. googleapis/google-api-go-client
**Capabilities:** Generated Go clients for Google APIs built from discovery documents, with service-specific packages and examples; README warns of possible breaking changes and describes maintenance-mode status.
**Architecture:** Generated client packages and shared HTTP/auth machinery.
**Angel recommendation:** Only if Angel intentionally adds a Go service. Avoid adding Go just to consume APIs already accessible through Node/TypeScript.

## 39. taylorwilsdon/google_workspace_mcp
**Capabilities:** MCP server exposing natural-language operations for Calendar, Drive, Gmail, Docs, Sheets, Slides, Forms, Tasks, Contacts, and Chat. README also advertises CLI and Code Mode integrations.
**Architecture:** MCP tool server, Google OAuth/scopes, service-specific operations, and client integrations.
**Angel recommendation:** **High priority.** Build a Workspace connector with a visible permission list, per-service scope selection, read/write separation, dry-run previews, confirmations for sending/deleting/sharing, audit logs, and revocation. Quotas and OAuth setup still apply; the connector does not remove these requirements.

## 40. google/google-ctf
**Capabilities:** Historical CTF challenges and infrastructure, including intentionally vulnerable challenge environments.
**Architecture:** Challenge folders by year/topic plus deployment infrastructure.
**Angel recommendation:** Security learning in isolated, disposable environments only. Never run vulnerable challenges in production or on public networks.

## 41. tomchentw/react-google-maps
**Capabilities:** React components for embedding and configuring Google Maps.
**Architecture:** UI wrapper around Maps JavaScript APIs.
**Angel recommendation:** Map-based trip, lesson, and nearby-service visualizations could be useful, but the library is old. Prefer a maintained wrapper or direct Maps APIs after compatibility review.

## 42. antonioribeiro/google2fa
**Capabilities:** PHP implementation of HOTP/TOTP two-factor authentication.
**Architecture:** Reusable PHP package implementing RFC 4226 and RFC 6238.
**Angel recommendation:** Same as GoogleAuth: use a maintained implementation in the selected backend or identity provider, not a separate PHP dependency.

## 43. googleads/googleads-mobile-android-examples
**Capabilities:** Legacy Android Google Mobile Ads SDK examples. README explicitly recommends next-generation SDK samples for new work.
**Architecture:** Android sample apps and snippets.
**Angel recommendation:** No core fit. Advertising is a separate product/monetization decision, not an AI capability. Do not add ads without privacy and UX review.

## 44. googleapis/google-cloud-java
**Capabilities:** Java client libraries for Google Cloud services, with service-specific packages and release/stability metadata.
**Architecture:** Many independent client libraries in a large repository.
**Angel recommendation:** Only relevant if Angel intentionally chooses a Java backend. Otherwise use existing TypeScript integrations.

## 45. angular-ui/angular-google-maps
**Capabilities:** AngularJS directives for Google Maps.
**Architecture:** Legacy AngularJS UI wrapper.
**Angel recommendation:** **Do not adopt.** The repository says it is no longer actively maintained and is outdated. Use maintained APIs or wrappers.

## 46. firebase/flutterfire
**Capabilities:** Flutter plugins for Firebase services across mobile/web, with service-specific packages and native plugin bridges.
**Architecture:** A family of Dart/Flutter platform packages.
**Angel recommendation:** Relevant if Angel gets a Flutter-native client, not a drop-in backend for React/TypeScript. Compare against existing Supabase auth/data before introducing a second platform.

## Cross-cutting implementation guidance
- Put Google integrations behind a server-side connector layer with narrow OAuth scopes, token refresh, revocation, rate limiting, audit records, and clear consent.
- Separate read actions from writes. For send/share/delete/update operations, preview the exact effect and require confirmation.
- Prefer official APIs over scraping or proxy workarounds. Never collect cookies or bypass service restrictions.
- Use generated clients only in the runtime/language where they belong; avoid unnecessary PHP, Python, Go, Java, Flutter, and React Native dependencies.
- Add a URL research adapter to Angel's capability research workflow: classify public URL type, fetch allowed docs, capture citations and dates, identify licensing and security notes, and label unverified inferences. Do not bypass login, paywalls, CAPTCHA, rate limits, or technical access controls.
