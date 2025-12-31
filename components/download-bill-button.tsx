"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"

export function DownloadBillButton({ billData, className, variant = "default" }: { billData: BillData; className?: string, variant?: "default" | "outline" | "secondary" | "ghost" }) {
    const handleDownload = () => {
        try {
            generateStandardBill(billData, "download")
        } catch (error) {
            console.error("Error downloading bill:", error)
            alert("Failed to download bill. Please try again.")
        }
    }

    return (
        <Button
            onClick={handleDownload}
            variant={variant}
            className={className || "w-full gap-2"}
        >
            <Download size={18} />
            Download PDF
        </Button>
    )
}
