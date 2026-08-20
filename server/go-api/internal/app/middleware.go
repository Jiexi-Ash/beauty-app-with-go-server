package app

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// ctxKey is a distinct type (not plain string) so our context values
// can't accidentally collide with keys used by other packages.
type ctxKey string

const userIDKey ctxKey = "userID"

// RequireAuth is middleware: wraps a handler so it only runs if the
// request carries a valid JWT. Attach it to any route that needs
// an authenticated user.
func (a *Application) RequireAuth(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// no token provided at all - reject immediately
			respondWithError(w, http.StatusUnauthorized, "unathorized")
			return
		}

		// header looks like "Bearer <token>" - strip the prefix
		// and any stray whitespace to get just the token string
		authToken := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))

		// shape of the claims we expect to decode from the token -
		// matches what we set when the token was created in GetAccessToken
		type CustomClaim struct {
			jwt.RegisteredClaims
		}

		token, err := jwt.ParseWithClaims(authToken, &CustomClaim{}, func(token *jwt.Token) (any, error) {
			// key function: tells the library what secret to check
			// the signature against. WithValidMethods below stops an
			// attacker from crafting a token with a different alg
			// and tricking us into using the wrong verification logic.
			return []byte(a.jwtSecret), nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil {
			// covers: bad signature, expired token, wrong algorithm,
			// malformed token - log the real reason for ourselves,
			// but give the client only a generic rejection
			log.Printf("error valiating token: %v", err)
			respondWithError(w, http.StatusUnauthorized, "unathorized")
			return
		}

		// token.Claims comes back as the generic jwt.Claims interface -
		// assert it back to our concrete CustomClaim type so we can
		// actually read its fields (like Subject, the user ID)
		if claims, ok := token.Claims.(*CustomClaim); ok {
			ctx := r.Context()

			// attach the authenticated user's ID to the request context
			// so downstream handlers can read it without re-verifying
			// anything themselves
			newCtx := context.WithValue(ctx, userIDKey, claims.Subject)

			// requests are immutable - derive a new one carrying the
			// updated context, rather than mutating r directly
			newRequest := r.WithContext(newCtx)

			// auth passed - hand off to the actual handler this
			// middleware is wrapping
			next.ServeHTTP(w, newRequest)
		} else {
			// claims weren't the expected concrete type - reject
			// rather than silently doing nothing
			respondWithError(w, http.StatusUnauthorized, "unathorized")
			return
		}
	})
}

func GetUserID(r *http.Request) (string, bool) {
	ctx := r.Context()

	userID, ok := ctx.Value(userIDKey).(string)

	if !ok {
		return "", false
	}

	return userID, true
}
