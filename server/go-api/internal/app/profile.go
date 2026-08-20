package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type ProfileResponse struct {
	ID        pgtype.UUID        `json:"id"`
	Email     string             `json:"email"`
	Name      pgtype.Text        `json:"name"`
	Surname   pgtype.Text        `json:"surname"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

type UpdateProfileRequest struct {
	Name    *string `json:"name"`
	Surname *string `json:"surname"`
}

func (a *Application) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	user, err := a.Queries.GetUserByID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, ProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Surname:   user.Surname,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	})
}

func (a *Application) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	pgName := toPgText(req.Name)
	pgSurname := toPgText(req.Surname)

	user, err := a.Queries.UpdateUserProfile(r.Context(), db.UpdateUserProfileParams{
		Name:    pgName,
		Surname: pgSurname,
		ID:      parsedUserID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("error updating profile: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, ProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Surname:   user.Surname,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	})
}

func (a *Application) ToggleSalonFavorite(w http.ResponseWriter, r *http.Request) {
	salonSlug := r.PathValue("slug")

	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
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

	exists, err := a.Queries.CheckSalonFavorite(r.Context(), db.CheckSalonFavoriteParams{
		UserID:  parsedUserID,
		SalonID: salon.ID,
	})
	if err != nil {
		log.Printf("error checking favorite: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if exists {
		if err := a.Queries.RemoveSalonFavorite(r.Context(), db.RemoveSalonFavoriteParams{
			UserID:  parsedUserID,
			SalonID: salon.ID,
		}); err != nil {
			log.Printf("error removing favorite: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		respondWithJson(w, http.StatusOK, map[string]bool{"favorited": false})
		return
	}

	if err := a.Queries.AddSalonFavorite(r.Context(), db.AddSalonFavoriteParams{
		UserID:  parsedUserID,
		SalonID: salon.ID,
	}); err != nil {
		log.Printf("error adding favorite: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondWithJson(w, http.StatusOK, map[string]bool{"favorited": true})
}

func (a *Application) GetFavorites(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	favorites, err := a.Queries.GetUserFavorites(r.Context(), parsedUserID)
	if err != nil {
		log.Printf("error fetching favorites: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if favorites == nil {
		favorites = []db.GetUserFavoritesRow{}
	}

	respondWithJson(w, http.StatusOK, favorites)
}

func (a *Application) GetBookingsByCustomerID(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	bookings, err := a.Queries.GetBookingsByCustomerID(r.Context(), parsedUserID)

	if err != nil {
		log.Printf("error fetching bookings: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if bookings == nil {
		bookings = []db.Booking{}

	}

	respondWithJson(w, http.StatusOK, bookings)
}

func (a *Application) GetBookingByCustomer(w http.ResponseWriter, r *http.Request) {
	bookingID := r.PathValue("id")

	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	parsedBookingID, err := parseToUUID(bookingID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "booking not found")
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
		respondWithError(w, http.StatusNotFound, "booking not found")
		return
	}

	respondWithJson(w, http.StatusOK, booking)
}

func (a *Application) GetCustomerBookingCounts(w http.ResponseWriter, r *http.Request) {

	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	parsedUserID, err := parseToUUID(userID)
	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	bookingsCount, err := a.Queries.GetCustomerBookingCounts(r.Context(), parsedUserID)

	if err != nil {
		log.Printf("error fetching bookings count: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, bookingsCount)

}
