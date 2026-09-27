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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

