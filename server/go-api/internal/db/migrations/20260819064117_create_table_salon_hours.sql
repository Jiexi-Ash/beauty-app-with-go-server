-- +goose Up
CREATE TABLE salon_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT salon_hours_day_of_week_check CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT salon_hours_salon_id_day_unique UNIQUE (salon_id, day_of_week),
    CONSTRAINT salon_hours_open_before_close CHECK (
        is_closed = true OR open_time < close_time
    )
);

CREATE INDEX idx_salon_hours_salon_id ON salon_hours(salon_id);

-- +goose Down
DROP TABLE salon_hours;