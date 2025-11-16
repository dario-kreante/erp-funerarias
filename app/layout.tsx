import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Funerarias",
  description: "Sistema de gestión para funerarias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
