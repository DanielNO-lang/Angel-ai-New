# Google Sign-In configuration for Angel AI New

This setup is for the active Supabase project Angel (qltiogotxbxwzwmnypwu) and Netlify production origin https://angel-ai-new.netlify.app.

## 1. Google Cloud OAuth client

Open [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) in the Google Cloud project whose OAuth Client ID is configured in Supabase.

The OAuth client must be of type **Web application**.

Under **Authorized JavaScript origins**, add:

    https://angel-ai-new.netlify.app

Under **Authorized redirect URIs**, add this exact URI:

    https://qltiogotxbxwzwmnypwu.supabase.co/auth/v1/callback

This is the expected callback for the configured Supabase project URL `https://qltiogotxbxwzwmnypwu.supabase.co`. If Netlify's server-side `SUPABASE_URL` is intentionally pointed at another Supabase project, use that project's callback instead and align it with the client-side `VITE_SUPABASE_URL`.

**Important:** the Authorized redirect URI for Google is the Supabase callback URL above, not the Netlify app URL and not /auth/callback. Google returns the provider response to Supabase first; Supabase then redirects the browser back to Angel.

Save the client.

## 2. Supabase Google provider

Open [Angel → Authentication → Sign In / Providers → Google](https://supabase.com/dashboard/project/qltiogotxbxwzwmnypwu/auth/providers?provider=Google).

- Enable Google.
- Verify that the **Client ID** matches the Google OAuth client you just edited.
- Enter its matching **Client Secret** in Supabase.
- Save the provider configuration.

Do not put the Google Client Secret in browser code, the repository, GitHub issues, or chat.

## 3. Supabase redirect allowlist

Open [Angel → Authentication → URL Configuration](https://supabase.com/dashboard/project/qltiogotxbxwzwmnypwu/auth/url-configuration).

Set **Site URL** to:

    https://angel-ai-new.netlify.app

Add this exact production callback to **Redirect URLs**:

    https://angel-ai-new.netlify.app/auth/callback

For other in-app return paths, the production-only wildcard may be used instead:

    https://angel-ai-new.netlify.app/**

## 4. Diagnose Error 400: redirect_uri_mismatch

That error is issued by Google before Supabase can complete sign-in. The app code alone cannot authorize a redirect URI in Google Cloud. In Google Auth Platform → Clients, open the **same Client ID shown in Supabase's Google provider settings** and make the Authorized redirect URIs match the exact Supabase callback above.

If the error persists after saving, open the Google error details and compare the exact redirect_uri shown there character for character with the configured value. Check for a different Google OAuth Client ID, a stale client secret/client pairing, a wrong Supabase project reference, or a missing callback URI. Do not guess a replacement URI.

If Google's consent screen is in Testing mode, also include the Google account as a test user.

## 5. Verification checklist

1. Open https://angel-ai-new.netlify.app in a normal browser tab, not only an embedded AI Studio preview. The client now refuses to guess a redirect URI when the server's canonical OAuth endpoint is unavailable inside an iframe.
2. Choose **Continue with Google** and select an account.
3. Confirm that Google returns to the exact production URL and Angel shows the signed-in profile.
4. Confirm that the identity appears in Supabase Authentication → Users.
5. Confirm a new chat request succeeds and then reload the page to check session persistence.

A successful build does not prove provider credentials or redirect allowlists are correct. End-to-end sign-in remains **unverified until a real browser test succeeds**.
