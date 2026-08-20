-- name: CreateUser :one

INSERT INTO users(email,password_hash)
VALUES($1,$2)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;


-- name: GetUserByID :one
SELECT id, email, name, surname, created_at, updated_at FROM users
WHERE id = $1;

-- name: UpdateUserProfile :one
UPDATE users
SET
name = COALESCE($1, name),
surname = COALESCE($2, surname),
updated_at = NOW()
WHERE id = $3
RETURNING id, email, name, surname, created_at, updated_at;


-- name: GetBookingsByCustomerID :many
SELECT * FROM bookings
WHERE customer_id = $1
ORDER BY start_time DESC;


-- name: GetCustomerBookingCounts :one
SELECT
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) AS upcoming,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status IN ('cancelled_by_user', 'cancelled_by_salon', 'cancelled_payment_failed')) AS cancelled
FROM bookings
WHERE customer_id = $1;
