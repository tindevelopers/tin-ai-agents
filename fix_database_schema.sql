-- First, let's check if the users table exists and what columns it has
-- You can run this in your Supabase SQL Editor

-- 1. Drop existing tables if they exist (ONLY if you want to start fresh)
-- BE CAREFUL: This will delete all data!
-- DROP TABLE IF EXISTS blog_posts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS keyword_clusters CASCADE;
-- DROP TABLE IF EXISTS content_ideas CASCADE;

-- 2. Create users table with correct schema
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT 'user_' || generate_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY DEFAULT 'post_' || generate_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT NOT NULL, -- JSON string
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create keyword_clusters table  
CREATE TABLE IF NOT EXISTS keyword_clusters (
    id TEXT PRIMARY KEY DEFAULT 'cluster_' || generate_random_uuid(),
    name TEXT NOT NULL,
    keywords TEXT NOT NULL, -- JSON string
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create content_ideas table
CREATE TABLE IF NOT EXISTS content_ideas (
    id TEXT PRIMARY KEY DEFAULT 'idea_' || generate_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT NOT NULL, -- JSON string
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_keyword_clusters_updated_at ON keyword_clusters;
CREATE TRIGGER update_keyword_clusters_updated_at 
    BEFORE UPDATE ON keyword_clusters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
