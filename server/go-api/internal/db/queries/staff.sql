-- name: CreateStaff :one
INSERT INTO staff(salon_id, name, surname, email, phone)
VALUES($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetStaffBySalonID :many
SELECT * FROM staff
WHERE salon_id = $1
ORDER BY created_at;