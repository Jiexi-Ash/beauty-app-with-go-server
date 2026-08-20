-- +goose Up
CREATE TABLE salon_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, salon_id)
);

CREATE INDEX idx_salon_favorites_user_id ON salon_favorites(user_id);

-- +goose Down
DROP TABLE salon_favorites;