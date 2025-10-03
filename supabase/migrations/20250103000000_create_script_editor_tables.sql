-- Script Editor Tables
-- Industry-standard screenplay, TV, and stage play editor

-- ============================================================================
-- SCRIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  script_type VARCHAR(50) NOT NULL CHECK (script_type IN ('screenplay', 'tv_pilot', 'stage_play', 'radio_drama')),
  format_standard VARCHAR(50) DEFAULT 'us_industry' CHECK (format_standard IN ('us_industry', 'uk_bbc', 'european', 'stage')),
  logline TEXT,
  genre TEXT[] DEFAULT '{}',
  page_count INTEGER DEFAULT 0,
  estimated_runtime INTEGER, -- minutes
  revision_color VARCHAR(20) DEFAULT 'white' CHECK (revision_color IN ('white', 'blue', 'pink', 'yellow', 'green', 'goldenrod', 'buff', 'salmon', 'cherry')),
  revision_number INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false, -- production lock
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'in_production', 'produced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_scripts_script_type ON scripts(script_type);
CREATE INDEX idx_scripts_status ON scripts(status);

-- ============================================================================
-- SCRIPT ELEMENTS (Core content structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL CHECK (element_type IN (
    'scene_heading',     -- INT. COFFEE SHOP - DAY
    'action',            -- Descriptive text
    'character',         -- Character name
    'dialogue',          -- What they say
    'parenthetical',     -- (whispering)
    'transition',        -- CUT TO:
    'shot',              -- CLOSE ON
    'dual_dialogue',     -- Split-screen conversation
    'stage_direction',   -- For stage plays
    'music_cue',         -- For all types
    'sound_effect'       -- For all types
  )),
  content TEXT NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  scene_number VARCHAR(20),
  page_number DECIMAL(6,2),
  order_index INTEGER NOT NULL,
  revision_mark VARCHAR(20), -- Which revision this was changed in
  is_omitted BOOLEAN DEFAULT false,
  dual_dialogue_partner_id UUID REFERENCES script_elements(id) ON DELETE SET NULL, -- Link dual dialogue
  metadata JSONB, -- Extra data (e.g., {"time_of_day": "DAY", "location_type": "INT"})
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_script_elements_script_id ON script_elements(script_id);
CREATE INDEX idx_script_elements_order ON script_elements(script_id, order_index);
CREATE INDEX idx_script_elements_type ON script_elements(element_type);
CREATE INDEX idx_script_elements_character ON script_elements(character_id);

-- ============================================================================
-- SCRIPT BEATS (Story structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_beats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  beat_type VARCHAR(50) CHECK (beat_type IN (
    'opening_image',
    'theme_stated',
    'setup',
    'catalyst',
    'debate',
    'break_into_two',
    'b_story',
    'fun_and_games',
    'midpoint',
    'bad_guys_close_in',
    'all_is_lost',
    'dark_night_of_soul',
    'break_into_three',
    'finale',
    'final_image',
    'custom'
  )),
  page_reference INTEGER,
  color VARCHAR(20),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_script_beats_script_id ON script_beats(script_id);
CREATE INDEX idx_script_beats_order ON script_beats(script_id, order_index);

-- ============================================================================
-- SCRIPT CHARACTERS (Script-specific character data)
-- ============================================================================

-- Extends the existing characters table with script-specific fields
CREATE TABLE IF NOT EXISTS script_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_number INTEGER, -- For production (JOHN #1, JOHN #2)
  scene_count INTEGER DEFAULT 0,
  dialogue_count INTEGER DEFAULT 0,
  first_appearance_page INTEGER,
  last_appearance_page INTEGER,
  character_type VARCHAR(50) CHECK (character_type IN ('lead', 'supporting', 'minor', 'extra')),
  speaking_role BOOLEAN DEFAULT true,
  estimated_shoot_days INTEGER,
  UNIQUE(script_id, character_id)
);

CREATE INDEX idx_script_characters_script_id ON script_characters(script_id);
CREATE INDEX idx_script_characters_character_id ON script_characters(character_id);

-- ============================================================================
-- SCRIPT LOCATIONS (Script-specific location data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  location_type VARCHAR(10) CHECK (location_type IN ('INT', 'EXT', 'INT/EXT')),
  time_of_day VARCHAR(20)[] DEFAULT '{}', -- ['DAY', 'NIGHT', 'DAWN', 'DUSK']
  scene_count INTEGER DEFAULT 0,
  page_count DECIMAL(6,2) DEFAULT 0,
  estimated_shoot_days INTEGER,
  is_practical BOOLEAN DEFAULT true, -- vs. studio set
  notes TEXT,
  UNIQUE(script_id, location_id)
);

CREATE INDEX idx_script_locations_script_id ON script_locations(script_id);
CREATE INDEX idx_script_locations_location_id ON script_locations(location_id);

-- ============================================================================
-- SCRIPT SCENES
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  scene_number VARCHAR(20) NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  location_type VARCHAR(10) CHECK (location_type IN ('INT', 'EXT', 'INT/EXT')),
  time_of_day VARCHAR(20),
  description TEXT,
  page_start DECIMAL(6,2),
  page_end DECIMAL(6,2),
  page_count DECIMAL(6,2),
  estimated_screen_time INTEGER, -- seconds
  order_index INTEGER NOT NULL,
  is_omitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_script_scenes_script_id ON script_scenes(script_id);
CREATE INDEX idx_script_scenes_order ON script_scenes(script_id, order_index);

-- ============================================================================
-- SCRIPT NOTES (Comments and feedback)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id UUID REFERENCES script_elements(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES script_scenes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'dialogue', 'action', 'structure', 'character', 'pacing', 'budget', 'legal')),
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_script_notes_script_id ON script_notes(script_id);
CREATE INDEX idx_script_notes_element_id ON script_notes(element_id);
CREATE INDEX idx_script_notes_user_id ON script_notes(user_id);

-- ============================================================================
-- SCRIPT REVISIONS (Version control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  revision_color VARCHAR(20) NOT NULL,
  revision_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  page_count INTEGER,
  word_count INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_data JSONB, -- Full script content at this revision
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_script_revisions_script_id ON script_revisions(script_id);
CREATE INDEX idx_script_revisions_version ON script_revisions(script_id, version_number);

-- ============================================================================
-- SCRIPT COLLABORATION (Real-time editing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'writer' CHECK (role IN ('owner', 'writer', 'editor', 'reader')),
  can_edit BOOLEAN DEFAULT true,
  can_comment BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, user_id)
);

CREATE INDEX idx_script_collaborators_script_id ON script_collaborators(script_id);
CREATE INDEX idx_script_collaborators_user_id ON script_collaborators(user_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update script page count when elements change
CREATE OR REPLACE FUNCTION update_script_page_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scripts
  SET page_count = (
    SELECT COALESCE(MAX(page_number), 0)::INTEGER
    FROM script_elements
    WHERE script_id = NEW.script_id
  ),
  updated_at = NOW()
  WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_script_page_count ON script_elements;
CREATE TRIGGER trigger_update_script_page_count
AFTER INSERT OR UPDATE OR DELETE ON script_elements
FOR EACH ROW EXECUTE FUNCTION update_script_page_count();

-- Update character scene count
CREATE OR REPLACE FUNCTION update_character_scene_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE script_characters
    SET
      dialogue_count = (
        SELECT COUNT(*)
        FROM script_elements
        WHERE script_id = NEW.script_id
        AND character_id = NEW.character_id
        AND element_type = 'dialogue'
      ),
      scene_count = (
        SELECT COUNT(DISTINCT scene_number)
        FROM script_elements
        WHERE script_id = NEW.script_id
        AND character_id = NEW.character_id
      )
    WHERE script_id = NEW.script_id AND character_id = NEW.character_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_character_scene_count ON script_elements;
CREATE TRIGGER trigger_update_character_scene_count
AFTER INSERT OR UPDATE ON script_elements
FOR EACH ROW EXECUTE FUNCTION update_character_scene_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_script_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scripts_updated_at ON scripts;
CREATE TRIGGER trigger_update_scripts_updated_at
BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION update_script_updated_at();

DROP TRIGGER IF EXISTS trigger_update_script_elements_updated_at ON script_elements;
CREATE TRIGGER trigger_update_script_elements_updated_at
BEFORE UPDATE ON script_elements
FOR EACH ROW EXECUTE FUNCTION update_script_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can view their own scripts and scripts they collaborate on
DROP POLICY IF EXISTS "Users can view own scripts" ON scripts;
CREATE POLICY "Users can view own scripts" ON scripts
FOR SELECT USING (
  user_id = auth.uid() OR
  id IN (SELECT script_id FROM script_collaborators WHERE user_id = auth.uid())
);

-- Users can create scripts
DROP POLICY IF EXISTS "Users can create scripts" ON scripts;
CREATE POLICY "Users can create scripts" ON scripts
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own scripts
DROP POLICY IF EXISTS "Users can update own scripts" ON scripts;
CREATE POLICY "Users can update own scripts" ON scripts
FOR UPDATE USING (
  user_id = auth.uid() OR
  id IN (SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true)
);

-- Users can delete their own scripts
DROP POLICY IF EXISTS "Users can delete own scripts" ON scripts;
CREATE POLICY "Users can delete own scripts" ON scripts
FOR DELETE USING (user_id = auth.uid());

-- Script elements inherit script permissions
DROP POLICY IF EXISTS "Users can view script elements" ON script_elements;
CREATE POLICY "Users can view script elements" ON script_elements
FOR SELECT USING (
  script_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage script elements" ON script_elements;
CREATE POLICY "Users can manage script elements" ON script_elements
FOR ALL USING (
  script_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true
  )
);

-- Similar policies for other tables
DROP POLICY IF EXISTS "Users can manage script beats" ON script_beats;
CREATE POLICY "Users can manage script beats" ON script_beats
FOR ALL USING (
  script_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true
  )
);

DROP POLICY IF EXISTS "Users can manage script notes" ON script_notes;
CREATE POLICY "Users can manage script notes" ON script_notes
FOR ALL USING (
  script_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_comment = true
  )
);
