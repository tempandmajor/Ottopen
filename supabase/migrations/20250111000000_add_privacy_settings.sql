-- Add Privacy Settings to Users Table
-- Migration: 20250111000000_add_privacy_settings.sql
-- Description: Adds comprehensive privacy controls for user profiles

-- Add privacy columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public'
    CHECK (profile_visibility IN ('public', 'followers_only', 'private')),
  ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_messages_from TEXT DEFAULT 'everyone'
    CHECK (allow_messages_from IN ('everyone', 'followers', 'none')),
  ADD COLUMN IF NOT EXISTS hide_location BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_email BOOLEAN DEFAULT TRUE;

-- Add index for performance on privacy queries
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_users_show_in_directory ON users(show_in_directory) WHERE show_in_directory = true;

-- Add comment to document privacy settings
COMMENT ON COLUMN users.profile_visibility IS 'Controls who can view the user profile: public (anyone), followers_only (only followers), private (only the user)';
COMMENT ON COLUMN users.show_in_directory IS 'Whether the user wants to appear in public directories and recommendations';
COMMENT ON COLUMN users.allow_messages_from IS 'Who can send messages to this user: everyone, followers, or none';
COMMENT ON COLUMN users.hide_location IS 'Whether to hide location from profile';
COMMENT ON COLUMN users.hide_email IS 'Whether to hide email from profile (default true for privacy)';

-- Update RLS policies to respect privacy settings
-- Note: Existing RLS policies may need to be updated to check privacy settings

-- Function to check if a user can view another user's profile
CREATE OR REPLACE FUNCTION can_view_profile(viewer_id UUID, profile_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_vis TEXT;
  is_following BOOLEAN;
BEGIN
  -- User can always view their own profile
  IF viewer_id = profile_user_id THEN
    RETURN TRUE;
  END IF;

  -- Get profile visibility setting
  SELECT profile_visibility INTO profile_vis
  FROM users
  WHERE id = profile_user_id;

  -- Public profiles are visible to everyone
  IF profile_vis = 'public' THEN
    RETURN TRUE;
  END IF;

  -- Private profiles only visible to owner
  IF profile_vis = 'private' THEN
    RETURN FALSE;
  END IF;

  -- Followers_only profiles require following relationship
  IF profile_vis = 'followers_only' THEN
    -- Check if viewer is following the profile user
    SELECT EXISTS(
      SELECT 1 FROM follows
      WHERE follower_id = viewer_id
        AND following_id = profile_user_id
    ) INTO is_following;

    RETURN is_following;
  END IF;

  -- Default to not visible
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION can_view_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_profile(UUID, UUID) TO anon;

-- Add a helper function to get filtered user data based on privacy settings
CREATE OR REPLACE FUNCTION get_user_public_data(user_id UUID, viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT,
  location TEXT,
  created_at TIMESTAMPTZ,
  profile_visibility TEXT
) AS $$
BEGIN
  -- Check if viewer can see this profile
  IF NOT can_view_profile(COALESCE(viewer_id, '00000000-0000-0000-0000-000000000000'::UUID), user_id) THEN
    RETURN;
  END IF;

  -- Return user data with privacy filters applied
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.specialty,
    CASE
      WHEN u.hide_location THEN NULL
      ELSE u.location
    END as location,
    u.created_at,
    u.profile_visibility
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_public_data(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_public_data(UUID, UUID) TO anon;

-- Migration complete
-- Note: Existing users will default to:
-- - profile_visibility: 'public' (maintaining current behavior)
-- - show_in_directory: FALSE (opt-in for directory)
-- - allow_messages_from: 'everyone'
-- - hide_location: FALSE
-- - hide_email: TRUE
