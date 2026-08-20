import { Suspense } from 'react'
import Explore from '@/components/explore'
import MainLayout from '@/components/main-layout'

function ExplorePage() {
    return (
        <MainLayout>
            <Suspense>
                <Explore />
            </Suspense>
        </MainLayout>
    )
}

export default ExplorePage
