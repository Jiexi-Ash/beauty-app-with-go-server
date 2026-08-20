-- name: CheckSalonFavorite :one
SELECT EXISTS(SELECT 1 FROM salon_favorites WHERE user_id = $1 AND salon_id = $2);

-- name: AddSalonFavorite :exec
INSERT INTO salon_favorites (user_id, salon_id) VALUES ($1, $2);

-- name: RemoveSalonFavorite :exec
DELETE FROM salon_favorites WHERE user_id = $1 AND salon_id = $2;

-- name: GetUserFavorites :many
SELECT s.id, s.name, s.slug, s.city, s.cover_image_url
FROM salons s
INNER JOIN salon_favorites sf ON sf.salon_id = s.id
WHERE sf.user_id = $1;