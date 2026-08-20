package app

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

type PlacesDetailResponse struct {
	FormattedAddress string         `json:"formattedAddress"`
	Location         GoogleLocation `json:"location"`
}

type PlacesAutocompleteResponse struct {
	Suggestions []Suggestion `json:"suggestions"`
}

type Suggestion struct {
	PlacePrediction PlacePrediction `json:"placePrediction"`
}

type PlacePrediction struct {
	PlaceID string    `json:"placeId"`
	Text    TextValue `json:"text"`
}

type TextValue struct {
	Text string `json:"text"`
}

type PlacesAutocompleteRequest struct {
	Input string `json:"input"`
}

type GoogleLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func (a *Application) GetPlacesAutocomplete(w http.ResponseWriter, r *http.Request) {

	var places []PlacePrediction
	input := r.URL.Query().Get("input")

	if input == "" {
		// not really an error but return nothing
		respondWithJson(w, http.StatusOK, places)
		return
	}

	placesInput, err := json.Marshal(PlacesAutocompleteRequest{
		Input: input,
	})

	if err != nil {
		log.Printf("error parsing into json: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	url := "https://places.googleapis.com/v1/places:autocomplete"

	req, err := http.NewRequest("POST", url, bytes.NewReader(placesInput))

	if err != nil {
		log.Printf("error creating request: %v", err)
		respondWithError(w, http.StatusInternalServerError, " internal server error")
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", a.GoogleMapsAPIKey)

	client := &http.Client{
		Timeout: time.Second * 15,
	}

	resp, err := client.Do(req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("google places error, status %d, body: %s", resp.StatusCode, body)
		respondWithError(w, http.StatusBadGateway, "something went wrong")
		return
	}

	var responseData PlacesAutocompleteResponse

	if err := json.NewDecoder(resp.Body).Decode(&responseData); err != nil {
		log.Printf("error decoding response: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	for _, suggestion := range responseData.Suggestions {
		places = append(places, PlacePrediction{PlaceID: suggestion.PlacePrediction.PlaceID, Text: suggestion.PlacePrediction.Text})
	}

	respondWithJson(w, http.StatusOK, places)

}

func (a *Application) GetPlaceDetails(w http.ResponseWriter, r *http.Request) {
	var Googleplace PlacesDetailResponse
	placeID := r.URL.Query().Get("place_id")

	if placeID == "" {
		// not really an error just return empty
		respondWithJson(w, http.StatusOK, Googleplace)
		return
	}

	place, err := a.fetchPlaceDetails(placeID)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, place)

}
