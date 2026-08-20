-- +goose Up
CREATE TABLE salon_tags (
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (salon_id, tag_id)
);

CREATE INDEX idx_salon_tags_tag_id ON salon_tags(tag_id);

-- +goose Down
DROP TABLE salon_tags;
