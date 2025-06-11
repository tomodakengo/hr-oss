-- HR-OSS Database Initialization Script
-- This script is automatically executed when the database container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone to Japan Standard Time
SET timezone = 'Asia/Tokyo';

-- Create initial database user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'hr_user') THEN
        CREATE ROLE hr_user WITH LOGIN PASSWORD 'hr_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hr_oss TO hr_user;
GRANT ALL ON SCHEMA public TO hr_user;

-- Set default character encoding
ALTER DATABASE hr_oss SET client_encoding TO 'UTF8';
ALTER DATABASE hr_oss SET default_text_search_config TO 'pg_catalog.simple';

-- Log successful initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (1) ON CONFLICT DO NOTHING;