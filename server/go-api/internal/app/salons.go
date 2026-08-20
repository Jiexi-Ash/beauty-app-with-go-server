package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateSalonSettingsRequest struct {
	BufferAfterServiceMinutes   int  `json:"buffer_after_service_minutes"`
	MaxConcurrentBookings       int  `json:"max_concurrent_bookings"`
	AllowBookingBeyondCloseTime bool `json:"allow_booking_beyond_close_time"`
}

type UpdateSalonHoursRequest struct {
	DayOfWeek int     `json:"day_of_week"`
	OpenTime  *string `json:"open_time"`
	CloseTime *string `json:"close_time"`
	IsClosed  bool    `json:"is_closed"`
}

type PresignUploadResponse struct {
	UploadURL string `json:"upload_url"`
	PublicURL string `json:"public_url"`
}

type PresignUploadRequest struct {
	ContentType string `json:"content_type"`
}

type SalonRequest struct {
	Name          string   `json:"name"`
	Location      string   `json:"location"`
	City          string   `json:"city"`
	Phone         string   `json:"phone"`
	Description   string   `json:"description"`
	CoverImageUrl string   `json:"cover_image_url"`
	TagIDs        []string `json:"tag_ids"`
}

type UpdateSalonRequest struct {
	Name          string  `json:"name"`
	Location      string  `json:"location"`
	City          *string `json:"city"`
	Phone         *string `json:"phone"`
	Description   *string `json:"description"`
	CoverImageUrl *string `json:"cover_image_url"`
	PlaceID       *string `json:"place_id"`
}

type SalonResponse struct {
	ID            pgtype.UUID `json:"id"`
	Name          string      `json:"name"`
	Slug          string      `json:"slug"`
	City          pgtype.Text `json:"city"`
	Phone         pgtype.Text `json:"phone"`
	CoverImageUrl pgtype.Text `json:"cover_image_url"`
}

type SalonServicesResponse struct {
	Salon    SalonResponse     `json:"salon"`
	Services []ServiceResponse `json:"services"`
}

// this entire sequence will be  a pgx transaction so it either fully succeeds or fails. (time right now so i made it less atomic)
func (a *Application) CreateSalon(w http.ResponseWriter, r *http.Request) {
	var userDetails SalonRequest

	if err := json.NewDecoder(r.Body).Decode(&userDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if userDetails.Name == "" {
		respondWithError(w, http.StatusBadRequest, "name is required")
		return
	}

	if userDetails.Location == "" {
		respondWithError(w, http.StatusBadRequest, "location is required")
		return
	}

	if len(userDetails.TagIDs) > 3 {
		respondWithError(w, http.StatusBadRequest, "you can select up to 3 tags")
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

	_, err = a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)

	var pgErr *pgconn.PgError
	if err == nil {
		respondWithError(w, http.StatusConflict, "user already has salon")
		return
	}

	if errors.Is(err, pgx.ErrNoRows) {
		salonCity := pgtype.Text{
			String: strings.TrimSpace(userDetails.City),
			Valid:  strings.TrimSpace(userDetails.City) != "",
		}
		salonPhone := pgtype.Text{
			String: userDetails.Phone,
			Valid:  strings.TrimSpace(userDetails.Phone) != "",
		}

		salonDesc := pgtype.Text{
			String: userDetails.Description,
			Valid:  strings.TrimSpace(userDetails.Description) != "",
		}
		coverImage := pgtype.Text{
			String: userDetails.CoverImageUrl,
			Valid:  strings.TrimSpace(userDetails.CoverImageUrl) != "",
		}

		parsedUUID, err := uuid.Parse(userId)
		ownerUuid := pgtype.UUID{
			Bytes: parsedUUID,
			Valid: true,
		}

		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "somwthing went wrong, please try again later")
			return
		}

		salon, err := a.Queries.CreateSalon(r.Context(), db.CreateSalonParams{
			OwnerID:       ownerUuid,
			Name:          userDetails.Name,
			Location:      userDetails.Location,
			City:          salonCity,
			Phone:         salonPhone,
			Slug:          generateSlug(userDetails.Name),
			Description:   salonDesc,
			CoverImageUrl: coverImage,
		})

		if err != nil {
			if errors.As(err, &pgErr) {

				if handled := handleDBConstraintError(w, pgErr); handled {
					return
				}

				log.Printf("Unexpected DB error: %v", err)
				respondWithError(w, http.StatusInternalServerError, "internal server error")
				return
			}

			log.Printf("Unexpected DB error: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		for _, tagID := range userDetails.TagIDs {
			parsedTagID, err := parseToUUID(tagID)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "invalid tag id")
				return
			}

			if err := a.Queries.AddSalonTag(r.Context(), db.AddSalonTagParams{
				SalonID: salon.ID,
				TagID:   parsedTagID,
			}); err != nil {
				if errors.As(err, &pgErr) {
					if handled := handleDBConstraintError(w, pgErr); handled {
						return
					}
					log.Printf("Unexpected DB error: %v", err)
					respondWithError(w, http.StatusInternalServerError, "internal server error")
					return
				}
				log.Printf("failed to add salon tag: %v", err)
				respondWithError(w, http.StatusInternalServerError, "internal server error")
				return
			}
		}

		if err := a.Queries.CreateSalonSettings(r.Context(), salon.ID); err != nil {
			log.Printf("failed to create default salon settings: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		if err := a.Queries.CreateDefaultSalonHours(r.Context(), salon.ID); err != nil {
			log.Printf("failed to create default salon hours: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		respondWithJson(w, http.StatusCreated, salon)
		return

	}

	log.Printf("Unexpected DB error: %v", err)
	respondWithError(w, http.StatusInternalServerError, "internal server error")

}

func (a *Application) GetOwnerSalon(w http.ResponseWriter, r *http.Request) {

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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "no salon found")
			return
		}

		log.Printf("get salon error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, salon)
}

