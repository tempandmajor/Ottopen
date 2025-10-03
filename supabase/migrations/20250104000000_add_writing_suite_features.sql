-- Phase 6 Writing Suite Features
-- Add documentary and non-fiction book support

-- ============================================================================
-- UPDATE SCRIPTS TABLE - Add new script types
-- ============================================================================

-- Add new script types to existing CHECK constraint
ALTER TABLE scripts DROP CONSTRAINT IF EXISTS scripts_script_type_check;
ALTER TABLE scripts ADD CONSTRAINT scripts_script_type_check
  CHECK (script_type IN ('screenplay', 'tv_pilot', 'stage_play', 'radio_drama', 'documentary', 'nonfiction_book'));

-- ============================================================================
-- UPDATE SCRIPT ELEMENTS - Add new element types
-- ============================================================================

-- Add new element types for documentaries and books
ALTER TABLE script_elements DROP CONSTRAINT IF EXISTS script_elements_element_type_check;
ALTER TABLE script_elements ADD CONSTRAINT script_elements_element_type_check
  CHECK (element_type IN (
    -- Screenplay elements
    'scene_heading',
    'action',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'dual_dialogue',
    'stage_direction',
    'music_cue',
    'sound_effect',
    -- Documentary elements (Phase 6A)
    'narration',
    'interview_question',
    'interview_answer',
    'b_roll',
    'archive_footage',
    'lower_third',
    'act_break',
    -- Non-fiction book elements (Phase 6B)
    'chapter_title',
    'chapter_subtitle',
    'paragraph',
    'heading_1',
    'heading_2',
    'heading_3',
    'block_quote',
    'bullet_list',
    'numbered_list',
    'footnote',
    'citation'
  ));

-- ============================================================================
-- RESEARCH NOTES (Shared research repository - Phase 6C)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  source_type VARCHAR(50) CHECK (source_type IN ('book', 'article', 'website', 'interview', 'video', 'other')),
  source_author VARCHAR(255),
  source_title VARCHAR(500),
  source_publication_date DATE,
  source_publisher VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_research_notes_user_id ON research_notes(user_id);
CREATE INDEX idx_research_notes_tags ON research_notes USING GIN(tags);
CREATE INDEX idx_research_notes_created_at ON research_notes(created_at DESC);

