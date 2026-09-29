-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT,
  url TEXT NOT NULL,
  type TEXT,
  capture_date TIMESTAMP WITH TIME ZONE,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  description TEXT,
  objects JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  scene TEXT,
  visible_condition TEXT,
  confidence NUMERIC(4, 3),
  source TEXT DEFAULT 'gemini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration: ensure source column exists on existing ai_analysis tables
ALTER TABLE ai_analysis ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'gemini';

-- ============================================================================
-- Phase 4: Semantic Image Search (pgvector)
-- ============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-embedding-2',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_asset_model UNIQUE (asset_id, model)
);

-- Index on asset_id for fast relational lookups
CREATE INDEX IF NOT EXISTS embeddings_asset_id_idx ON embeddings(asset_id);

-- HNSW Vector Index for sub-millisecond cosine similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_hnsw_idx 
ON embeddings USING hnsw (embedding vector_cosine_ops);

-- 3. Stored RPC function for secure project-scoped semantic vector search
CREATE OR REPLACE FUNCTION match_assets(
  query_embedding vector(1536),
  filter_project_id UUID,
  match_threshold DOUBLE PRECISION DEFAULT 0.25,
  match_count INT DEFAULT 10,
  filter_media_type TEXT DEFAULT NULL,
  filter_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  filter_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  asset_id UUID,
  url TEXT,
  type TEXT,
  capture_date TIMESTAMP WITH TIME ZONE,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  project_id UUID,
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS asset_id,
    a.url,
    a.type,
    a.capture_date,
    a.latitude,
    a.longitude,
    a.project_id,
    ROUND((1 - (e.embedding <=> query_embedding))::numeric, 4)::double precision AS similarity
  FROM embeddings e
  JOIN assets a ON e.asset_id = a.id
  WHERE a.project_id = filter_project_id
    AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    AND (filter_media_type IS NULL OR a.type = filter_media_type)
    AND (filter_start_date IS NULL OR a.capture_date >= filter_start_date)
    AND (filter_end_date IS NULL OR a.capture_date <= filter_end_date)
  ORDER BY e.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

