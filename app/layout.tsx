import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { InactivityProvider } from "@/components/auth/inactivity-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "STORIX - Shop & Warehouse Management",
  description: "Modern shop and warehouse management system by RAJ AGENCY",
  // icons: {
  //   icon: [
  //     {
  //       url: "",
  //       media: "",
  //     },
  //     {
  //       url: "",
  //       media: "",
  //     },
  //     {
  //       url: "",
  //       type: "",
  //     },
  //   ],
  //   apple: "",
  // },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-sm`}>
        <InactivityProvider>{children}</InactivityProvider>
        <Analytics />
      </body>
    </html>
  )
}
