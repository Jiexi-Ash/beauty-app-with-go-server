package app

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"net/http"
	"time"
)

/*
builds a SHA-256 hasher, writes the token bytes into it,
calls Sum(nil) to get the raw hash bytes
(the nil argument means "don't append to an existing slice,
just give me the hash fresh"), then hex-encodes the result
into a readable string suitable for storing in your token_hash TEXT column.

*/

func generateRefreshToken() (string, error) {
	key := make([]byte, 32)
	_, err := rand.Read(key)

	if err != nil {
		return "", err
	}
	encodedToken := base64.URLEncoding.EncodeToString(key)

	return encodedToken, nil

}

func hashToken(token string) string {
	hash := sha256.New()
	hash.Write([]byte(token))

	tokenHash := hash.Sum(nil)

	encodedStr := hex.EncodeToString(tokenHash)

	return encodedStr
}

func (a *Application) setRefreshTokenCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	cookie := &http.Cookie{
		Name:     "refresh_token_session",
		Value:    token,
		Path:     "/auth/",
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   a.Environment == "production",
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, cookie)
}
