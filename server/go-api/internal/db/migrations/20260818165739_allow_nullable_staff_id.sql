-- +goose Up
ALTER TABLE bookings ALTER COLUMN staff_id DROP NOT NULL;

-- +goose Down
ALTER TABLE bookings ALTER COLUMN staff_id SET NOT NULL;