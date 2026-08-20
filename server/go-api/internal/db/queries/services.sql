-- name: CreateService :one
INSERT INTO services(salon_id, name,  slug, description, duration_minutes, price_cents, category_id, cover_image_url)
VALUES($1,$2,$3,$4,$5,$6, $7, $8)
RETURNING *;


-- name: GetServicesBySalonID :many

SELECT * from services
WHERE salon_id = $1
ORDER by created_at;

-- name: UpdateService :one
UPDATE services
SET
name = $1,
duration_minutes = $2,
price_cents = $3,
category_id = $4,
description = COALESCE($5, description),
cover_image_url = COALESCE($6, cover_image_url),
slug = $7,
updated_at = NOW()
WHERE id = $8 AND salon_id = $9
RETURNING *; 

-- name: GetServiceByID :one
SELECT * FROM services
WHERE id = $1;

-- name: GetActiveServices :many
SELECT s.id, sa.id AS salon_id, s.name, cat.name AS category_name, s.cover_image_url,s.description, s.duration_minutes, s.slug, s.price_cents, s.category_id from services AS s
INNER JOIN salons AS sa
ON s.salon_id = sa.id
INNER JOIN categories as cat
ON cat.id = s.category_id
WHERE s.is_active = true AND  sa.visibility = 'visible' AND sa.platform_status = 'online' and sa.status = 'published'
ORDER BY s.created_at;


-- name: GetServiceBySalonIDAndSlug :one
SELECT * FROM services
WHERE salon_id = $1 AND slug = $2 AND is_active = true;

-- name: ActivateService :one
UPDATE services
SET is_active = true, updated_at = NOW()
WHERE id = $1 AND salon_id = $2
RETURNING *;

-- name: DeactivateService :one
UPDATE services
SET is_active = false, updated_at = NOW()
WHERE id = $1 AND salon_id = $2
RETURNING *;