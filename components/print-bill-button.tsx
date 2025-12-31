"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"

export function PrintBillButton({ billData, className, variant = "default" }: { billData: BillData; className?: string, variant?: "default" | "outline" | "secondary" | "ghost" }) {
    const handlePrint = () => {
        try {
            generateStandardBill(billData, "print")
        } catch (error) {
            console.error("Error printing bill:", error)
            alert("Failed to print bill. Please try again.")
        }
    }

    return (
        <Button
            onClick={handlePrint}
            variant={variant}
            className={className || "w-full gap-2"}
        >
            <Printer size={18} />
            Print PDF
        </Button>
    )
}
