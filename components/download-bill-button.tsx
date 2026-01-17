"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"
import { useEffect, useState } from "react"

export function DownloadBillButton({ billData, className, variant = "default" }: { billData: BillData; className?: string, variant?: "default" | "outline" | "secondary" | "ghost" }) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
            // Same regex as pdf-generator to be consistent
            if (/iPhone|iPad|iPod|Android/i.test(userAgent)) {
                setIsMobile(true)
            }
        }
        checkMobile()
    }, [])

    const handleDownload = () => {
        try {
            generateStandardBill(billData, "download")
        } catch (error) {
            console.error("Error downloading bill:", error)
            alert("Failed to download bill. Please try again.")
        }
    }

    if (!isMobile) {
        return null
    }

    return (
        <Button
            onClick={handleDownload}
            variant={variant}
            className={className || "w-full gap-2"}
        >
            <Download size={18} />
            <span className="sr-only">Save</span>
        </Button>
    )
}
