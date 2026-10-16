# Tencent Hy-MT2 backend integration

Angel has a dedicated backend adapter for Tencent Hy-MT2's specialist multilingual translation models.

## Architecture

- Angel API: `POST /api/translation/translate`
- Configuration check: `GET /api/translation/status`
- Upstream request: OpenAI-compatible `POST <HYMT2_API_BASE_URL>/chat/completions`
- Default model ID: `tencent/Hy-MT2-1.8B`

Hy-MT2 weights must be served by a model-inference host. Netlify Functions host the Angel API adapter, not the 1.8B/7B/30B model weights. The adapter is compatible with OpenAI-style inference endpoints such as a properly configured vLLM or SGLang server. Use the endpoint's actual base URL and served model name.

## Netlify environment variables

Set these in **Netlify → angel-ai-new → Project configuration → Environment variables**. Scope them to **Functions** (and use Build scope if the variable is needed at build time).

| Variable | Required | Details |
| --- | --- | --- |
| `HYMT2_API_BASE_URL` | Yes | HTTPS base URL of the inference API, ending before `/chat/completions`, for example `https://inference.example.com/v1`. This is not the GitHub repository URL. |
| `HYMT2_API_KEY` | Depends on endpoint | Optional for private/self-hosted endpoints that require no token. Never expose as a `VITE_` variable. |
| `HYMT2_MODEL_ID` | No | Defaults to `tencent/Hy-MT2-1.8B`; override if the serving platform exposes another name (for example `hymt2`). |

For Hugging Face routing, `HYMT2_API_BASE_URL` can point to `https://router.huggingface.co/v1` and `HYMT2_API_KEY` can hold an authorized Hugging Face token, provided that the selected provider currently serves the requested Hy-MT2 model. A dedicated inference endpoint is also supported. The model's public repository alone does not provide an inference URL.

When changing environment variables, redeploy the Netlify project so the deployed Function receives the new runtime values.

## API example

```bash
curl -X POST "https://angel-ai-new.netlify.app/api/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "sourceLanguage": "English",
    "targetLanguage": "Chinese"
  }'
```

Successful response:

```json
{
  "success": true,
  "translation": "…",
  "provider": "hymt2",
  "model": "tencent/Hy-MT2-1.8B",
  "sourceLanguage": "English",
  "targetLanguage": "Chinese",
  "durationMs": 123
}
```

Optional `style` and `context` properties guide the translation. Use `sourceLanguage: "Auto-detect"` if the source language is not known.

## Security and operational behavior

- API tokens are sent only from Angel's server to the inference provider.
- HTTPS is required for remote inference endpoints; HTTP is allowed only for localhost development.
- Text is limited to 30,000 characters per request.
- The endpoint applies Angel's existing API rate limiter.
- The upstream call times out after 50 seconds; provider errors are normalized without echoing upstream response bodies.
- `GET /api/translation/status` never returns endpoint URLs or credentials.
- The adapter does not silently fall back to another AI provider. If Hy-MT2 is not configured, it returns a clear `503` response.

## References

- Tencent model repository: https://github.com/Tencent-Hunyuan/Hy-MT2
- Model deployment examples for Transformers, vLLM, SGLang, and llama.cpp are maintained in Tencent's README.
