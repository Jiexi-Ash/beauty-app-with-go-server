-- name: CreateRefreshToken :exec

INSERT INTO refresh_tokens(user_id, token_hash, expires_at)
VALUES ($1, $2, $3);


-- name: GetRefreshTokenByHash :one

SELECT * from refresh_tokens
WHERE token_hash = $1;


-- name: RevokeRefreshToken :exec

UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE id = $1;

