package app

import (
	db "Jiexi-Ash/the-beauty-app/internal/db/sqlc"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateBookingStatusRequest struct {
	Status string `json:"status"`
}

type AvailabilityResponse struct {
	Date           string   `json:"date"`
	AvailableSlots []string `json:"available_slots"`
}

type BookingRequest struct {
	ServiceID string  `json:"service_id"`
	StaffID   *string `json:"staff_id"`
	StartTime string  `json:"start_time"`
}

type OwnerBookingResponse struct {
	ID              pgtype.UUID        `json:"id"`
	SalonID         pgtype.UUID        `json:"salon_id"`
	ServiceID       pgtype.UUID        `json:"service_id"`
	StaffID         pgtype.UUID        `json:"staff_id"`
	CustomerID      pgtype.UUID        `json:"customer_id"`
	PaymentID       pgtype.UUID        `json:"payment_id"`
	StartTime       pgtype.Timestamptz `json:"start_time"`
	EndTime         pgtype.Timestamptz `json:"end_time"`
	Status          string             `json:"status"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	UpdatedAt       pgtype.Timestamptz `json:"updated_at"`
	CustomerName    pgtype.Text        `json:"customer_name"`
	CustomerSurname pgtype.Text        `json:"customer_surname"`
	CustomerEmail   string             `json:"customer_email"`
}

func (a *Application) CreateBooking(w http.ResponseWriter, r *http.Request) {

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

	var bookingRequest BookingRequest
	if err := json.NewDecoder(r.Body).Decode(&bookingRequest); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if bookingRequest.StartTime == "" || bookingRequest.ServiceID == "" {
		respondWithError(w, http.StatusBadRequest, "missing start time or service id")
		return
	}

	parsedServiceID, err := parseToUUID(bookingRequest.ServiceID)
	if err != nil {
		log.Printf("failed parsing service id %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	service, err := a.Queries.GetServiceByID(r.Context(), parsedServiceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "service not found")
			return
		}
		log.Printf("server error %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if !service.IsActive {
		respondWithError(w, http.StatusUnprocessableEntity, "cannot proceed because the requested service is currently offline.")
		return
	}

	salon, err := a.Queries.GetSalonByID(r.Context(), service.SalonID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if salon.Status != "published" || salon.PlatformStatus != "online" || salon.Visibility != "visible" {
		respondWithError(w, http.StatusUnprocessableEntity, "cannot proceed because the requested salon is currently offline.")
		return
	}

	parsedStartTime, err := time.Parse(time.RFC3339, bookingRequest.StartTime)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid time format. Please use RFC3339/ISO8601")
		return
	}

	var parsedStaffID pgtype.UUID
	if bookingRequest.StaffID != nil {
		parsedStaffID, err = parseToUUID(*bookingRequest.StaffID)
		if err != nil {
			log.Printf("failed parsing staff id %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	validSlots, err := a.computeAvailableSlots(r.Context(), salon.ID, salon.Timezone, service, parsedStaffID, parsedStartTime)
	if err != nil {
		log.Printf("error validating slot: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	slotIsValid := false
	for _, slot := range validSlots {
		if slot.Equal(parsedStartTime) {
			slotIsValid = true
			break
		}
	}

	if !slotIsValid {
		respondWithError(w, http.StatusConflict, "this time is not a valid booking slot")
		return
	}

	serviceEndTime := parsedStartTime.Add(time.Duration(service.DurationMinutes) * time.Minute)
	pgServiceStartTime := toPgTimestamptz(parsedStartTime)
	pgServiceEndTime := toPgTimestamptz(serviceEndTime)

	var pgErr *pgconn.PgError
	booking, err := a.Queries.CreateBooking(r.Context(), db.CreateBookingParams{
		SalonID:    service.SalonID,
		ServiceID:  service.ID,
		StaffID:    parsedStaffID,
		CustomerID: parsedUserID,
		StartTime:  pgServiceStartTime,
		EndTime:    pgServiceEndTime,
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
		respondWithError(w, http.StatusInternalServerError, "internal service error")
		return
	}

	respondWithJson(w, http.StatusCreated, booking)
}

func (a *Application) computeAvailableSlots(ctx context.Context, salonID pgtype.UUID, timezone string, service db.Service, staffID pgtype.UUID, date time.Time) ([]time.Time, error) {
	salonSettings, err := a.Queries.GetSalonSettings(ctx, salonID)
	if err != nil {
		return nil, fmt.Errorf("fetching salon settings: %w", err)
	}

	allHours, err := a.Queries.GetSalonHoursBySalonID(ctx, salonID)
	if err != nil {
		return nil, fmt.Errorf("fetching salon hours: %w", err)
	}

	dayOfWeek := int16(date.Weekday())

	var todayHours *db.SalonHour
	for _, h := range allHours {
		if h.DayOfWeek == dayOfWeek {
			hCopy := h
			todayHours = &hCopy
			break
		}
	}

	if todayHours == nil || todayHours.IsClosed || !todayHours.OpenTime.Valid || !todayHours.CloseTime.Valid {
		return []time.Time{}, nil
	}

	loc, err := time.LoadLocation(timezone)
	if err != nil {
		log.Printf("invalid timezone %q for salon %s, falling back to UTC: %v", timezone, salonID, err)
		loc = time.UTC
	}

	midnight := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)

	openDuration := time.Duration(todayHours.OpenTime.Microseconds) * time.Microsecond
	openDateTime := midnight.Add(openDuration)

	closeDuration := time.Duration(todayHours.CloseTime.Microseconds) * time.Microsecond
	closeDateTime := midnight.Add(closeDuration)

	dayStart := midnight
	dayEnd := dayStart.Add(24 * time.Hour)

	existingBookings, err := a.Queries.GetBookingsForDay(ctx, db.GetBookingsForDayParams{
		SalonID:    salonID,
		StaffID:    staffID,
		RangeStart: toPgTimestamptz(dayStart),
		RangeEnd:   toPgTimestamptz(dayEnd),
	})
	if err != nil {
		return nil, fmt.Errorf("fetching bookings: %w", err)
	}

	serviceDuration := time.Duration(service.DurationMinutes) * time.Minute
	buffer := time.Duration(salonSettings.BufferAfterServiceMinutes) * time.Minute
	interval := serviceDuration
	noStaffRequested := !staffID.Valid

	loopEnd := closeDateTime
	if !salonSettings.AllowBookingBeyondCloseTime {
		loopEnd = closeDateTime.Add(-serviceDuration)
	}

	var slots []time.Time
	for slotStart := openDateTime; !slotStart.After(loopEnd); slotStart = slotStart.Add(interval) {
		slotEndWithBuffer := slotStart.Add(serviceDuration).Add(buffer)

		conflict := false
		concurrentCount := 0

		for _, booking := range existingBookings {
			overlaps := slotStart.Before(booking.EndTime.Time) && booking.StartTime.Time.Before(slotEndWithBuffer)

			if !overlaps {
				continue
			}

			if noStaffRequested {
				concurrentCount++
			} else {
				conflict = true
				break
			}
		}

		if noStaffRequested && concurrentCount >= int(salonSettings.MaxConcurrentBookings) {
			conflict = true
		}

		if !conflict {
			slots = append(slots, slotStart)
		}
	}

	return slots, nil
}

func (a *Application) GetAvailability(w http.ResponseWriter, r *http.Request) {
	salonSlug := r.PathValue("slug")
	serviceSlug := r.PathValue("serviceSlug")
	dateParam := r.URL.Query().Get("date")
	staffIDParam := r.URL.Query().Get("staff_id")

	if salonSlug == "" || serviceSlug == "" || dateParam == "" {
		respondWithError(w, http.StatusBadRequest, "missing salon, service, or date")
		return
	}

	requestedDate, err := time.Parse("2006-01-02", dateParam)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
		return
	}

	salon, err := a.Queries.GetSalonBySlug(r.Context(), salonSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "salon not found")
			return
		}
		log.Printf("error fetching salon: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	pgServiceSlug := toPgText(&serviceSlug)
	service, err := a.Queries.GetServiceBySalonIDAndSlug(r.Context(), db.GetServiceBySalonIDAndSlugParams{
		SalonID: salon.ID,
		Slug:    pgServiceSlug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "service not found")
			return
		}
		log.Printf("error fetching service: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var parsedStaffID pgtype.UUID
	if staffIDParam != "" {
		parsedStaffID, err = parseToUUID(staffIDParam)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid staff id")
			return
		}
	}

	slots, err := a.computeAvailableSlots(r.Context(), salon.ID, salon.Timezone, service, parsedStaffID, requestedDate)
	if err != nil {
		log.Printf("error computing availability: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	var slotStrings []string
	for _, s := range slots {
		slotStrings = append(slotStrings, s.Format("15:04"))
	}

	respondWithJson(w, http.StatusOK, AvailabilityResponse{
		Date:           dateParam,
		AvailableSlots: slotStrings,
	})
}

func (a *Application) GetOwnerBookings(w http.ResponseWriter, r *http.Request) {
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

	rows, err := a.Queries.GetBookingsBySalonID(r.Context(), salon.ID)
	if err != nil {
		log.Printf("error fetching bookings: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	bookings := []OwnerBookingResponse{}
	for _, row := range rows {
		bookings = append(bookings, OwnerBookingResponse{
			ID: row.ID, SalonID: row.SalonID, ServiceID: row.ServiceID, StaffID: row.StaffID,
			CustomerID: row.CustomerID, PaymentID: row.PaymentID, StartTime: row.StartTime,
			EndTime: row.EndTime, Status: row.Status, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
			CustomerName: row.CustomerName, CustomerSurname: row.CustomerSurname, CustomerEmail: row.CustomerEmail,
		})
	}

	respondWithJson(w, http.StatusOK, bookings)
}

func (a *Application) GetOwnerBookingByID(w http.ResponseWriter, r *http.Request) {
	bookingID := r.PathValue("id")

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

	parsedBookingID, err := parseToUUID(bookingID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "booking not found")
		return
	}

	booking, err := a.Queries.GetBookingByID(r.Context(), parsedBookingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "booking not found")
			return
		}
		log.Printf("internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if booking.SalonID != salon.ID {
		respondWithError(w, http.StatusNotFound, "booking not found")
		return
	}

	respondWithJson(w, http.StatusOK, booking)
}

func (a *Application) UpdateBookingStatus(w http.ResponseWriter, r *http.Request) {
	bookingID := r.PathValue("id")

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

	parsedBookingID, err := parseToUUID(bookingID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid booking id")
		return
	}

	var req UpdateBookingStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	validStatuses := map[string]bool{
		"pending":                  true,
		"confirmed":                true,
		"in_progress":              true,
		"completed":                true,
		"no_show":                  true,
		"cancelled_by_user":        true,
		"cancelled_by_salon":       true,
		"cancelled_payment_failed": true,
	}

	if !validStatuses[req.Status] {
		respondWithError(w, http.StatusBadRequest, "invalid status value")
		return
	}

	var pgErr *pgconn.PgError
	booking, err := a.Queries.UpdateBookingStatus(r.Context(), db.UpdateBookingStatusParams{
		Status:  req.Status,
		ID:      parsedBookingID,
		SalonID: salon.ID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondWithError(w, http.StatusNotFound, "booking not found")
			return
		}
		if errors.As(err, &pgErr) {
			if handled := handleDBConstraintError(w, pgErr); handled {
				return
			}
			log.Printf("Unexpected DB error: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		log.Printf("error updating booking status: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, booking)
}

func (a *Application) GetOwnerBookingsByStatus(w http.ResponseWriter, r *http.Request) {
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

	bucket := r.URL.Query().Get("bucket")

	var bookings []OwnerBookingResponse

	switch bucket {
	case "upcoming":
		rows, err := a.Queries.GetSalonBookingsByStatuses(r.Context(), db.GetSalonBookingsByStatusesParams{
			SalonID:  salon.ID,
			Statuses: []string{"pending", "confirmed"},
		})
		if err != nil {
			log.Printf("error fetching bookings by bucket: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		for _, row := range rows {
			bookings = append(bookings, OwnerBookingResponse{
				ID: row.ID, SalonID: row.SalonID, ServiceID: row.ServiceID, StaffID: row.StaffID,
				CustomerID: row.CustomerID, PaymentID: row.PaymentID, StartTime: row.StartTime,
				EndTime: row.EndTime, Status: row.Status, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
				CustomerName: row.CustomerName, CustomerSurname: row.CustomerSurname, CustomerEmail: row.CustomerEmail,
			})
		}

	case "completed":
		rows, err := a.Queries.GetSalonBookingsByStatus(r.Context(), db.GetSalonBookingsByStatusParams{
			SalonID:       salon.ID,
			StatusPattern: "completed",
		})
		if err != nil {
			log.Printf("error fetching bookings by bucket: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		for _, row := range rows {
			bookings = append(bookings, OwnerBookingResponse{
				ID: row.ID, SalonID: row.SalonID, ServiceID: row.ServiceID, StaffID: row.StaffID,
				CustomerID: row.CustomerID, PaymentID: row.PaymentID, StartTime: row.StartTime,
				EndTime: row.EndTime, Status: row.Status, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
				CustomerName: row.CustomerName, CustomerSurname: row.CustomerSurname, CustomerEmail: row.CustomerEmail,
			})
		}

	case "cancelled":
		rows, err := a.Queries.GetSalonBookingsByStatus(r.Context(), db.GetSalonBookingsByStatusParams{
			SalonID:       salon.ID,
			StatusPattern: "cancelled%",
		})
		if err != nil {
			log.Printf("error fetching bookings by bucket: %v", err)
			respondWithError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		for _, row := range rows {
			bookings = append(bookings, OwnerBookingResponse{
				ID: row.ID, SalonID: row.SalonID, ServiceID: row.ServiceID, StaffID: row.StaffID,
				CustomerID: row.CustomerID, PaymentID: row.PaymentID, StartTime: row.StartTime,
				EndTime: row.EndTime, Status: row.Status, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
				CustomerName: row.CustomerName, CustomerSurname: row.CustomerSurname, CustomerEmail: row.CustomerEmail,
			})
		}

	default:
		respondWithError(w, http.StatusBadRequest, "invalid bucket, must be one of: upcoming, completed, cancelled")
		return
	}

	if bookings == nil {
		bookings = []OwnerBookingResponse{}
	}

	respondWithJson(w, http.StatusOK, bookings)
}

func (a *Application) GetOwnerBookingCounts(w http.ResponseWriter, r *http.Request) {
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

	counts, err := a.Queries.GetSalonBookingCounts(r.Context(), salon.ID)
	if err != nil {
		log.Printf("error fetching booking counts: %v", err)
		respondWithError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondWithJson(w, http.StatusOK, counts)
}
