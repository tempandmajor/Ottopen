-- AI Editor Database Schema
-- Complete implementation for all phases

-- ============================================================================
-- PHASE 0: FOUNDATION - Core Document Management
-- ============================================================================

-- Manuscripts (Books/Projects)
CREATE TABLE manuscripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  genre TEXT, -- fiction, fantasy, sci-fi, romance, mystery, thriller, literary, etc.
  target_word_count INTEGER DEFAULT 80000,
  current_word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, revision, beta, submission, published
  structure_type TEXT DEFAULT 'three-act', -- three-act, heros-journey, save-the-cat, fichtean, custom
  premise TEXT, -- One-line story premise
  logline TEXT, -- Marketing logline
  synopsis TEXT, -- Full synopsis
  notes TEXT, -- General project notes
  cover_image_url TEXT,
  is_series BOOLEAN DEFAULT false,
  series_name TEXT,
  series_order INTEGER,

  -- Privacy
  visibility TEXT DEFAULT 'private', -- private, shared, public

  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Parts (Optional: Book I, Book II for larger works)
CREATE TABLE manuscript_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  part_id UUID REFERENCES manuscript_parts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT, -- AI-generated or manual chapter summary
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  target_word_count INTEGER,
  status TEXT DEFAULT 'draft', -- draft, complete, needs-revision
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes (Core writing unit)
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  summary TEXT, -- AI-generated scene summary
  order_index INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,

  -- Scene metadata
  pov_character_id UUID, -- References characters table
  location_id UUID, -- References locations table
  timeline_order INTEGER, -- Chronological order vs narrative order
  story_date DATE, -- When this scene happens in story timeline
  time_of_day TEXT, -- morning, afternoon, evening, night

  -- Scene purpose tracking
  purpose TEXT[], -- advance-plot, character-development, world-building, tension, exposition
  emotional_beat TEXT, -- happy, sad, tense, romantic, action, contemplative
  tension_level INTEGER CHECK (tension_level BETWEEN 1 AND 10),

  -- Status
  status TEXT DEFAULT 'draft', -- draft, complete, needs-revision, cut
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scene versions (auto-save and manual snapshots)
CREATE TABLE scene_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  version_number INTEGER NOT NULL,
  is_auto_save BOOLEAN DEFAULT true,
  label TEXT, -- "Before major edit", "Alpha draft", etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 1: STORY PLANNING & ORGANIZATION
-- ============================================================================

-- Characters (Story Bible)
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  full_name TEXT,
  nickname TEXT,
  role TEXT, -- protagonist, antagonist, supporting, minor
  importance_level INTEGER CHECK (importance_level BETWEEN 1 AND 5), -- 1=main, 5=minor

  -- Physical
  age INTEGER,
  gender TEXT,
  appearance TEXT, -- Physical description
  distinguishing_features TEXT,
  avatar_url TEXT, -- AI-generated character portrait

  -- Personality
  personality_summary TEXT,
  mbti_type TEXT,
  enneagram_type TEXT,
  traits TEXT[], -- brave, sarcastic, loyal, impulsive
  quirks TEXT[], -- Always drinks tea, hums when nervous
  speech_pattern TEXT, -- Formal, uses slang, stutters, etc.
  vocabulary_notes TEXT,

  -- Background
  occupation TEXT,
  education TEXT,
  birthplace TEXT,
  family_background TEXT,
  formative_events TEXT,

  -- Motivation & Arc
  internal_goal TEXT, -- What they want emotionally
  external_goal TEXT, -- What they want physically
  fear TEXT, -- Deepest fear
  lie_they_believe TEXT, -- Internal flaw
  truth_they_need TEXT, -- What they must learn
  character_arc TEXT, -- How they change

  -- Story presence
  first_appearance_scene_id UUID REFERENCES scenes(id),
  last_appearance_scene_id UUID,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character relationships
CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  character_a_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_b_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- family, romance, friendship, rivalry, mentor, enemy
  description TEXT,
  strength INTEGER CHECK (strength BETWEEN 1 AND 10), -- 1=weak connection, 10=strongest bond
  dynamic TEXT, -- How they interact
  arc TEXT, -- How relationship evolves
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_a_id, character_b_id)
);

