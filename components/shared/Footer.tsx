export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 w-full">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <span className="text-xl font-bold text-white">𝙼𝚄𝚂𝚃𝙰𝙵𝙰</span>
            <p className="mt-4 text-sm text-gray-400">
              Building innovative solutions for the modern web with speed and precision.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Solutions</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Marketing</a></li>
              <li><a href="#" className="hover:text-white transition">Analytics</a></li>
              <li><a href="#" className="hover:text-white transition">Commerce</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition">Guides</a></li>
              <li><a href="#" className="hover:text-white transition">API Status</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Jobs</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">&copy; 2026 BrandName, Inc. All rights reserved.</p>
          <div className="flex space-x-6 text-xs text-gray-400">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
