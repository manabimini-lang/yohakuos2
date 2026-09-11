import assert from 'node:assert/strict';
import test from 'node:test';
import { loadYuiHealth } from '../../lib/yui-health.ts';

test('failed status requests remain unknown instead of claiming unconfigured', async () => {
  const result = await loadYuiHealth((async () => new Response('', { status: 500 })) as typeof fetch);
  assert.equal(result.aiIntegration.status, 'unknown');
  assert.equal(result.googleCalendar.status, 'unknown');
  assert.equal(result.notifications.status, 'unknown');
});

test('invalid JSON in one endpoint does not prevent other status checks', async () => {
  const result = await loadYuiHealth((async (url: string) => {
    if (url === '/api/yui/health') return new Response('<html>error</html>');
    return Response.json(url === '/api/ai/status' ? { configured: true } : { enabled: false });
  }) as typeof fetch);
  assert.equal(result.googleCalendar.status, 'unknown');
  assert.equal(result.aiIntegration.status, 'connected');
  assert.equal(result.notifications.status, 'disconnected');
});

test('empty responses and network failures are not disconnected states', async () => {
  const empty = await loadYuiHealth((async () => Response.json({})) as typeof fetch);
  const offline = await loadYuiHealth((async () => { throw new Error('network'); }) as typeof fetch);
  for (const result of [empty, offline]) {
    assert.equal(result.googleCalendar.status, 'unknown');
    assert.equal(result.aiIntegration.status, 'unknown');
    assert.equal(result.notifications.status, 'unknown');
  }
});

test('confirmed disabled settings and Google maintenance keep distinct states', async () => {
  const result = await loadYuiHealth((async (url: string) => Response.json(
    url === '/api/yui/health' ? { google: { status: 'maintenance' } }
      : url === '/api/ai/status' ? { configured: false } : { enabled: true }
  )) as typeof fetch);
  assert.equal(result.googleCalendar.status, 'maintenance');
  assert.equal(result.aiIntegration.status, 'disconnected');
  assert.equal(result.notifications.status, 'connected');
});
