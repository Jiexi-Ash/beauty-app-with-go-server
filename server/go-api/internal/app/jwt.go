package app

import (
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (a *Application) GetAccessToken(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		Issuer:    "beauty-app",
		IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
		Subject:   userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	st, err := token.SignedString([]byte(a.jwtSecret))

	if err != nil {
		log.Printf("jwt signing failed: %v", err)
		return "", fmt.Errorf("failed fetching token")
	}

	return st, nil
}
