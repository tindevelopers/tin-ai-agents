-- Quick fix: Just add the missing password column to existing users table
-- Run this if you already have a users table and just want to add the password column

-- Add password column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
    END IF;
END $$;

-- Update any existing users without passwords to have a default password
-- You should change these passwords after fixing the schema
UPDATE users SET password = '$2a$10$dummy.hash.for.existing.users' WHERE password IS NULL OR password = '';
