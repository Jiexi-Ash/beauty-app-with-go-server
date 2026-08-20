// Raw shapes returned by the Go API. Structs with no `json` tags in Go
// marshal as PascalCase (the Go field name); structs with explicit tags
// marshal as whatever the tag says (usually snake_case). See the handler
// source under server/go-api/internal/app for the ground truth.

// GET /owner/bookings, GET /owner/bookings/status — has explicit json tags
// (snake_case); joined with the customer's name/surname/email server-side.
export type OwnerBooking = {
  id: string;
  salon_id: string;
  service_id: string;
  staff_id: string | null;
  customer_id: string;
  payment_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_surname: string | null;
  customer_email: string;
};

// GET /owner/services — raw db.Service.
export type OwnerService = {
  ID: string;
  SalonID: string;
  Name: string;
  Slug: string | null;
  Description: string | null;
  DurationMinutes: number;
  PriceCents: number;
  IsActive: boolean;
  CategoryID: string;
  CoverImageUrl: string | null;
  CreatedAt: string;
  UpdatedAt: string;
};

// GET /owner/salon, POST /salons, PATCH /owner/salon, PATCH /owner/salon/publish,
// PATCH /owner/salon/visibility — raw db.Salon. `status` starts "draft" and only
// PublishSalon ever moves it to "published" (requires city+lat+long already set).
// `visibility` toggles independently between "visible"/"hidden" once published.
export type OwnerSalon = {
  ID: string;
  OwnerID: string;
  Name: string;
  Slug: string;
  Location: string;
  City: string | null;
  Phone: string | null;
  Description: string | null;
  CoverImageUrl: string | null;
  Timezone: string;
  Status: "draft" | "published";
  Visibility: "visible" | "hidden";
  PlatformStatus: string;
  Latitude: number | null;
  Longitude: number | null;
};

// pgtype.Time has no custom JSON marshaling, so it serializes as this raw
// struct (microseconds since midnight) rather than an "HH:MM" string.
export type PgTime = { Microseconds: number; Valid: boolean };

export function pgTimeToHHMM(t: PgTime, fallback: string) {
  if (!t.Valid) return fallback;
  const totalMinutes = Math.floor(t.Microseconds / 1_000_000 / 60);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// GET /owner/salon/hours — raw db.SalonHour.
export type SalonHour = {
  ID: string;
  SalonID: string;
  DayOfWeek: number;
  OpenTime: PgTime;
  CloseTime: PgTime;
  IsClosed: boolean;
};

// GET /owner/salon/settings — raw db.SalonSetting.
export type SalonSettings = {
  SalonID: string;
  BufferAfterServiceMinutes: number;
  MaxConcurrentBookings: number;
  AllowBookingBeyondCloseTime: boolean;
};

// GET /categories — raw db.Category.
export type CategoryRow = { ID: string; Name: string };

// GET /tags — raw db.Tag.
export type TagRow = { ID: string; Name: string };

// GET /salons, GET /salons/{slug} — has explicit json tags (snake_case).
export type SalonResponse = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  cover_image_url: string | null;
};

// GET /services, GET /salons/{slug} — has explicit json tags (snake_case).
export type ServiceResponse = {
  id: string;
  salon_id: string;
  name: string;
  category_name: string;
  cover_image_url: string | null;
  description: string | null;
  duration_minutes: number;
  slug: string | null;
  price_cents: number;
  category_id: string;
};

// GET /owner/bookings/counts — raw GetSalonBookingCountsRow.
export type SalonBookingCounts = {
  Upcoming: number;
  Completed: number;
  Cancelled: number;
  AllBookings: number;
};

// GET /salons/{slug}/reviews — raw db.Review.
export type Review = {
  ID: string;
  BookingID: string;
  SalonID: string;
  CustomerID: string;
  Rating: number;
  Comment: string | null;
  CreatedAt: string;
};

/** Best available display name for a customer on an owner-facing booking row. */
export function customerDisplayName(booking: OwnerBooking) {
  const fullName = [booking.customer_name, booking.customer_surname].filter(Boolean).join(" ");
  return fullName || booking.customer_email;
}
