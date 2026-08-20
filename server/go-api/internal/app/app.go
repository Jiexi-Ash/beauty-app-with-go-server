package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Application holds shared dependencies that handlers need access to.
// As the app grows, this is where you'd also add things like:
// a logger, JWT secret, config values, etc.

type Application struct {
	Pool             *pgxpool.Pool
	Queries          *db.Queries
	jwtSecret        string
	Environment      string
	GoogleMapsAPIKey string
	s3Region         string
	s3Bucket         string
	s3CFDistro       string
	awsUserKey       string
	awsUserSecret    string
}

func New(pool *pgxpool.Pool, jwtSecret, environment, googleMapsAPIKey, s3Region, s3Bucket, s3CFDistro string) *Application {
	return &Application{
		Pool:             pool,
		Queries:          db.New(pool),
		jwtSecret:        jwtSecret,
		Environment:      environment,
		GoogleMapsAPIKey: googleMapsAPIKey,
		s3Region:         s3Region,
		s3Bucket:         s3Bucket,
		s3CFDistro:       s3CFDistro,
	}
}