-- ============================================================================
-- RESEARCH LINKS (Link notes to multiple scripts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES research_notes(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id UUID REFERENCES script_elements(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, script_id)
);

CREATE INDEX idx_research_links_note_id ON research_links(note_id);
CREATE INDEX idx_research_links_script_id ON research_links(script_id);
CREATE INDEX idx_research_links_element_id ON research_links(element_id);

-- ============================================================================
-- BOOK CHAPTERS (Non-fiction book organization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS book_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  subtitle TEXT,
  chapter_number INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_front_matter BOOLEAN DEFAULT false,
  is_back_matter BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_book_chapters_book_id ON book_chapters(book_id);
CREATE INDEX idx_book_chapters_order ON book_chapters(book_id, order_index);

-- ============================================================================
-- CITATIONS (Bibliography management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  citation_key VARCHAR(100) NOT NULL, -- e.g., "Smith2023"
  citation_type VARCHAR(50) NOT NULL CHECK (citation_type IN ('book', 'article', 'website', 'interview', 'other')),
  authors TEXT[] NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  publisher VARCHAR(255),
  url TEXT,
  page_numbers VARCHAR(50),
  doi VARCHAR(100),
  isbn VARCHAR(20),
  notes TEXT,
  citation_style VARCHAR(20) DEFAULT 'apa' CHECK (citation_style IN ('apa', 'mla', 'chicago')),
  formatted_citation TEXT, -- Pre-formatted for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, citation_key)
);

CREATE INDEX idx_citations_book_id ON citations(book_id);
CREATE INDEX idx_citations_key ON citations(book_id, citation_key);

-- ============================================================================
-- FOOTNOTES (Book footnotes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS footnotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES script_elements(id) ON DELETE CASCADE,
  footnote_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_footnotes_book_id ON footnotes(book_id);
CREATE INDEX idx_footnotes_element_id ON footnotes(element_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update research notes timestamp
CREATE OR REPLACE FUNCTION update_research_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_research_notes_updated_at ON research_notes;
CREATE TRIGGER trigger_update_research_notes_updated_at
BEFORE UPDATE ON research_notes
FOR EACH ROW EXECUTE FUNCTION update_research_notes_updated_at();

-- Update book chapters timestamp
DROP TRIGGER IF EXISTS trigger_update_book_chapters_updated_at ON book_chapters;
CREATE TRIGGER trigger_update_book_chapters_updated_at
BEFORE UPDATE ON book_chapters
FOR EACH ROW EXECUTE FUNCTION update_research_notes_updated_at();

-- Update citations timestamp
DROP TRIGGER IF EXISTS trigger_update_citations_updated_at ON citations;
CREATE TRIGGER trigger_update_citations_updated_at
BEFORE UPDATE ON citations
FOR EACH ROW EXECUTE FUNCTION update_research_notes_updated_at();

-- Update book word count when elements change
CREATE OR REPLACE FUNCTION update_book_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE book_chapters
    SET word_count = (
      SELECT COALESCE(SUM(array_length(string_to_array(content, ' '), 1)), 0)
      FROM script_elements
      WHERE script_id = OLD.script_id
      AND element_type IN ('paragraph', 'block_quote')
    )
    WHERE book_id = OLD.script_id;
    RETURN OLD;
  ELSE
    UPDATE book_chapters
    SET word_count = (
      SELECT COALESCE(SUM(array_length(string_to_array(content, ' '), 1)), 0)
      FROM script_elements
      WHERE script_id = NEW.script_id
      AND element_type IN ('paragraph', 'block_quote')
    )
    WHERE book_id = NEW.script_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_book_word_count ON script_elements;
CREATE TRIGGER trigger_update_book_word_count
AFTER INSERT OR UPDATE OR DELETE ON script_elements
FOR EACH ROW
WHEN (NEW.element_type IN ('paragraph', 'block_quote') OR OLD.element_type IN ('paragraph', 'block_quote'))
EXECUTE FUNCTION update_book_word_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE footnotes ENABLE ROW LEVEL SECURITY;

-- Research notes - users can only access their own
DROP POLICY IF EXISTS "Users can view own research notes" ON research_notes;
CREATE POLICY "Users can view own research notes" ON research_notes
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create research notes" ON research_notes;
CREATE POLICY "Users can create research notes" ON research_notes
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own research notes" ON research_notes;
CREATE POLICY "Users can update own research notes" ON research_notes
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own research notes" ON research_notes;
CREATE POLICY "Users can delete own research notes" ON research_notes
FOR DELETE USING (user_id = auth.uid());

-- Research links - users can link notes to their scripts
DROP POLICY IF EXISTS "Users can manage research links" ON research_links;
CREATE POLICY "Users can manage research links" ON research_links
FOR ALL USING (
  note_id IN (SELECT id FROM research_notes WHERE user_id = auth.uid()) AND
  script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid())
);

-- Book chapters - inherit script permissions
DROP POLICY IF EXISTS "Users can manage book chapters" ON book_chapters;
CREATE POLICY "Users can manage book chapters" ON book_chapters
FOR ALL USING (
  book_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true
  )
);

-- Citations - inherit script permissions
DROP POLICY IF EXISTS "Users can manage citations" ON citations;
CREATE POLICY "Users can manage citations" ON citations
FOR ALL USING (
  book_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true
  )
);

-- Footnotes - inherit script permissions
DROP POLICY IF EXISTS "Users can manage footnotes" ON footnotes;
CREATE POLICY "Users can manage footnotes" ON footnotes
FOR ALL USING (
  book_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
    UNION
    SELECT script_id FROM script_collaborators WHERE user_id = auth.uid() AND can_edit = true
  )
);
