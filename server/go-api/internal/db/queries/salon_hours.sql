-- name: CreateDefaultSalonHours :exec
INSERT INTO salon_hours (salon_id, day_of_week, is_closed)
VALUES
    ($1, 0, true),
    ($1, 1, true),
    ($1, 2, true),
    ($1, 3, true),
    ($1, 4, true),
    ($1, 5, true),
    ($1, 6, true);

-- name: GetSalonHoursBySalonID :many
SELECT * FROM salon_hours
WHERE salon_id = $1
ORDER BY day_of_week;