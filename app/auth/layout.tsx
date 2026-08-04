export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* هنا لا توجد Navbar ولا Footer */}
      {children}
    </div>
  );
}
