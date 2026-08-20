import DashboardService from "@/components/dashboard/service";

interface DashboardServicePageProps {
  params: Promise<{ id: string }>;
}

async function DashboardServicePage({ params }: DashboardServicePageProps) {
  const { id } = await params;

  if (!id)
    return (
      <div className="min-h-screen w-full flex items-center justify-between">
        <p>Invalid service ID</p>
      </div>
    );

  return <DashboardService id={id} />;
}

export default DashboardServicePage;
