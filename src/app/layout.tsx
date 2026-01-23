import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://entrybot.sidattech.com"),
  title: "EntryBot - Document Processing",
  description: "Manual entry application for sales and purchase invoices",
  icons: {
    icon: "/images/sidatLogo.jpeg",
  },
  openGraph: {
    title: "EntryBot - Document Processing",
    description: "Manual entry application for sales and purchase invoices",
    url: "https://entrybot.sidattech.com",
    siteName: "EntryBot",
    images: [
      {
        url: "/images/sidatLogo.jpeg",
        width: 800,
        height: 600,
        alt: "EntryBot Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EntryBot - Document Processing",
    description: "Manual entry application for sales and purchase invoices",
    images: ["/images/sidatLogo.jpeg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider session={session}>
          {children}
          <Toaster richColors position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
