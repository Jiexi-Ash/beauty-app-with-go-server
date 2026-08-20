import Footer from "./footer"
import Navbar from "./navbar"

function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 w-full mx-auto py-4 px-6 max-w-[1440px]">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default MainLayout
