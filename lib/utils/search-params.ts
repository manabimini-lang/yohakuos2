export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ParsedContentSearchParams = {
  q?: string;
  tag?: string;
  layer?: string;
  type?: string;
  visibility?: string;
  publishStatus?: string;
  page: number;
  limit: number;
};

function pickFirst(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) return fallback;
  return Math.floor(num);
}

export function parseSearchParams(
  searchParams: RawSearchParams,
  defaults?: { page?: number; limit?: number },
): ParsedContentSearchParams {
  const page = toPositiveInt(pickFirst(searchParams.page), defaults?.page ?? 1);
  const limit = toPositiveInt(pickFirst(searchParams.limit), defaults?.limit ?? 12);

  return {
    q: pickFirst(searchParams.q) ?? pickFirst(searchParams.search),
    tag: pickFirst(searchParams.tag),
    layer: pickFirst(searchParams.layer),
    type: pickFirst(searchParams.type) ?? pickFirst(searchParams.contentType),
    visibility: pickFirst(searchParams.visibility),
    publishStatus: pickFirst(searchParams.publishStatus),
    page,
    limit,
  };
}

export function buildSearchQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function getPagination(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  return {
    page,
    limit,
    total,
    totalPages,
    hasPrev,
    hasNext,
    prevPage: Math.max(1, page - 1),
    nextPage: Math.min(totalPages, page + 1),
  };
}