func (a *Application) UpdateOwnerSalon(w http.ResponseWriter, r *http.Request) {
	var updateDetails UpdateSalonRequest

	if err := json.NewDecoder(r.Body).Decode(&updateDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if updateDetails.Name == "" || updateDetails.Location == "" {
		respondWithError(w, http.StatusBadRequest, "missing name or location")
		return
	}

	userId, ok := GetUserID(r)

	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unauthorised")
		return
	}
	parsedUserID, err := parseToUUID(userId)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var locatinDetails PlacesDetailResponse
	var pgLatitudeCoords pgtype.Float8
	var pgLongitudeCoords pgtype.Float8
	location := updateDetails.Location
	placeId := updateDetails.PlaceID
	if updateDetails.PlaceID != nil {
		locatinDetails, err = a.fetchPlaceDetails(*placeId)
		if err != nil {
			log.Printf("error getting location details: %v", err)
			respondWithError(w, http.StatusInternalServerError, "failed to resolve location, try again")
			return
		}
		pgLatitudeCoords = toPgFloat8(&locatinDetails.Location.Latitude)
		pgLongitudeCoords = toPgFloat8(&locatinDetails.Location.Longitude)
		location = locatinDetails.FormattedAddress
	}

	pgCity := toPgText(updateDetails.City)
	pgDescription := toPgText(updateDetails.Description)
	pgPhone := toPgText(updateDetails.Phone)
	pgCoverImageUrl := toPgText(updateDetails.CoverImageUrl)

	salon, err := a.Queries.UpdateSalon(r.Context(), db.UpdateSalonParams{
		Name:          updateDetails.Name,
		Location:      location,
		City:          pgCity,
		Phone:         pgPhone,
		Description:   pgDescription,
		CoverImageUrl: pgCoverImageUrl,
		OwnerID:       parsedUserID,
		Latitude:      pgLatitudeCoords,
		Longitude:     pgLongitudeCoords,
	})

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}

		log.Printf("error updating salon: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, salon)

}

