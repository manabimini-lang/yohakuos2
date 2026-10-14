import assert from 'node:assert/strict';
import test from 'node:test';
import { hasAcquisitionExportToken } from '../../lib/analytics/export-auth.ts';

const request = (authorization?: string) => new Request('https://yohakuos2.vercel.app/api/admin/acquisition/export', {
  headers: authorization ? { authorization } : {},
});

test('accepts only the exact acquisition export bearer token', () => {
  assert.equal(hasAcquisitionExportToken(request('Bearer report-secret'), 'report-secret'), true);
  assert.equal(hasAcquisitionExportToken(request('Bearer report-secrex'), 'report-secret'), false);
  assert.equal(hasAcquisitionExportToken(request('Basic report-secret'), 'report-secret'), false);
  assert.equal(hasAcquisitionExportToken(request(), 'report-secret'), false);
});

test('stays disabled when the server secret is missing', () => {
  assert.equal(hasAcquisitionExportToken(request('Bearer report-secret'), ''), false);
  assert.equal(hasAcquisitionExportToken(request('Bearer report-secret'), undefined), false);
});
