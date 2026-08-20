package app

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/gosimple/slug"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

func toPgText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func generateSlug(name string) string {
	text := slug.Make(name)

	return text
}

func toPgFloat8(f *float64) pgtype.Float8 {
	if f == nil {
		return pgtype.Float8{Valid: false}
	}
	return pgtype.Float8{Float64: *f, Valid: true}
}

func toPgTimestamptz(t time.Time) pgtype.Timestamptz {
	if t.IsZero() {
		return pgtype.Timestamptz{Valid: false}
	}

	return pgtype.Timestamptz{Time: t, Valid: true}
}

func handleDBConstraintError(w http.ResponseWriter, pgErr *pgconn.PgError) bool {
	if !pgerrcode.IsIntegrityConstraintViolation(pgErr.Code) {
		return false // Not a constraint violation, let the caller handle it
	}

	switch pgErr.Code {
	case pgerrcode.UniqueViolation:
		log.Printf("Internal DB Error: %s (Constraint: %s)", pgErr.Message, pgErr.ConstraintName)
		respondWithError(w, http.StatusConflict, "the provided information already exist")

	case pgerrcode.ForeignKeyViolation:
		log.Printf("Internal DB Error: %s (Constraint: %s)", pgErr.Message, pgErr.ConstraintName)
		respondWithError(w, http.StatusBadRequest, "referenced item does not exist.")

	case pgerrcode.NotNullViolation:
		log.Printf("Internal DB Error: %s (Constraint: %s)", pgErr.Message, pgErr.ConstraintName)
		respondWithError(w, http.StatusBadRequest, "Missing required fields.")

	default:
		log.Printf("Database constraint error: %s (Constraint: %s)", pgErr.Message, pgErr.ConstraintName)
		respondWithError(w, http.StatusBadRequest, "database constraint error.")
	}

	return true // Error was handled and response was sent
}

func parseToUUID(value string) (pgtype.UUID, error) {
	parseUserUUID, err := uuid.Parse(value)

	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("something went wrong, please try again later: %v", err)
	}
	valueUUID := pgtype.UUID{
		Bytes: parseUserUUID,
		Valid: true,
	}

	return valueUUID, nil
}

func (a *Application) fetchPlaceDetails(placeID string) (PlacesDetailResponse, error) {

	if placeID == "" {
		return PlacesDetailResponse{}, fmt.Errorf("missing place id value")
	}

	url := "https://places.googleapis.com/v1/places/" + placeID

	req, err := http.NewRequest("GET", url, nil)

	if err != nil {
		log.Printf("error creating request: %v", err)
		return PlacesDetailResponse{}, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", a.GoogleMapsAPIKey)
	req.Header.Set("X-Goog-FieldMask", "id,formattedAddress,location")

	client := &http.Client{
		Timeout: time.Second * 15,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("error running reponse: %v", err)
		return PlacesDetailResponse{}, fmt.Errorf("error running request: %v", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("google places error, status %d, body: %s", resp.StatusCode, body)
		return PlacesDetailResponse{}, fmt.Errorf("google places error: status %d", resp.StatusCode)

	}

	var responseData PlacesDetailResponse
	if err := json.NewDecoder(resp.Body).Decode(&responseData); err != nil {
		log.Printf("error creating request: %v", err)
		return PlacesDetailResponse{}, fmt.Errorf("error decoding response: %v", err)
	}

	return responseData, nil
}

func (a *Application) generatePresignedUploadURL(ctx context.Context, s3Key string, contentType string) (string, error) {

	allowedContentTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}

	if !allowedContentTypes[contentType] {
		return "", fmt.Errorf("unsupported content type: %s", contentType)
	}

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(a.s3Region))
	if err != nil {
		return "", fmt.Errorf("loading aws config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)

	request, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(a.s3Bucket),
		Key:         aws.String(s3Key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(5*time.Minute))
	if err != nil {
		return "", fmt.Errorf("presigning url: %w", err)
	}

	return request.URL, nil
}

func contentTypeToExtension(contentType string) string {
	switch contentType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ""
	}
}
