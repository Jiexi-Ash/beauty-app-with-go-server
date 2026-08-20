package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/jackc/pgx/v5/pgconn"
)

type UserResponse struct {
	ID          pgtype.UUID        `json:"id"`
	Email       string             `json:"email"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
	AccessToken string             `json:"access_token"`
}

type UserCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshToken struct {
	AccessToken string `json:"access_token"`
}

func (a *Application) Register(w http.ResponseWriter, r *http.Request) {

	var registerDetails UserCredentials

	if err := json.NewDecoder(r.Body).Decode(&registerDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, fmt.Sprintf("error decoding: %v", err))
		return
	}

	if registerDetails.Email == "" || registerDetails.Password == "" {
		respondWithError(w, http.StatusBadRequest, "email or password is missing")
		return
	}

	passwordHash, err := HashPassword(registerDetails.Password)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	user, err := a.Queries.CreateUser(r.Context(), db.CreateUserParams{
		Email:        registerDetails.Email,
		PasswordHash: passwordHash,
	})

	var pgErr *pgconn.PgError
	if err != nil {
		if errors.As(err, &pgErr) {
			// UniqueViolation
			if pgErr.Code == "23505" {
				respondWithError(w, http.StatusConflict, "Email alredy exists, please log in instead")
				return
			}
		}

		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	a.respondWithAuthenticatedUser(w, r, user, http.StatusCreated)
}

func (a *Application) Login(w http.ResponseWriter, r *http.Request) {
	var loginDetails UserCredentials

	if err := json.NewDecoder(r.Body).Decode(&loginDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, fmt.Sprintf("error decoding: %v", err))
		return
	}

	if loginDetails.Email == "" || loginDetails.Password == "" {
		respondWithError(w, http.StatusBadRequest, "values cannot be empty")
		return
	}

	user, err := a.Queries.GetUserByEmail(r.Context(), loginDetails.Email)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}

		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	match, err := VerifyPassword(loginDetails.Password, user.PasswordHash)

	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if !match {
		respondWithError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	a.respondWithAuthenticatedUser(w, r, user, http.StatusOK)
}

func respondWithError(w http.ResponseWriter, code int, msg string) {

	type Error struct {
		Error string `json:"error"`
	}
	responseError := Error{
		Error: msg,
	}
	respondWithJson(w, code, responseError)

}

func respondWithJson(w http.ResponseWriter, code int, payload any) {

	responseData, err := json.Marshal(payload)

	if err != nil {
		log.Printf("Error encoding: %s", err)
		respondWithError(w, http.StatusInternalServerError, "failed to encode response")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if _, err := w.Write(responseData); err != nil {
		log.Printf("error writing response: %s", err)
	}
}

func (a *Application) respondWithAuthenticatedUser(w http.ResponseWriter, r *http.Request, user db.User, statusCode int) {
	token, err := a.GetAccessToken(user.ID.String())

	if err != nil {
		log.Printf("get access token failed: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	refresh_token, err := generateRefreshToken()

	if err != nil {
		log.Printf("generate refresh token failed: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	hashed_token := hashToken(refresh_token)

	expiresAt := time.Now().Add(24 * time.Hour * 30)

	pgExpiresAt := pgtype.Timestamptz{
		Time:  expiresAt,
		Valid: true,
	}

	err = a.Queries.CreateRefreshToken(r.Context(), db.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: hashed_token,
		ExpiresAt: pgExpiresAt,
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

		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return

	}

	a.setRefreshTokenCookie(w, refresh_token, expiresAt)

	respondWithJson(w, statusCode, UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		AccessToken: token,
	})
}

func (a *Application) RefreshAccessToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token_session")
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	hashed_token := hashToken(cookie.Value)
	token, err := a.Queries.GetRefreshTokenByHash(r.Context(), hashed_token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusUnauthorized, "invalid or expired refresh token")
			return
		}

		log.Printf("failure getting token: %v: ", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if token.RevokedAt.Valid {
		respondWithError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	if token.ExpiresAt.Time.Before(time.Now()) {
		respondWithError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	access_token, err := a.GetAccessToken(token.UserID.String())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, RefreshToken{
		AccessToken: access_token,
	})

}

func (a *Application) Logout(w http.ResponseWriter, r *http.Request) {
	revokedCookie := &http.Cookie{
		Name:     "refresh_token_session",
		Value:    "",
		Path:     "/auth/",
		Expires:  time.Now(),
		HttpOnly: true,
		MaxAge:   -1,
	}

	cookie, err := r.Cookie("refresh_token_session")

	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			http.SetCookie(w, revokedCookie)
			respondWithJson(w, http.StatusOK, "successfully logged out")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	hashed_token := hashToken(cookie.Value)

	refreshToken, err := a.Queries.GetRefreshTokenByHash(r.Context(), hashed_token)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.SetCookie(w, revokedCookie)
			respondWithJson(w, http.StatusOK, "successfully logged out")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	err = a.Queries.RevokeRefreshToken(r.Context(), refreshToken.ID)

	if err != nil {
		log.Printf("failed revoking token: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	http.SetCookie(w, revokedCookie)
	respondWithJson(w, http.StatusOK, "successfully logged out")

}
