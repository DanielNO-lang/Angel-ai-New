import test from 'node:test';
import assert from 'node:assert/strict';
import { NvidiaNimProvider } from '../server/providers/nvidiaNimProvider';

test('NVIDIA NIM is unavailable when no server key is configured', () => {
  const oldKey = process.env.NVIDIA_NIM_API_KEY;
  const oldFallbackKey = process.env.NVIDIA_API_KEY;
  try {
    delete process.env.NVIDIA_NIM_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    const provider = new NvidiaNimProvider();
    assert.equal(provider.isConfigured(), false);
  } finally {
    if (oldKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
    else process.env.NVIDIA_NIM_API_KEY = oldKey;
    if (oldFallbackKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = oldFallbackKey;
  }
});

test('NVIDIA NIM accepts server-side key plus HTTPS endpoint configuration', () => {
  const oldKey = process.env.NVIDIA_NIM_API_KEY;
  const oldFallbackKey = process.env.NVIDIA_API_KEY;
  const oldBase = process.env.NVIDIA_NIM_BASE_URL;
  try {
    process.env.NVIDIA_NIM_API_KEY = 'test-only-nvidia-key';
    delete process.env.NVIDIA_API_KEY;
    process.env.NVIDIA_NIM_BASE_URL = 'https://example.invalid/v1';
    const provider = new NvidiaNimProvider();
    assert.equal(provider.isConfigured(), true);
    assert.equal(provider.id, 'nvidia-nim');
  } finally {
    if (oldKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
    else process.env.NVIDIA_NIM_API_KEY = oldKey;
    if (oldFallbackKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = oldFallbackKey;
    if (oldBase === undefined) delete process.env.NVIDIA_NIM_BASE_URL;
    else process.env.NVIDIA_NIM_BASE_URL = oldBase;
  }
});