-- Locations (Story Bible)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- city, building, room, landscape, planet, etc.
  parent_location_id UUID REFERENCES locations(id), -- e.g., "Kitchen" parent is "House"

  description TEXT,
  sensory_details TEXT, -- AI-enhanced descriptions
  significance TEXT, -- Why this location matters
  atmosphere TEXT, -- Mood/feeling of the place

  -- World-building
  history TEXT,
  culture_notes TEXT,
  climate TEXT,

  image_url TEXT, -- AI-generated location art
  map_data JSONB, -- Coordinates, connections

  first_appearance_scene_id UUID REFERENCES scenes(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plot threads/storylines
CREATE TABLE plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- main-plot, subplot, character-arc, theme
  status TEXT DEFAULT 'active', -- active, resolved, abandoned

  -- Thread tracking
  introduced_scene_id UUID REFERENCES scenes(id),
  resolved_scene_id UUID REFERENCES scenes(id),

  -- Related entities
  characters UUID[], -- Array of character IDs involved
  importance INTEGER CHECK (importance BETWEEN 1 AND 5),

  notes TEXT,
  color_code TEXT, -- For visual tracking (hex color)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plot points (Story beats)
CREATE TABLE plot_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  plot_thread_id UUID REFERENCES plot_threads(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  beat_type TEXT, -- inciting-incident, plot-point-1, midpoint, plot-point-2, climax, resolution
  act_number INTEGER CHECK (act_number BETWEEN 1 AND 5),

  scene_id UUID REFERENCES scenes(id), -- Where this beat occurs
  order_index INTEGER,
  is_completed BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story timeline (chronological events)
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE, -- In-story date
  event_order INTEGER, -- Chronological order
  narrative_order INTEGER, -- Order in manuscript (can differ for flashbacks)

  scene_id UUID REFERENCES scenes(id),
  characters UUID[], -- Who's involved
  location_id UUID REFERENCES locations(id),

  importance INTEGER CHECK (importance BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themes
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  examples TEXT[], -- Where this theme appears in story
  symbols TEXT[], -- Symbols representing this theme
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 1: RESEARCH & NOTES
-- ============================================================================

-- Research vault
CREATE TABLE research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  source_title TEXT,
  category TEXT, -- historical, scientific, cultural, reference
  tags TEXT[],

  -- Linked entities
  linked_scenes UUID[],
  linked_characters UUID[],
  linked_locations UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reference images
CREATE TABLE reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  source TEXT,
  category TEXT, -- character-reference, setting, mood-board, cover-ideas

  linked_character_id UUID REFERENCES characters(id),
  linked_location_id UUID REFERENCES locations(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 1: WRITING GOALS & ANALYTICS
-- ============================================================================

-- Writing goals
CREATE TABLE writing_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE, -- NULL = global goal

  goal_type TEXT NOT NULL, -- daily-words, weekly-words, monthly-words, completion-date
  target_value INTEGER NOT NULL, -- e.g., 1000 words
  current_value INTEGER DEFAULT 0,
  unit TEXT NOT NULL, -- words, scenes, chapters

  period TEXT, -- daily, weekly, monthly, one-time
  start_date DATE NOT NULL,
  end_date DATE,

  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Writing sessions (track productivity)
CREATE TABLE writing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated

  words_written INTEGER DEFAULT 0,
  starting_word_count INTEGER,
  ending_word_count INTEGER,

  -- Session quality
  focus_mode_used BOOLEAN DEFAULT false,
  ai_assists_used INTEGER DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily writing stats (aggregated)
CREATE TABLE daily_writing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  words_written INTEGER DEFAULT 0,
  scenes_completed INTEGER DEFAULT 0,
  writing_minutes INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,

  -- Streak tracking
  is_goal_met BOOLEAN DEFAULT false,
  current_streak INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- PHASE 2: AI INTERACTION & HISTORY
-- ============================================================================

-- AI suggestions/outputs (for undo/redo, learning)
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,

  feature_type TEXT NOT NULL, -- expand, rewrite, describe, brainstorm, critique, etc.
  prompt_text TEXT, -- User's prompt
  context_text TEXT, -- Text that was selected/highlighted

  -- AI response
  ai_model TEXT, -- gpt-4, claude-3.5-sonnet, etc.
  suggestions JSONB, -- Array of suggestions with metadata
  tokens_used INTEGER,

  -- User action
  action_taken TEXT, -- accepted, rejected, modified, ignored
  selected_suggestion_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI credits/usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  words_generated INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,

  -- Limits based on subscription
  word_limit INTEGER NOT NULL,
  image_limit INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- ============================================================================
-- PHASE 2: MANUSCRIPT CRITIQUE & ANALYSIS
-- ============================================================================

-- Critique reports
CREATE TABLE critique_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE, -- NULL = full manuscript
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,

  critique_type TEXT NOT NULL, -- pacing, dialogue, cliches, plot-holes, character-consistency

  -- Report data
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 100),
  issues_found JSONB, -- Array of issues with line numbers, suggestions
  strengths JSONB, -- What's working well
  recommendations TEXT,

  -- Processing
  ai_model TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),

  -- User feedback
  is_helpful BOOLEAN,
  user_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: COLLABORATION
-- ============================================================================

-- Beta readers / collaborators
CREATE TABLE manuscript_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For invites to non-users

  role TEXT NOT NULL, -- beta-reader, co-author, editor, viewer
  permissions JSONB DEFAULT '{"can_comment": true, "can_edit": false, "can_view": true}'::jsonb,

  invite_status TEXT DEFAULT 'pending', -- pending, accepted, declined
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments/feedback
CREATE TABLE scene_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  highlight_text TEXT, -- Text that was highlighted
  character_position INTEGER, -- Where in scene this comment refers to

  comment_type TEXT DEFAULT 'general', -- general, suggestion, praise, critique, question
  is_resolved BOOLEAN DEFAULT false,

  -- Threading
  parent_comment_id UUID REFERENCES scene_comments(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: WORLD-BUILDING (Fantasy/Sci-Fi)
-- ============================================================================

-- Magic systems
CREATE TABLE magic_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  source TEXT, -- Where magic comes from
  rules TEXT, -- How it works
  limitations TEXT, -- What it can't do
  cost TEXT, -- Price of using magic

  practitioners TEXT[], -- Who can use it
  visual_effects TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technology/inventions (Sci-fi)
CREATE TABLE technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- weapon, transport, communication, medical, etc.
  tech_level INTEGER CHECK (tech_level BETWEEN 1 AND 10),

  how_it_works TEXT,
  limitations TEXT,
  availability TEXT, -- Common, rare, military-only, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factions/organizations
CREATE TABLE factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT, -- government, guild, military, religion, criminal, corporate
  description TEXT,

  leadership TEXT,
  goals TEXT,
  values TEXT,
  structure TEXT,

  power_level INTEGER CHECK (power_level BETWEEN 1 AND 10),
  territory TEXT,

  allies UUID[], -- Other faction IDs
  enemies UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cultures
CREATE TABLE cultures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  customs TEXT,
  traditions TEXT,
  religion TEXT,
  government_type TEXT,
  economy TEXT,

  language_notes TEXT,
  naming_conventions TEXT,

  clothing_style TEXT,
  cuisine TEXT,
  arts_and_entertainment TEXT,

  taboos TEXT,
  values TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 4: PUBLISHING WORKFLOW
-- ============================================================================

-- Query letters
CREATE TABLE query_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  version_number INTEGER DEFAULT 1,

  hook_paragraph TEXT,
  synopsis TEXT,
  bio TEXT,
  comp_titles TEXT, -- Comparable titles

  recipient_name TEXT,
  agency_name TEXT,
  personalization TEXT,

  full_text TEXT, -- Complete assembled query letter

  -- Tracking
  status TEXT DEFAULT 'draft', -- draft, sent, response-received
  sent_date DATE,
  response_date DATE,
  response_type TEXT, -- request, rejection, no-response

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission tracking
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  agent_name TEXT,
  agency_name TEXT,
  submission_type TEXT, -- query, partial, full-manuscript

  submitted_date DATE NOT NULL,
  response_deadline DATE,
  response_received_date DATE,

  status TEXT DEFAULT 'pending', -- pending, request, rejection, offer, no-response
  response_notes TEXT,

  materials_sent TEXT[], -- query, synopsis, first-50-pages, full-manuscript

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ISBN tracking (for self-publishing)
CREATE TABLE isbns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,

  isbn_13 TEXT UNIQUE NOT NULL,
  isbn_10 TEXT,
  edition_type TEXT, -- ebook, paperback, hardcover, audiobook

  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  assigned_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_manuscripts_user_id ON manuscripts(user_id);
CREATE INDEX idx_chapters_manuscript_id ON chapters(manuscript_id);
CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX idx_scenes_pov_character ON scenes(pov_character_id);
CREATE INDEX idx_scene_versions_scene_id ON scene_versions(scene_id);

CREATE INDEX idx_characters_manuscript_id ON characters(manuscript_id);
CREATE INDEX idx_locations_manuscript_id ON locations(manuscript_id);
CREATE INDEX idx_plot_threads_manuscript_id ON plot_threads(manuscript_id);
CREATE INDEX idx_plot_points_manuscript_id ON plot_points(manuscript_id);

CREATE INDEX idx_research_notes_manuscript_id ON research_notes(manuscript_id);
CREATE INDEX idx_writing_sessions_user_id ON writing_sessions(user_id);
CREATE INDEX idx_daily_stats_user_date ON daily_writing_stats(user_id, date);

CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_usage_user_period ON ai_usage(user_id, period_start);

CREATE INDEX idx_scene_comments_scene_id ON scene_comments(scene_id);
CREATE INDEX idx_collaborators_manuscript_id ON manuscript_collaborators(manuscript_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscript_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_writing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE critique_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscript_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE isbns ENABLE ROW LEVEL SECURITY;

-- Manuscripts: Users can see their own + shared manuscripts
CREATE POLICY manuscripts_select ON manuscripts
  FOR SELECT USING (
    user_id = auth.uid() OR
    visibility = 'public' OR
    id IN (
      SELECT manuscript_id FROM manuscript_collaborators
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY manuscripts_insert ON manuscripts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY manuscripts_update ON manuscripts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY manuscripts_delete ON manuscripts
  FOR DELETE USING (user_id = auth.uid());

-- Chapters, scenes, and related: Access through manuscript ownership
CREATE POLICY chapters_access ON chapters
  FOR ALL USING (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE user_id = auth.uid() OR
      id IN (SELECT manuscript_id FROM manuscript_collaborators WHERE user_id = auth.uid() AND invite_status = 'accepted')
    )
  );

CREATE POLICY scenes_access ON scenes
  FOR ALL USING (
    chapter_id IN (
      SELECT id FROM chapters WHERE manuscript_id IN (
        SELECT id FROM manuscripts WHERE user_id = auth.uid()
      )
    )
  );

-- Writing sessions and stats: User-specific
CREATE POLICY writing_sessions_access ON writing_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY daily_stats_access ON daily_writing_stats
  FOR ALL USING (user_id = auth.uid());

-- AI usage: User-specific
CREATE POLICY ai_usage_access ON ai_usage
  FOR ALL USING (user_id = auth.uid());

-- Comments: Can see comments on manuscripts you have access to
CREATE POLICY scene_comments_select ON scene_comments
  FOR SELECT USING (
    scene_id IN (
      SELECT s.id FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      JOIN manuscripts m ON c.manuscript_id = m.id
      WHERE m.user_id = auth.uid() OR
      m.id IN (SELECT manuscript_id FROM manuscript_collaborators WHERE user_id = auth.uid() AND invite_status = 'accepted')
    )
  );

CREATE POLICY scene_comments_insert ON scene_comments
  FOR INSERT WITH CHECK (
    scene_id IN (
      SELECT s.id FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      JOIN manuscripts m ON c.manuscript_id = m.id
      WHERE m.id IN (SELECT manuscript_id FROM manuscript_collaborators WHERE user_id = auth.uid() AND invite_status = 'accepted')
    ) AND user_id = auth.uid()
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update manuscript word count when scenes change
CREATE OR REPLACE FUNCTION update_manuscript_word_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE manuscripts m
  SET
    current_word_count = (
      SELECT COALESCE(SUM(s.word_count), 0)
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.manuscript_id = m.id
    ),
    updated_at = NOW()
  WHERE m.id = (
    SELECT c.manuscript_id FROM chapters c WHERE c.id = NEW.chapter_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manuscript_word_count
AFTER INSERT OR UPDATE OF word_count ON scenes
FOR EACH ROW
EXECUTE FUNCTION update_manuscript_word_count();

-- Update chapter word count when scenes change
CREATE OR REPLACE FUNCTION update_chapter_word_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chapters c
  SET
    word_count = (
      SELECT COALESCE(SUM(word_count), 0)
      FROM scenes
      WHERE chapter_id = c.id
    ),
    updated_at = NOW()
  WHERE c.id = NEW.chapter_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chapter_word_count
AFTER INSERT OR UPDATE OF word_count ON scenes
FOR EACH ROW
EXECUTE FUNCTION update_chapter_word_count();

-- Auto-save scene versions
CREATE OR REPLACE FUNCTION auto_save_scene_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO scene_versions (scene_id, content, word_count, version_number, is_auto_save)
    VALUES (
      NEW.id,
      OLD.content,
      OLD.word_count,
      COALESCE((SELECT MAX(version_number) FROM scene_versions WHERE scene_id = NEW.id), 0) + 1,
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_save_scene_version
AFTER UPDATE OF content ON scenes
FOR EACH ROW
EXECUTE FUNCTION auto_save_scene_version();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manuscripts_updated_at BEFORE UPDATE ON manuscripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA (Optional structure templates)
-- ============================================================================

-- Story structure templates (to be inserted by application)
CREATE TABLE story_structure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  act_count INTEGER NOT NULL,
  beats JSONB NOT NULL, -- Array of beat definitions with percentages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard templates
INSERT INTO story_structure_templates (name, description, act_count, beats) VALUES
('Three-Act Structure', 'Classic screenplay structure', 3, '[
  {"name": "Inciting Incident", "act": 1, "percentage": 10, "description": "Event that starts the story"},
  {"name": "Plot Point 1", "act": 1, "percentage": 25, "description": "End of Act 1, point of no return"},
  {"name": "Midpoint", "act": 2, "percentage": 50, "description": "Major revelation or reversal"},
  {"name": "Plot Point 2", "act": 2, "percentage": 75, "description": "Lowest point, all seems lost"},
  {"name": "Climax", "act": 3, "percentage": 90, "description": "Final confrontation"},
  {"name": "Resolution", "act": 3, "percentage": 100, "description": "Wrap up loose ends"}
]'::jsonb),
('Hero''s Journey', 'Joseph Campbell''s monomyth', 3, '[
  {"name": "Ordinary World", "act": 1, "percentage": 5, "description": "Hero in normal life"},
  {"name": "Call to Adventure", "act": 1, "percentage": 10, "description": "Challenge presented"},
  {"name": "Refusal of Call", "act": 1, "percentage": 15, "description": "Hero hesitates"},
  {"name": "Meeting the Mentor", "act": 1, "percentage": 20, "description": "Guidance received"},
  {"name": "Crossing Threshold", "act": 1, "percentage": 25, "description": "Entering new world"},
  {"name": "Tests, Allies, Enemies", "act": 2, "percentage": 40, "description": "Learning the rules"},
  {"name": "Approach", "act": 2, "percentage": 50, "description": "Preparing for ordeal"},
  {"name": "Ordeal", "act": 2, "percentage": 60, "description": "Greatest challenge"},
  {"name": "Reward", "act": 2, "percentage": 70, "description": "Achieving goal"},
  {"name": "The Road Back", "act": 3, "percentage": 80, "description": "Return journey begins"},
  {"name": "Resurrection", "act": 3, "percentage": 90, "description": "Final test"},
  {"name": "Return with Elixir", "act": 3, "percentage": 100, "description": "Hero transformed"}
]'::jsonb);

COMMENT ON TABLE manuscripts IS 'Core manuscript/book projects';
COMMENT ON TABLE scenes IS 'Individual scenes - the atomic writing unit';
COMMENT ON TABLE characters IS 'Story Bible character database';
COMMENT ON TABLE writing_sessions IS 'Track writing productivity and habits';
COMMENT ON TABLE ai_suggestions IS 'Log all AI interactions for learning and undo';
