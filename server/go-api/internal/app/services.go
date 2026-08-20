package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type ServiceRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"duration_minutes"`
	PriceCents      int    `json:"price_cents"`
	CategoryID      string `json:"category_id"`
	CoverImageUrl   string `json:"cover_image_url"`
}

type UpdateServiceRequest struct {
	Name            string  `json:"name"`
	Description     *string `json:"description"`
	DurationMinutes int     `json:"duration_minutes"`
	PriceCents      int     `json:"price_cents"`
	CategoryID      string  `json:"category_id"`
	CoverImageUrl   *string `json:"cover_image_url"`
}

type ServiceResponse struct {
	ID              pgtype.UUID `json:"id"`
	SalonID         pgtype.UUID `json:"salon_id"`
	Name            string      `json:"name"`
	CategoryName    string      `json:"category_name"`
	CoverImageUrl   pgtype.Text `json:"cover_image_url"`
	Description     pgtype.Text `json:"description"`
	DurationMinutes int32       `json:"duration_minutes"`
	Slug            pgtype.Text `json:"slug"`
	PriceCents      int32       `json:"price_cents"`
	CategoryID      pgtype.UUID `json:"category_id"`
}

func (a *Application) CreateService(w http.ResponseWriter, r *http.Request) {
	var serviceDetails ServiceRequest

	if err := json.NewDecoder(r.Body).Decode(&serviceDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if serviceDetails.Name == "" {
		respondWithError(w, http.StatusBadRequest, "service name required")
		return
	}

	if serviceDetails.CategoryID == "" {
		respondWithError(w, http.StatusBadRequest, "missing category id")
		return
	}

	if serviceDetails.DurationMinutes == 0 {
		respondWithError(w, http.StatusBadRequest, "service duration cannot be 0")
		return
	}

	if serviceDetails.PriceCents == 0 {
		respondWithError(w, http.StatusBadRequest, "service price cannot be 0")
		return
	}

	userID, ok := GetUserID(r)

	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unathorised")
		return
	}

	parsedUserID, err := parseToUUID(userID)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	serviceCategoryID, err := parseToUUID(strings.TrimSpace(serviceDetails.CategoryID))

	if err != nil {
		log.Printf("failed parsing category uuid %v", err)
		respondWithError(w, http.StatusBadRequest, "invalid UUID format")
		return
	}

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parsedUserID)

	var pgErr *pgconn.PgError
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "you need to have a salon to perform this action")
			return
		}

		if errors.As(err, &pgErr) {

			log.Printf("Unexpected DB error: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return

	}

	generatedServiceNameSlug := generateSlug(serviceDetails.Name)
	serviceSlug := pgtype.Text{
		String: generatedServiceNameSlug,
		Valid:  strings.TrimSpace(generatedServiceNameSlug) != "",
	}
	serviceDescription := pgtype.Text{
		String: strings.TrimSpace(serviceDetails.Description),
		Valid:  strings.TrimSpace(serviceDetails.Description) != "",
	}

	serviceCoverImageUrl := pgtype.Text{
		String: strings.TrimSpace(serviceDetails.CoverImageUrl),
		Valid:  strings.TrimSpace(serviceDetails.CoverImageUrl) != "",
	}

	service, err := a.Queries.CreateService(r.Context(), db.CreateServiceParams{
		SalonID:         salon.ID,
		Name:            strings.TrimSpace(serviceDetails.Name),
		Slug:            serviceSlug,
		Description:     serviceDescription,
		DurationMinutes: int32(serviceDetails.DurationMinutes),
		PriceCents:      int32(serviceDetails.PriceCents),
		CategoryID:      serviceCategoryID,
		CoverImageUrl:   serviceCoverImageUrl,
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

	respondWithJson(w, http.StatusCreated, service)
}

func (a *Application) GetOwnerServices(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unathorised")
		return
	}

	parseduserID, err := parseToUUID(userID)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parseduserID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "no salon found")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal service error")
		return
	}

	services, err := a.Queries.GetServicesBySalonID(r.Context(), salon.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, services)

}

func (a *Application) UpdateOwnerService(w http.ResponseWriter, r *http.Request) {

	serviceID := r.PathValue("id")

	if serviceID == "" {
		respondWithError(w, http.StatusBadRequest, "missing service id param")
		return
	}

	var updateServiceDetails UpdateServiceRequest

	if err := json.NewDecoder(r.Body).Decode(&updateServiceDetails); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if updateServiceDetails.Name == "" {
		respondWithError(w, http.StatusBadRequest, "name is required")
		return
	}

	if updateServiceDetails.PriceCents == 0 {
		respondWithError(w, http.StatusBadRequest, "price cannot be 0")
		return
	}

	if updateServiceDetails.DurationMinutes == 0 {
		respondWithError(w, http.StatusBadRequest, "duration cannot be 0")
		return
	}

	if updateServiceDetails.CategoryID == "" {
		respondWithError(w, http.StatusBadRequest, "category id is required")
		return
	}

	userID, ok := GetUserID(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "unathorised")
		return
	}

	parseduserID, err := parseToUUID(userID)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	parsedServiceID, err := parseToUUID(serviceID)

	if err != nil {
		log.Printf("failed parsing uuid %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	serviceCategoryID, err := parseToUUID(strings.TrimSpace(updateServiceDetails.CategoryID))

	if err != nil {
		log.Printf("failed parsing category uuid %v", err)
		respondWithError(w, http.StatusBadRequest, "invalid UUID format")
		return
	}

	generatedServiceNameSlug := generateSlug(updateServiceDetails.Name)
	serviceSlug := toPgText(&generatedServiceNameSlug)
	serviceDescription := toPgText(updateServiceDetails.Description)

	serviceCoverImageUrl := toPgText(updateServiceDetails.CoverImageUrl)

	salon, err := a.Queries.GetSalonByOwnerID(r.Context(), parseduserID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}

		respondWithError(w, http.StatusInternalServerError, "internal service error")
		return
	}

	service, err := a.Queries.UpdateService(r.Context(), db.UpdateServiceParams{
		Name:            updateServiceDetails.Name,
		DurationMinutes: int32(updateServiceDetails.DurationMinutes),
		PriceCents:      int32(updateServiceDetails.PriceCents),
		CategoryID:      serviceCategoryID,
		Description:     serviceDescription,
		CoverImageUrl:   serviceCoverImageUrl,
		Slug:            serviceSlug,
		ID:              parsedServiceID,
		SalonID:         salon.ID,
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

		log.Printf("Unexpected DB error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, service)
}

func (a *Application) GetActiveServices(w http.ResponseWriter, r *http.Request) {

	services, err := a.Queries.GetActiveServices(r.Context())

	if err != nil {

		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var servicesData []ServiceResponse

	for _, service := range services {
		serviveData := ServiceResponse{
			ID:              service.ID,
			SalonID:         service.SalonID,
			Name:            service.Name,
			CategoryName:    service.CategoryName,
			CoverImageUrl:   service.CoverImageUrl,
			Description:     service.Description,
			DurationMinutes: service.DurationMinutes,
			Slug:            service.Slug,
			PriceCents:      service.PriceCents,
			CategoryID:      service.CategoryID,
		}
		servicesData = append(servicesData, serviveData)
	}

	respondWithJson(w, http.StatusOK, servicesData)
}

func (a *Application) GetServiceCoverImageUploadURL(w http.ResponseWriter, r *http.Request) {
	serviceID := r.PathValue("id")

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

	parsedServiceID, err := parseToUUID(serviceID)

	if err != nil {
		log.Printf("parsing serviceID error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	service, err := a.Queries.GetServiceByID(r.Context(), parsedServiceID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "service not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if service.SalonID != salon.ID {
		respondWithError(w, http.StatusForbidden, "you can only make updates your salon")
		return
	}

	ext := contentTypeToExtension(req.ContentType)
	if ext == "" {
		respondWithError(w, http.StatusBadRequest, "unsupported content type")
		return
	}

	s3Key := fmt.Sprintf("services/%s/cover%s", service.ID.String(), ext)

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

func (a *Application) ActivateService(w http.ResponseWriter, r *http.Request) {
	serviceID := r.PathValue("id")

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

	parsedServiceID, err := parseToUUID(serviceID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid service id")
		return
	}

	service, err := a.Queries.GetServiceByID(r.Context(), parsedServiceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "service not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if service.SalonID != salon.ID {
		respondWithError(w, http.StatusNotFound, "service not found")
		return
	}

	if !service.CoverImageUrl.Valid || service.CoverImageUrl.String == "" {
		respondWithError(w, http.StatusUnprocessableEntity, "cannot activate: service has no cover image")
		return
	}

	var pgErr *pgconn.PgError
	updated, err := a.Queries.ActivateService(r.Context(), db.ActivateServiceParams{
		ID:      parsedServiceID,
		SalonID: salon.ID,
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
		log.Printf("error activating service: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, updated)
}

func (a *Application) DeactivateService(w http.ResponseWriter, r *http.Request) {
	serviceID := r.PathValue("id")

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

	parsedServiceID, err := parseToUUID(serviceID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid service id")
		return
	}

	updated, err := a.Queries.DeactivateService(r.Context(), db.DeactivateServiceParams{
		ID:      parsedServiceID,
		SalonID: salon.ID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "service not found")
			return
		}
		log.Printf("error deactivating service: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, updated)
}
