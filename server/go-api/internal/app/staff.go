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

type Staff struct {
	Name    string  `json:"name"`
	Surname string  `json:"surname"`
	SalonID string  `json:"salon_id"`
	Phone   *string `json:"phone"`
	Email   *string `json:"email"`
}

func (a *Application) CreateStaff(w http.ResponseWriter, r *http.Request) {
	var staff Staff

	if err := json.NewDecoder(r.Body).Decode(&staff); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if staff.Name == "" || staff.Surname == "" {
		respondWithError(w, http.StatusBadRequest, "missing required values")
		return
	}

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

	pgEmail := toPgText(staff.Email)
	pgPhone := toPgText(staff.Phone)

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}

		log.Printf("get salon error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	salonStaff, err := a.Queries.CreateStaff(r.Context(), db.CreateStaffParams{
		SalonID: salon.ID,
		Name:    staff.Name,
		Surname: staff.Surname,
		Email:   pgEmail,
		Phone:   pgPhone,
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

	respondWithJson(w, http.StatusCreated, salonStaff)
}

func (a *Application) GetOwnerStaff(w http.ResponseWriter, r *http.Request) {
	userId, ok := GetUserID(r)

	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unathorised")
		return
	}

	parsedUserId, err := parseToUUID(userId)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserId)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	salonStaff, err := a.Queries.GetStaffBySalonID(r.Context(), salon.ID)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, salonStaff)
}
