import { Reem_Kufi } from 'next/font/google';
import Link from "next/link";

const fontType = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['400', '700'],
});

export default function Footer() {
  return (
    <footer dir="rtl" className="bg-base-200 text-base-content w-full border-t border-base-300">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            {/* Logo / Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                dir="rtl"
                href="/" 
                className={`text-xl font-bold tracking-tight text-base-content ${fontType.className}`}
              >
                مصطفى<span className="text-primary">.</span>
              </Link>
            </div>
            <p className="mt-4 text-sm text-base-content/70">
              بناء حلول مبتكرة للويب الحديث بسرعة ودقة. 
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content">الحلول</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">التسويق</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">التحليلات</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">تجارة</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content">الدعم</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">التوثيق</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content">الموقع</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">عن الموقع</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-base-content/80">مدونة</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-base-300 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-base-content/60">&copy; جميع الحقوق محفوظة لدى مصطفى لعام 2026</p>
          <div className="flex space-x-6 text-xs text-base-content/60">
            <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
