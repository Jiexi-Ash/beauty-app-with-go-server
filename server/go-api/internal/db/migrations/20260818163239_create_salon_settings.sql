-- +goose Up
CREATE TABLE salon_settings(
    salon_id UUID PRIMARY KEY REFERENCES salons(id) ON DELETE CASCADE,
    buffer_after_service_minutes INT NOT NULL DEFAULT 0,
    max_concurrent_bookings INT NOT NULL DEFAULT 2,
    allow_booking_beyond_close_time BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT salon_settings_max_concurrent_check CHECK (max_concurrent_bookings > 0),
     CONSTRAINT salon_settings_max_concurrent_check_two CHECK (max_concurrent_bookings <= 2)

);
-- +goose Down
DROP TABLE salon_settings;