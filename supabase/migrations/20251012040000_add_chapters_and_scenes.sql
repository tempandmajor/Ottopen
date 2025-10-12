-- Migration: Add chapters and scenes tables for manuscript navigation
-- This enables hierarchical navigation in the AI Editor

-- Chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manuscript_id UUID NOT NULL REFERENCES public.manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_chapter_order UNIQUE (manuscript_id, order_index)
);

-- Scenes table
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  manuscript_id UUID NOT NULL REFERENCES public.manuscripts(id) ON DELETE CASCADE,
  title TEXT,
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  content TEXT,
  pov_character TEXT,
  location TEXT,
  time_of_day TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_scene_order UNIQUE (chapter_id, order_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_manuscript_id ON public.chapters(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON public.chapters(manuscript_id, order_index);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON public.scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_manuscript_id ON public.scenes(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON public.scenes(chapter_id, order_index);

-- RLS Policies for chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manuscript chapters" ON public.chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = chapters.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters to own manuscripts" ON public.chapters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = chapters.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own manuscript chapters" ON public.chapters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = chapters.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own manuscript chapters" ON public.chapters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = chapters.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

-- RLS Policies for scenes
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manuscript scenes" ON public.scenes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = scenes.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scenes to own manuscripts" ON public.scenes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = scenes.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own manuscript scenes" ON public.scenes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = scenes.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own manuscript scenes" ON public.scenes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.manuscripts
      WHERE manuscripts.id = scenes.manuscript_id
        AND manuscripts.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_chapters_updated_at();

CREATE OR REPLACE FUNCTION update_scenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scenes_updated_at
  BEFORE UPDATE ON public.scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_scenes_updated_at();
