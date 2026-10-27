import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ToastProvider } from "@/components/ui/PopUp/ToastContext";
import { ConfirmProvider } from "@/components/ui/PopUp/ConfirmContext";
import OfflineAlert from "@/components/shared/OfflineAlert";
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
              <OfflineAlert />
              {children}
              <Footer />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
    </div>
  );
}
