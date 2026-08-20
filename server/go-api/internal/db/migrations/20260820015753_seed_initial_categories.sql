-- +goose Up
INSERT INTO categories (name) VALUES
    ('Hair'),
    ('Nails'),
    ('Braids'),
    ('Barbering'),
    ('Skincare'),
    ('Makeup'),
    ('Massage'),
    ('Waxing'),
    ('Lashes & Brows'),
    ('Spa Treatments')
ON CONFLICT (name) DO NOTHING;

-- +goose Down
DELETE FROM categories WHERE name IN ('Hair', 'Nails', 'Braids', 'Barbering', 'Skincare', 'Makeup', 'Massage', 'Waxing', 'Lashes & Brows', 'Spa Treatments');
