CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    word_id UUID NOT NULL,
    collection_id UUID NOT NULL,
    practice_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    mastery_level TEXT DEFAULT 'new' CHECK (mastery_level IN ('new',
    'learning',
    'familiar',
    'mastered')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id,
    word_id)
);