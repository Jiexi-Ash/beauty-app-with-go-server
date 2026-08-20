-- +goose Up
ALTER TABLE users ADD COLUMN name TEXT;
ALTER TABLE users ADD COLUMN surname TEXT;

-- +goose Down
ALTER TABLE users DROP COLUMN name;
ALTER TABLE users DROP COLUMN surname;