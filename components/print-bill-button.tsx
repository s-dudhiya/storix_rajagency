"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"

export function PrintBillButton({ billData, className }: { billData: BillData; className?: string }) {
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
            className={className || "w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"}
        >
            <Printer size={18} />
            Print PDF
        </Button>
    )
}
