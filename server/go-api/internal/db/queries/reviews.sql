-- name: CreateReview :one
INSERT INTO reviews (booking_id, salon_id, customer_id, rating, comment)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetReviewsBySalonID :many
SELECT * FROM reviews
WHERE salon_id = $1
ORDER BY created_at DESC;

-- name: GetReviewsByCustomerID :many
SELECT * FROM reviews
WHERE customer_id = $1
ORDER BY created_at DESC;