-- pgvector setup
CREATE EXTENSION IF NOT EXISTS vector;

-- ivfflat index creation for content_items embedding
CREATE INDEX IF NOT EXISTS content_items_embedding_idx
ON content_items
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE content_items;
