import Link from "next/link"

function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          {/* Brand */}
          <div className="max-w-xs">
            <span className="text-xl font-black mb-4 block font-headline select-none">
              The <span className="text-primary">Beauty</span>App
            </span>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Connecting community talent with local beauty lovers. Built for South African salons.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div>
              <h5 className="font-bold mb-5 text-on-surface">Platform</h5>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/explore"
                    className="text-on-surface-variant hover:text-primary transition-colors duration-200"
                  >
                    Find a salon
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-business"
                    className="text-on-surface-variant hover:text-primary transition-colors duration-200"
                  >
                    For business
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-on-surface-variant hover:text-primary transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-5 text-on-surface">Legal</h5>
              <ul className="space-y-3">
                <li>
                  <span className="text-on-surface-variant/40 text-xs">Privacy policy — coming soon</span>
                </li>
                <li>
                  <span className="text-on-surface-variant/40 text-xs">Terms of service — coming soon</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-container-high flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-sm">© 2026 The Beauty App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
