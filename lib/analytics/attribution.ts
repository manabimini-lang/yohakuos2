export const ARTICLE_COOKIE = 'yohaku_article_source';

export function validArticle(value: unknown): string | null {
  return typeof value === 'string' && value.length <= 160 && /^[\p{L}\p{N}_-]+$/u.test(value)
    ? value : null;
}

export function articleFromParams(params: URLSearchParams): string | null {
  if (params.get('utm_source') !== 'yohaku_media' || params.get('utm_medium') !== 'article') return null;
  return validArticle(params.get('utm_content'));
}
