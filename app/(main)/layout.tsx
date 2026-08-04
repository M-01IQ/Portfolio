import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ToastProvider } from "@/components/ui/PopUp/ToastContext";
import { ConfirmProvider } from "@/components/ui/PopUp/ConfirmContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Navbar />
              {children}
              <Footer />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
    </div>
  );
}
