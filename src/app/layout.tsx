import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FamilyMembersProvider } from "@/contexts/FamilyMembersContext";
import { HiddenBalanceProvider } from "@/contexts/HiddenBalanceContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Dompet Keluarga",
  description: "Pencatatan keuangan keluarga bersama",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dompet Keluarga",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Jalankan sebelum render untuk cegah flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('colorScheme') || 'system';
                var dark = s === 'dark' || (s === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
                var c = localStorage.getItem('primaryColor');
                if (c) {
                  document.documentElement.style.setProperty('--primary', c);
                  document.documentElement.style.setProperty('--ring', c);
                  document.documentElement.style.setProperty('--sidebar-primary', c);
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} bg-gray-50 text-gray-900 antialiased`}
      >
        <ThemeProvider>
          <HiddenBalanceProvider>
            <FamilyMembersProvider>
              <div className="mx-auto max-w-[448px] min-h-screen relative bg-background shadow-sm">
                {children}
              </div>
            </FamilyMembersProvider>
          </HiddenBalanceProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#18181b",
                color: "#fff",
                fontSize: "14px",
                borderRadius: "12px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
