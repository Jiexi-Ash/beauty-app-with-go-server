-- +goose Up
DROP INDEX idx_salons_owner_id;

ALTER TABLE salons
ADD CONSTRAINT salons_owner_id_unique UNIQUE (owner_id);



-- +goose Down
ALTER TABLE salons
DROP CONSTRAINT salons_owner_id_unique;

CREATE INDEX idx_salons_owner_id ON salons(owner_id);
