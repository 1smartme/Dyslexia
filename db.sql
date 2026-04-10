-- PostgreSQL Database Setup for Dyslexia Support Platform

-- USERS TABLE (replaces auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GAME RESULTS TABLE
CREATE TABLE IF NOT EXISTS game_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    game_name TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    score INTEGER NOT NULL,
    has_dyslexia BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public';


CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    name TEXT,
    age INT,
    grade INT,
    score INT,
    total INT,
    accuracy FLOAT,
    risk TEXT,
    fixation_mean_dur FLOAT,
    regressions_count INT,
    reading_speed_wpm FLOAT,
    timestamp TIMESTAMP
);

INSERT INTO results (
    session_id, name, age, grade, score, total,
    accuracy, risk, fixation_mean_dur,
    regressions_count, reading_speed_wpm, timestamp
)
VALUES (
    'test123', 'Payal', 21, 3, 4, 5,
    80.0, 'Medium', 200.5, 2, 120.0, NOW()
);

SELECT * FROM results;

-- ============================
-- NEW TABLE FOR REAL GAME DATA
-- ============================
CREATE TABLE IF NOT EXISTS dyslexia_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL CHECK (total > 0),
    accuracy DOUBLE PRECISION NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
    fixation_mean_dur DOUBLE PRECISION NOT NULL,
    regressions_count INTEGER NOT NULL CHECK (regressions_count >= 0),
    reading_speed_wpm DOUBLE PRECISION NOT NULL CHECK (reading_speed_wpm >= 0),
    risk TEXT,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dyslexia_user_id
    ON dyslexia_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_dyslexia_game_type
    ON dyslexia_sessions (game_type);
