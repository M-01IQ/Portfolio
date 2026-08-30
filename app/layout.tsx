import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./(main)/globals.css";
import { ToastProvider } from "@/components/ui/PopUp/ToastContext";
import { ConfirmProvider } from "@/components/ui/PopUp/ConfirmContext";

//Metadata
import { defaultMetadata } from '@/config/site'
export const metadata = defaultMetadata
//RootLayout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