func (a *Application) GetPublishedSalons(w http.ResponseWriter, r *http.Request) {

	salonsData, err := a.Queries.GetActiveSalons(r.Context())

	if err != nil {
		log.Printf("error fetching salons: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var salons []SalonResponse

	for _, salon := range salonsData {
		salonData := SalonResponse{
			ID:            salon.ID,
			Name:          salon.Name,
			Slug:          salon.Slug,
			City:          salon.City,
			Phone:         salon.Phone,
			CoverImageUrl: salon.CoverImageUrl,
		}

		salons = append(salons, salonData)
	}

	respondWithJson(w, http.StatusOK, salons)

}

func (a *Application) GetSalonAndServices(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	if slug == "" {
		respondWithError(w, http.StatusNotFound, "salon not found")
		return
	}

	services, err := a.Queries.GetSalonAndServicesBySlug(r.Context(), slug)
	if err != nil {
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	salon, err := a.Queries.GetSalonBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var servicesData []ServiceResponse
	for _, service := range services {
		servicesData = append(servicesData, ServiceResponse{
			ID: service.ID, SalonID: service.SalonID, Name: service.Name,
			CategoryName: service.CategoryName, CoverImageUrl: service.CoverImageUrl,
			Description: service.Description, DurationMinutes: service.DurationMinutes,
			Slug: service.Slug, PriceCents: service.PriceCents, CategoryID: service.CategoryID,
		})
	}

	respondWithJson(w, http.StatusOK, SalonServicesResponse{
		Salon: SalonResponse{
			ID: salon.ID, Name: salon.Name, Slug: salon.Slug,
			City: salon.City, Phone: salon.Phone, CoverImageUrl: salon.CoverImageUrl,
		},
		Services: servicesData,
	})
}

func (a *Application) GetSalonCoverImageUploadURL(w http.ResponseWriter, r *http.Request) {
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

	var req PresignUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	ext := contentTypeToExtension(req.ContentType)
	if ext == "" {
		respondWithError(w, http.StatusBadRequest, "unsupported content type")
		return
	}

	s3Key := fmt.Sprintf("salons/%s/cover%s", salon.ID.String(), ext)

	uploadURL, err := a.generatePresignedUploadURL(r.Context(), s3Key, req.ContentType)
	if err != nil {
		log.Printf("error generating presigned url: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	publicURL := fmt.Sprintf("https://%s/%s", a.s3CFDistro, s3Key)

	respondWithJson(w, http.StatusOK, PresignUploadResponse{
		UploadURL: uploadURL,
		PublicURL: publicURL,
	})
}

func (a *Application) UpdateSalonHours(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var req UpdateSalonHoursRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.DayOfWeek < 0 || req.DayOfWeek > 6 {
		respondWithError(w, http.StatusBadRequest, "day_of_week must be between 0 and 6")
		return
	}

	var pgOpenTime, pgCloseTime pgtype.Time
	if req.OpenTime != nil {
		parsed, err := time.Parse("15:04", *req.OpenTime)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid open_time format, use HH:MM")
			return
		}
		micros := int64(parsed.Hour()*3600+parsed.Minute()*60) * 1_000_000
		pgOpenTime = pgtype.Time{Microseconds: micros, Valid: true}
	}

	if req.CloseTime != nil {
		parsed, err := time.Parse("15:04", *req.CloseTime)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid close_time format, use HH:MM")
			return
		}
		micros := int64(parsed.Hour()*3600+parsed.Minute()*60) * 1_000_000
		pgCloseTime = pgtype.Time{Microseconds: micros, Valid: true}
	}

	err = a.Queries.UpdateSalonHours(r.Context(), db.UpdateSalonHoursParams{
		OpenTime:  pgOpenTime,
		CloseTime: pgCloseTime,
		IsClosed:  req.IsClosed,
		SalonID:   salon.ID,
		DayOfWeek: int16(req.DayOfWeek),
	})
	if err != nil {
		log.Printf("error updating salon hours: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, map[string]string{"message": "hours updated"})
}

func (a *Application) UpdateSalonSettings(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var req UpdateSalonSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.MaxConcurrentBookings <= 0 {
		respondWithError(w, http.StatusBadRequest, "max_concurrent_bookings must be greater than 0")
		return
	}

	if req.MaxConcurrentBookings > 2 {
		respondWithError(w, http.StatusBadRequest, "max_concurrent_bookings cannot exceed 2")
		return
	}

	if req.BufferAfterServiceMinutes < 0 {
		respondWithError(w, http.StatusBadRequest, "buffer_after_service_minutes cannot be negative")
		return
	}

	err = a.Queries.UpdateSalonSettings(r.Context(), db.UpdateSalonSettingsParams{
		BufferAfterServiceMinutes:   int32(req.BufferAfterServiceMinutes),
		MaxConcurrentBookings:       int32(req.MaxConcurrentBookings),
		AllowBookingBeyondCloseTime: req.AllowBookingBeyondCloseTime,
		SalonID:                     salon.ID,
	})
	if err != nil {
		log.Printf("error updating salon settings: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, map[string]string{"message": "settings updated"})
}

func (a *Application) PublishSalon(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var missing []string
	if !salon.City.Valid {
		missing = append(missing, "city")
	}
	if !salon.Latitude.Valid {
		missing = append(missing, "latitude")
	}
	if !salon.Longitude.Valid {
		missing = append(missing, "longitude")
	}
	if len(missing) > 0 {
		respondWithError(w, http.StatusUnprocessableEntity,
			fmt.Sprintf("cannot publish: missing required fields: %s", strings.Join(missing, ", ")))
		return
	}

	var pgErr *pgconn.PgError
	updated, err := a.Queries.PublishSalon(r.Context(), salon.ID)
	if err != nil {
		if errors.As(err, &pgErr) {
			if handled := handleDBConstraintError(w, pgErr); handled {
				return
			}
			log.Printf("Unexpected DB error: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		log.Printf("error publishing salon: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, updated)
}

func (a *Application) ToggleSalonVisibility(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	updated, err := a.Queries.ToggleSalonVisibility(r.Context(), salon.ID)
	if err != nil {
		log.Printf("error toggling salon visibility: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, updated)
}

func (a *Application) GetOwnerSalonHours(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	hours, err := a.Queries.GetSalonHoursBySalonID(r.Context(), salon.ID)
	if err != nil {
		log.Printf("error fetching salon hours: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if hours == nil {
		hours = []db.SalonHour{}
	}

	respondWithJson(w, http.StatusOK, hours)
}

func (a *Application) GetOwnerSalonSettings(w http.ResponseWriter, r *http.Request) {
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

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	settings, err := a.Queries.GetSalonSettings(r.Context(), salon.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon settings not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, settings)
}
