import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import { DataSyncProvider } from "@/context/DataSyncContext";

export const metadata: Metadata = {
  title: "Ananta Hike",
  description: "Book your mountain hiking adventure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <BookingProvider>
            <DataSyncProvider>{children}</DataSyncProvider>
          </BookingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
