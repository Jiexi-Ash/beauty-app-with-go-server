package app

import (
	"encoding/json"
	"net/http"
)

func (a *Application) Health(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("ok"))
}

func (a *Application) HealthDB(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var result int
	err := a.Pool.QueryRow(r.Context(), "SELECT 1").Scan(&result)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"status": "db error", "error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "db ok"})
}
