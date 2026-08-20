-- +goose Up
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    city TEXT,
    phone TEXT,
    description TEXT,
    cover_image_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',

    status TEXT NOT NULL DEFAULT 'draft',
    -- profile completeness, set by the app based on required fields

    visibility TEXT NOT NULL DEFAULT 'visible',
    -- owner-controlled: 'visible' or 'hidden'
    -- e.g. owner temporarily hides while on holiday

    platform_status TEXT NOT NULL DEFAULT 'online',
    -- moderation control: 'offline', 'online', 'suspended'
    -- 'suspended' should always override owner's visibility

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT salons_status_check CHECK (status IN ('draft', 'published')),
    CONSTRAINT salons_visibility_check CHECK (visibility IN ('visible', 'hidden')),
    CONSTRAINT salons_platform_status_check CHECK (platform_status IN ('offline', 'online', 'suspended')),

    CONSTRAINT salons_published_requires_details CHECK (
        status != 'published'
        OR (
            location IS NOT NULL
            AND city IS NOT NULL
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        )
    )
);

CREATE INDEX idx_salons_owner_id ON salons(owner_id);
CREATE INDEX idx_salons_status ON salons(status);

-- +goose Down
DROP TABLE salons;