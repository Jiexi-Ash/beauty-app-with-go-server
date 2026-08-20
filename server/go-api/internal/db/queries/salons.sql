-- name: CreateSalon :one

INSERT INTO salons(owner_id, name, location, city, phone, slug, description, cover_image_url)
VALUES($1, $2, $3, $4, $5,$6,$7, $8)
RETURNING *;

-- name: GetSalonByOwnerID :one
SELECT * FROM salons
WHERE owner_id = $1;

-- name: UpdateSalon :one

UPDATE salons
SET
name = $1,
location = $2,
city = COALESCE($3, city),
phone = COALESCE($4, phone),
description = COALESCE($5, description),
cover_image_url = COALESCE($6, cover_image_url),
latitude = COALESCE($7, latitude),
longitude = COALESCE($8, longitude),
updated_at = NOW()
WHERE owner_id = $9
RETURNING *;

-- name: CreateSalonSettings :exec
INSERT INTO salon_settings(salon_id)
VALUES($1);

-- name: GetSalonSettings :one

SELECT * from salon_settings
WHERE salon_id = $1;

-- name: GetSalonByID :one
SELECT
id,
name,
visibility,
status,
platform_status,
slug,
location,
city,
phone,
description,
cover_image_url,
latitude, longitude,
timezone
FROM salons
WHERE id = $1;

-- name: GetActiveSalons :many
SELECT id, name, slug, city, phone, cover_image_url
FROM salons
WHERE visibility = 'visible' AND platform_status = 'online' and status = 'published'
ORDER BY created_at;

-- name: GetSalonAndServicesBySlug :many
SELECT s.id, sa.id AS salon_id, s.name, cat.name AS category_name, s.cover_image_url, s.description, s.duration_minutes, s.slug, s.price_cents, s.category_id
FROM services AS s
INNER JOIN salons AS sa ON s.salon_id = sa.id
INNER JOIN categories AS cat ON cat.id = s.category_id
WHERE sa.slug = $1 AND s.is_active = true AND sa.visibility = 'visible' AND sa.platform_status = 'online' AND sa.status = 'published'
ORDER BY s.created_at;

-- name: GetSalonBySlug :one
SELECT * FROM salons WHERE slug = $1;

-- name: UpdateSalonSettings :exec
UPDATE salon_settings
SET
buffer_after_service_minutes = COALESCE($1, buffer_after_service_minutes),
max_concurrent_bookings = COALESCE($2, max_concurrent_bookings),
allow_booking_beyond_close_time = COALESCE($3, allow_booking_beyond_close_time),
updated_at = Now()
WHERE salon_id = $4;

-- name: UpdateSalonHours :exec
UPDATE salon_hours
SET
open_time = COALESCE($1, open_time),
close_time = COALESCE($2, close_time),
is_closed = COALESCE($3, is_closed),
updated_at = Now()
WHERE salon_id = $4 and day_of_week = $5;

-- name: AddSalonTag :exec
INSERT INTO salon_tags (salon_id, tag_id)
VALUES ($1, $2);


-- name: PublishSalon :one
UPDATE salons
SET status = 'published', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ToggleSalonVisibility :one
UPDATE salons
SET visibility = CASE WHEN visibility = 'visible' THEN 'hidden' ELSE 'visible' END,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

