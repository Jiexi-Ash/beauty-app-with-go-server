-- name: GetTags :many
SELECT * FROM tags
ORDER BY name;

-- name: GetTagsBySalonID :many
SELECT t.id, t.name
FROM tags t
INNER JOIN salon_tags st ON st.tag_id = t.id
WHERE st.salon_id = $1;