import { timingSafeEqual } from 'node:crypto';

export function hasAcquisitionExportToken(request: Request, expectedValue = process.env.ACQUISITION_EXPORT_TOKEN): boolean {
  const expected = expectedValue?.trim();
  const authorization = request.headers.get('authorization') || '';
  if (!expected || !authorization.startsWith('Bearer ')) return false;
  const supplied = authorization.slice('Bearer '.length);
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}
