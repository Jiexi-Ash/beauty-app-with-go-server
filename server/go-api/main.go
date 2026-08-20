package main

import (
	"Jiexi-Ash/the-beauty-app/internal/app"
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")
	app_env := os.Getenv("APP_ENV")
	googleMapsAPIKey := os.Getenv("GOOGLE_MAPS_API_KEY")

	if app_env == "" {
		app_env = "production"
	}

	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}

	s3Bucket := os.Getenv("S3_BUCKET")
	if s3Bucket == "" {
		log.Fatal("S3_BUCKET environment variable is not set")
	}

	s3Region := os.Getenv("S3_REGION")
	if s3Region == "" {
		log.Fatal("S3_REGION environment variable is not set")
	}
	s3CFDistro := os.Getenv("S3_CF_DISTRO")
	if s3CFDistro == "" {
		log.Fatal("S3_CF_DISTRO environment variable is not set")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)

	if err != nil {
		log.Fatalf("unable to create connection pool: %v", err)
	}

	defer pool.Close()

	application := app.New(pool, jwtSecret, app_env, googleMapsAPIKey, s3Region, s3Bucket, s3CFDistro)

	router := http.NewServeMux()
	router.HandleFunc("GET /health", application.Health)
	router.HandleFunc("GET /healthdb", application.HealthDB)
	router.HandleFunc("POST /auth/register", application.Register)
	router.HandleFunc("POST /auth/login", application.Login)
	router.HandleFunc("POST /auth/logout", application.Logout)
	router.Handle("GET /protected", application.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("you are authenticated"))
	})))
	router.HandleFunc("POST /auth/refresh", application.RefreshAccessToken)
	router.Handle("POST /salons", application.RequireAuth(http.HandlerFunc(application.CreateSalon)))
	router.Handle("GET /owner/salon", application.RequireAuth(http.HandlerFunc(application.GetOwnerSalon)))
	router.Handle("PATCH /owner/salon", application.RequireAuth(http.HandlerFunc(application.UpdateOwnerSalon)))
	router.Handle("POST /owner/services", application.RequireAuth(http.HandlerFunc(application.CreateService)))
	router.Handle("GET /owner/services", application.RequireAuth(http.HandlerFunc(application.GetOwnerServices)))
	router.Handle("PATCH /owner/services/{id}", application.RequireAuth(http.HandlerFunc(application.UpdateOwnerService)))
	router.Handle("POST /owner/staff", application.RequireAuth(http.HandlerFunc(application.CreateStaff)))
	router.Handle("GET /owner/staff", application.RequireAuth(http.HandlerFunc(application.GetOwnerStaff)))
	router.Handle("POST /owner/salon/cover-image-upload-url", application.RequireAuth(http.HandlerFunc(application.GetSalonCoverImageUploadURL)))
	router.Handle("POST /owner/services/{id}/cover-image-upload-url", application.RequireAuth(http.HandlerFunc(application.GetServiceCoverImageUploadURL)))
	router.Handle("PATCH /owner/salon/settings", application.RequireAuth(http.HandlerFunc(application.UpdateSalonSettings)))
	router.Handle("PATCH /owner/salon/hours", application.RequireAuth(http.HandlerFunc(application.UpdateSalonHours)))
	router.Handle("PATCH /owner/salon/publish", application.RequireAuth(http.HandlerFunc(application.PublishSalon)))
	router.Handle("PATCH /owner/salon/visibility", application.RequireAuth(http.HandlerFunc(application.ToggleSalonVisibility)))
	router.Handle("PATCH /owner/services/{id}/activate", application.RequireAuth(http.HandlerFunc(application.ActivateService)))
	router.Handle("PATCH /owner/services/{id}/deactivate", application.RequireAuth(http.HandlerFunc(application.DeactivateService)))
	router.Handle("GET /owner/salon/hours", application.RequireAuth(http.HandlerFunc(application.GetOwnerSalonHours)))
	router.Handle("GET /owner/salon/settings", application.RequireAuth(http.HandlerFunc(application.GetOwnerSalonSettings)))
	router.HandleFunc("GET /tags", application.GetTags)
	router.Handle("PATCH /profile", application.RequireAuth(http.HandlerFunc(application.UpdateProfile)))
	router.Handle("GET /profile", application.RequireAuth(http.HandlerFunc(application.GetProfile)))
	router.Handle("POST /favorites/{slug}", application.RequireAuth(http.HandlerFunc(application.ToggleSalonFavorite)))
	router.Handle("GET /favorites", application.RequireAuth(http.HandlerFunc(application.GetFavorites)))
	router.Handle("GET /owner/bookings", application.RequireAuth(http.HandlerFunc(application.GetOwnerBookings)))
	router.Handle("GET /owner/bookings/{id}", application.RequireAuth(http.HandlerFunc(application.GetOwnerBookingByID)))
	router.Handle("PATCH /owner/bookings/{id}/status", application.RequireAuth(http.HandlerFunc(application.UpdateBookingStatus)))
	router.Handle("GET /owner/bookings/status", application.RequireAuth(http.HandlerFunc(application.GetOwnerBookingsByStatus)))
	router.Handle("GET /owner/bookings/counts", application.RequireAuth(http.HandlerFunc(application.GetOwnerBookingCounts)))
	router.HandleFunc("GET /salons/{slug}/reviews", application.GetSalonReviews)
	router.Handle("POST /reviews", application.RequireAuth(http.HandlerFunc(application.CreateReview)))
	router.Handle("GET /reviews/mine", application.RequireAuth(http.HandlerFunc(application.GetMyReviews)))
	router.Handle("GET /bookings", application.RequireAuth(http.HandlerFunc(application.GetBookingsByCustomerID)))
	router.Handle("GET /bookings/{id}", application.RequireAuth(http.HandlerFunc(application.GetBookingByCustomer)))
	router.Handle("GET /bookings/counts", application.RequireAuth(http.HandlerFunc(application.GetCustomerBookingCounts)))
	router.HandleFunc("GET /salons/{slug}/services/{serviceSlug}/availability", application.GetAvailability)
	router.HandleFunc("GET /salons/{slug}", application.GetSalonAndServices)
	router.HandleFunc("GET /salons", application.GetPublishedSalons)
	router.HandleFunc("GET /services", application.GetActiveServices)
	router.HandleFunc("GET /categories", application.GetCategories)
	router.HandleFunc("GET /places/autocomplete", application.GetPlacesAutocomplete)
	router.HandleFunc("GET /places/details", application.GetPlaceDetails)
	router.Handle("POST /bookings", application.RequireAuth(http.HandlerFunc(application.CreateBooking)))
	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	log.Println("server starting on :8080")
	err = server.ListenAndServe()
	if err != nil {
		log.Fatalf("Server error: %v", err)
	}

}
