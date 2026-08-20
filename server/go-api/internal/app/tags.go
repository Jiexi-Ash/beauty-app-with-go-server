package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"log"
	"net/http"
)

func (a *Application) GetTags(w http.ResponseWriter, r *http.Request) {
	tags, err := a.Queries.GetTags(r.Context())

	if err != nil {
		log.Printf("error fetching tags: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if tags == nil {
		tags = []db.Tag{}
	}

	respondWithJson(w, http.StatusOK, tags)
}
