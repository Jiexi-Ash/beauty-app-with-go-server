package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type CreateReviewRequest struct {
	BookingID string  `json:"booking_id"`
	Rating    int     `json:"rating"`
	Comment   *string `json:"comment"`
}

func (a *Application) CreateReview(w http.ResponseWriter, r *http.Request) {
	userId, ok := GetUserID(r)

	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userId)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var reviewDetails CreateReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&reviewDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if reviewDetails.BookingID == "" {
		respondWithError(w, http.StatusBadRequest, "missing booking id")
		return
	}

	if reviewDetails.Rating < 1 || reviewDetails.Rating > 5 {
		respondWithError(w, http.StatusBadRequest, "rating needs to be between or include 1 and 5")
		return
	}

	parsedBookingID, err := parseToUUID(reviewDetails.BookingID)

	if err != nil {
		log.Printf("error parsing booking to uuid: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	booking, err := a.Queries.GetBookingByID(r.Context(), parsedBookingID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "booking not found")
			return
		}

		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if booking.CustomerID != parsedUserID {
		respondWithError(w, http.StatusForbidden, "booking does not belong to user")
		return
	}

	if booking.Status != "completed" {
		respondWithError(w, http.StatusUnprocessableEntity, "you can only leave reviews for completed bookings")
		return
	}

	pgxComment := toPgText(reviewDetails.Comment)
	review, err := a.Queries.CreateReview(r.Context(), db.CreateReviewParams{
		BookingID:  booking.ID,
		SalonID:    booking.SalonID,
		CustomerID: parsedUserID,
		Rating:     int16(reviewDetails.Rating),
		Comment:    pgxComment,
	})

	var pgErr *pgconn.PgError
	if err != nil {
		if errors.As(err, &pgErr) {

			if handled := handleDBConstraintError(w, pgErr); handled {
				return
			}

			log.Printf("Unexpected DB error: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusCreated, review)
}

func (a *Application) GetSalonReviews(w http.ResponseWriter, r *http.Request) {
	salonSlug := r.PathValue("slug")

	if salonSlug == "" {
		respondWithError(w, http.StatusNotFound, "salon not found")
		return
	}

	salon, err := a.Queries.GetSalonBySlug(r.Context(), salonSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	reviews, err := a.Queries.GetReviewsBySalonID(r.Context(), salon.ID)
	if err != nil {
		log.Printf("error fetching reviews: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if reviews == nil {
		reviews = []db.Review{}
	}

	respondWithJson(w, http.StatusOK, reviews)
}

func (a *Application) GetMyReviews(w http.ResponseWriter, r *http.Request) {
	userId, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userId)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	reviews, err := a.Queries.GetReviewsByCustomerID(r.Context(), parsedUserID)
	if err != nil {
		log.Printf("error fetching reviews: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if reviews == nil {
		reviews = []db.Review{}
	}

	respondWithJson(w, http.StatusOK, reviews)
}
