import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function loadRoute(file: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: any = {};
  vm.runInNewContext(code, { exports, require(name: string) {
    if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, console: { log() {}, error() {}, warn() {} }, process: { env: {} }, Date });
  return exports;
}

test('first value excludes stub responses and failed writes; only accepted persisted creation counts', async () => {
  let count = 0;
  let fail = false;
  const route = loadRoute('../../app/api/yui/actions/execute/route.ts', {
    'next/server': { NextResponse: { json: (body: any, options?: any) => ({ body, status: options?.status || 200 }) } },
    '@/lib/supabase/admin': { getSupabaseAdmin: () => ({ from: () => ({ select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { status: 'pending', content: JSON.stringify({ type: 'create_goal', params: { title: 'example' } }) } }; } }) }) },
    '@/app/ui/backend/yui/api': { requireYuiSession: async () => ({ user: { id: 'test_user' } }) },
    '@/app/ui/backend/yui/action_execution_service': { executeAction: async () => ({ status: 'success', executed: true }) },
    '@/app/ui/backend/yui/service': { createYuiGoal: async () => { if (fail) throw new Error('write failed'); return { id: 'saved_goal' }; } },
    '@/app/ui/backend/yui/recommendation_service': { updateYuiRecommendationStatus: async () => {} },
    '@/lib/analytics/funnel-server': { recordFirstValue: async () => { count++; } },
  });
  await route.POST({ json: async () => ({ action: { actionType: 'create_goal' } }) });
  assert.equal(count, 0);
  fail = true;
  assert.equal((await route.POST({ json: async () => ({ recommendationId: 'test' }) })).status, 500);
  assert.equal(count, 0);
  fail = false;
  assert.equal((await route.POST({ json: async () => ({ recommendationId: 'test' }) })).status, 200);
  assert.equal(count, 1);
});

test('signature failure never reaches payment processing', async () => {
  let queries = 0;
  const route = loadRoute('../../app/api/stripe/webhook/route.ts', {
    'next/headers': { headers: () => ({ get: () => 'invalid' }) },
    'next/server': { NextResponse: class { status: number; constructor(_body: unknown, options: any) { this.status = options.status; } } },
    stripe: {}, '@/lib/stripe': { getStripe: () => ({ webhooks: { constructEvent() { throw new Error('bad signature'); } } }) },
    '@/lib/services/subscription.service': {}, '@/lib/repositories/subscription.repository': {},
    '@/lib/prisma': { prisma: { subscription: { findUnique: async () => { queries++; } } } },
    '@/lib/analytics/funnel-events': {}, '@/lib/analytics/funnel-server': {},
  });
  assert.equal((await route.POST({ text: async () => 'untrusted' })).status, 400);
  assert.equal(queries, 0);
});
