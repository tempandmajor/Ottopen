-- Migration: Add Short Story Support
-- Created: 2025-01-15
-- Description: Adds comprehensive short story writing features with AI support

-- Add short_story_mode to manuscripts
ALTER TABLE ai_editor_manuscripts
ADD COLUMN IF NOT EXISTS short_story_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_word_count INTEGER,
ADD COLUMN IF NOT EXISTS target_page_count INTEGER,
ADD COLUMN IF NOT EXISTS story_genre VARCHAR(100),
ADD COLUMN IF NOT EXISTS story_theme TEXT,
ADD COLUMN IF NOT EXISTS structure_template VARCHAR(50);

-- Create short story templates table
CREATE TABLE IF NOT EXISTS ai_editor_short_story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  description TEXT,
  target_word_count INTEGER NOT NULL,
  target_page_count INTEGER NOT NULL,
  structure JSONB NOT NULL,
  writing_tips TEXT[],
  example_stories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create short story outlines table (AI-generated)
CREATE TABLE IF NOT EXISTS ai_editor_short_story_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES ai_editor_manuscripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genre VARCHAR(100),
  theme TEXT,
  target_word_count INTEGER,
  logline TEXT,
  title_suggestions TEXT[],
  characters JSONB,
  structure JSONB,
  thematic_elements TEXT[],
  writing_tips TEXT[],
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create short story progress tracking table
CREATE TABLE IF NOT EXISTS ai_editor_short_story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES ai_editor_manuscripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL,
  target_words INTEGER NOT NULL,
  current_words INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  ai_suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manuscript_id, section)
);

-- Insert default short story templates
INSERT INTO ai_editor_short_story_templates (name, genre, description, target_word_count, target_page_count, structure, writing_tips, example_stories) VALUES
(
  'Flash Fiction',
  'Any',
  'Ultra-short stories that pack a punch in under 1,000 words. Perfect for capturing a single moment or emotion.',
  1000,
  4,
  '{"opening": {"percentage": 15, "words": 150, "pages": 0.6, "focus": "Immediate hook - start in the middle of action"}, "development": {"percentage": 40, "words": 400, "pages": 1.6, "focus": "Build tension quickly, reveal character through action"}, "climax": {"percentage": 25, "words": 250, "pages": 1, "focus": "Sharp turning point or revelation"}, "resolution": {"percentage": 20, "words": 200, "pages": 0.8, "focus": "Impactful ending that resonates"}}'::jsonb,
  ARRAY['Every word must count - cut ruthlessly', 'Focus on a single moment or emotion', 'Start as close to the end as possible', 'Use strong imagery and sensory details', 'End with impact - twist, revelation, or emotional punch'],
  ARRAY['"For Sale: Baby Shoes, Never Worn" - Ernest Hemingway', '"The Last Question" - Isaac Asimov', '"Sticks" - George Saunders']
),
(
  'Short Short Story',
  'Literary',
  'Compact narratives between 1,000-3,000 words. Room for character development and a complete story arc.',
  2000,
  8,
  '{"opening": {"percentage": 15, "words": 300, "pages": 1.2, "focus": "Establish character and conflict quickly"}, "development": {"percentage": 35, "words": 700, "pages": 2.8, "focus": "Develop character and escalate conflict"}, "climax": {"percentage": 25, "words": 500, "pages": 2, "focus": "Peak moment of tension or decision"}, "resolution": {"percentage": 25, "words": 500, "pages": 2, "focus": "Satisfying conclusion with emotional impact"}}'::jsonb,
  ARRAY['Limit to 2-3 characters maximum', 'Single setting or time period works best', 'Focus on transformation or revelation', 'Strong opening and closing sentences', 'Every scene must advance the plot'],
  ARRAY['"Hills Like White Elephants" - Ernest Hemingway', '"A Very Old Man with Enormous Wings" - Gabriel García Márquez', '"The Lottery" - Shirley Jackson']
);

-- Enable RLS on new tables
ALTER TABLE ai_editor_short_story_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_editor_short_story_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_editor_short_story_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Templates are viewable by everyone" ON ai_editor_short_story_templates FOR SELECT USING (true);
CREATE POLICY "Users can view their own outlines" ON ai_editor_short_story_outlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own outlines" ON ai_editor_short_story_outlines FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_short_story_outlines_manuscript ON ai_editor_short_story_outlines(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_short_story_progress_manuscript ON ai_editor_short_story_progress(manuscript_id);
