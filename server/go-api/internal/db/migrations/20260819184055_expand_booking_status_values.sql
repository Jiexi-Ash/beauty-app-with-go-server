-- +goose Up
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled_by_user', 'cancelled_by_salon', 'cancelled_payment_failed')
);

-- +goose Down
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'confirmed', 'cancelled_by_user', 'cancelled_by_salon', 'cancelled_payment_failed')
);