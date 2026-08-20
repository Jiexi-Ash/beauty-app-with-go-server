import BookingDetails from "@/components/dashboard/booking-details";

interface BookingDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;
  return <BookingDetails bookingId={id} />;
}

export default BookingDetailsPage;
