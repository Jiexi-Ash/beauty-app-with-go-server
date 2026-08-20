-- name: CreateBooking :one
INSERT INTO bookings(salon_id, service_id, staff_id, customer_id, start_time, end_time)
VALUES($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetBookingsBySalonID :many
SELECT
    b.*,
    u.name AS customer_name,
    u.surname AS customer_surname,
    u.email AS customer_email
FROM bookings b
INNER JOIN users u ON u.id = b.customer_id
WHERE b.salon_id = $1
ORDER BY b.start_time;

-- name: GetBookingsForDay :many
SELECT * FROM bookings
WHERE salon_id = sqlc.arg(salon_id)
  AND (staff_id = sqlc.arg(staff_id) OR (sqlc.arg(staff_id)::uuid IS NULL AND staff_id IS NULL))
  AND status NOT IN ('cancelled_by_user', 'cancelled_by_salon', 'cancelled_payment_failed')
  AND start_time >= sqlc.arg(range_start)
  AND start_time < sqlc.arg(range_end);


-- name: UpdateBookingStatus :one
UPDATE bookings
SET status = $1, updated_at = NOW()
WHERE id = $2 AND salon_id = $3
RETURNING *;

-- name: GetBookingByID :one
SELECT * from bookings
WHERE id = $1;

-- name: GetSalonBookingCounts :one
SELECT
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) AS upcoming,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status LIKE 'cancelled%') AS cancelled,
    COUNT(*) AS all_bookings
FROM bookings
WHERE salon_id = $1;


-- name: GetSalonBookingsByStatus :many
SELECT
    b.*,
    u.name AS customer_name,
    u.surname AS customer_surname,
    u.email AS customer_email
FROM bookings b
INNER JOIN users u ON u.id = b.customer_id
WHERE b.salon_id = $1 AND b.status LIKE sqlc.arg(status_pattern)
ORDER BY b.start_time DESC;

-- name: GetSalonBookingsByStatuses :many
SELECT
    b.*,
    u.name AS customer_name,
    u.surname AS customer_surname,
    u.email AS customer_email
FROM bookings b
INNER JOIN users u ON u.id = b.customer_id
WHERE b.salon_id = $1 AND b.status = ANY(sqlc.arg(statuses)::text[])
ORDER BY b.start_time DESC;
