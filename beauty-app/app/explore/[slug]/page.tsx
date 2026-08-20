import BusinessProfile from '@/components/business/business-profile';
import MainLayout from '@/components/main-layout';
import { goFetch } from '@/lib/go-api';
import { notFound } from 'next/navigation';

interface ExploreBusinessPageProps {
    params: Promise<{ slug: string }>;
}

async function ExploreBusinessPage({ params }: ExploreBusinessPageProps) {
    const { slug } = await params;
    const response = await goFetch(`/salons/${slug}`);

    if (response.status === 404) notFound();
    if (!response.ok) throw new Error("Failed to load salon");

    const business = await response.json();

    return (
        <MainLayout>
            <BusinessProfile business={business} />
        </MainLayout>
    )
}

export default ExploreBusinessPage
