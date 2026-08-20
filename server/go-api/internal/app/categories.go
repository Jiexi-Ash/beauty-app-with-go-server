package app

import (
	"log"
	"net/http"
)

func (a *Application) GetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := a.Queries.GetCategories(r.Context())

	if err != nil {
		log.Printf("error fetching categories: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, categories)
}
