import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { InactivityProvider } from "@/components/auth/inactivity-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

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
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <InactivityProvider>{children}</InactivityProvider>
        <Analytics />
      </body>
    </html>
  )
}
