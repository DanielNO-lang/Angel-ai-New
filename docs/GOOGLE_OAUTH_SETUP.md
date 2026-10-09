# Enable Google Sign-In for Angel AI

This guide applies to the Angel Supabase project `qltiogotxbxwzwmnypwu` and the production web app `https://angel-ai-new.vercel.app/`.

## What the application already does

- Uses the Supabase browser client with the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables.
- Starts OAuth with `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Redirects back to the production site root.
- Handles Supabase sign-in state and stores safe profile fields in `public.profiles` under the signed-in user's own-row RLS policy.

Supabase Auth creates the identity in `auth.users` when the Google OAuth flow succeeds. The app separately mirrors safe account details into `public.profiles`.

## Required provider configuration

Google's OAuth client credentials must be created in the owner's Google Cloud project. Do not put the Google Client Secret in frontend code, GitHub, chat, or Vercel client-side environment variables.

### 1. Create a Google OAuth client

Open the [Google Auth Platform Clients page](https://console.cloud.google.com/auth/clients) and create an OAuth client ID of type **Web application**.

Add this under **Authorized JavaScript origins**:

```text
https://angel-ai-new.vercel.app
```

Add this under **Authorized redirect URIs**:

```text
https://qltiogotxbxwzwmnypwu.supabase.co/auth/v1/callback
```

Save the generated **Client ID** and **Client Secret** privately.

### 2. Enable Google in Supabase Auth

Open the [Angel Google provider settings](https://supabase.com/dashboard/project/qltiogotxbxwzwmnypwu/auth/providers?provider=Google).

- Enable the Google provider.
- Paste the Google **Client ID** and **Client Secret** from step 1.
- Save.

### 3. Allow the application redirect

Open [Angel Auth URL Configuration](https://supabase.com/dashboard/project/qltiogotxbxwzwmnypwu/auth/url-configuration).

Set **Site URL** to:

```text
https://angel-ai-new.vercel.app
```

Add this to **Redirect URLs**:

```text
https://angel-ai-new.vercel.app/**
```

If Google Auth is left in **Testing** mode, add the intended testing accounts as test users on the Google consent-screen/audience configuration. For public launch, finish the relevant Google consent-screen setup.

## Verify

1. Open https://angel-ai-new.vercel.app and choose **Continue with Google**.
2. Complete the Google consent flow.
3. Confirm the browser returns to Angel and the account appears as signed in.
4. In Supabase, open **Authentication → Users** and confirm that the identity was created.
5. Check `public.profiles` for that user's UUID. The app attempts this insert/update with the active session; if its own-row RLS policy rejects it, sign-in remains active and the sync warning is logged to the browser console.

## Common failures

- **Provider disabled / unsupported provider:** enable Google in Supabase and save the client ID/secret.
- **redirect_uri_mismatch on Google:** ensure the authorized redirect URI is exactly the Supabase callback URL above.
- **redirect URL not allowed by Supabase:** add the deployed app URL to Auth URL Configuration.
- **App still shows an old result:** hard-refresh the browser and retry after saving the provider settings.
