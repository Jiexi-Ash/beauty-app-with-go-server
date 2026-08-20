-- +goose Up
CREATE TABLE services(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    duration_minutes INT NOT NULL,
    price_cents INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cover_image_url TEXT,

    CONSTRAINT service_active_requires_cover_image CHECK (
        is_active != true
        OR (
            cover_image_url IS NOT NULL
        )
    ),

    CONSTRAINT services_salon_id_slug_unique UNIQUE (salon_id, slug)
);

CREATE INDEX idx_services_salon_id ON services(salon_id);
CREATE INDEX idx_services_category_id ON services(category_id);

-- +goose Down
DROP TABLE services;