-- Add onboarding_completed column to users table
-- This tracks whether a user has completed the initial onboarding tutorial

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
ON users(onboarding_completed);

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS
'Tracks whether the user has completed the initial onboarding tutorial. False by default for new users.';
