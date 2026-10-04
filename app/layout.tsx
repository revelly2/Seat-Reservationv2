import "./globals.css";
import React from "react";

export const metadata = {
  title: "Sotero — Seat Reservation System | Concrete Poster Edition",
  description: "High-concurrency seat reservation system built with Next.js, Supabase, and Brutalist Concrete Poster design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#D7D5CF] text-[#161616] min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
