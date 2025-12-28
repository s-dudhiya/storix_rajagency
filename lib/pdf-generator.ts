import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Convert number to words for Indian numbering system
function numberToWords(num: number): string {
  if (num === 0) return "Zero"

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertLessThanThousand(n: number): string {
    if (n === 0) return ""

    let result = ""

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred "
      n %= 100
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " "
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + " "
      return result
    }

    if (n > 0) {
      result += ones[n] + " "
    }

    return result
  }

  if (num < 0) return "Minus " + numberToWords(Math.abs(num))

  // Handle Indian numbering: Crore, Lakh, Thousand, Hundred
  let result = ""
  const crore = Math.floor(num / 10000000)
  num %= 10000000

  const lakh = Math.floor(num / 100000)
  num %= 100000

  const thousand = Math.floor(num / 1000)
  num %= 1000

  if (crore > 0) {
    result += convertLessThanThousand(crore) + "Crore "
  }

  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + "Lakh "
  }

  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + "Thousand "
  }

  if (num > 0) {
    result += convertLessThanThousand(num)
  }

  return result.trim()
}

export interface BillItem {
  item_name: string
  quantity: number
  unit_type: string
  price: number
  total: number
}

export interface BillData {
  bill_number: string
  bill_date: string
  customer_name: string
  shop_name?: string
  phone?: string
  items: BillItem[]
  total_amount: number
}

export function generateStandardBill(data: BillData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15

  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("RAJ AGENCY", pageWidth / 2, yPos, { align: "center" })
  yPos += 6

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Your Trusted Partner in Quality Products", pageWidth / 2, yPos, { align: "center" })
  yPos += 10

  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)
  yPos += 8

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("TAX INVOICE", 15, yPos)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Bill No: ${data.bill_number}`, pageWidth - 15, yPos, { align: "right" })
  doc.text(`Date: ${new Date(data.bill_date).toLocaleDateString("en-IN")}`, pageWidth - 15, yPos + 5, {
    align: "right",
  })
  yPos += 15

  doc.setFillColor(245, 245, 245)
  doc.rect(15, yPos, pageWidth - 30, 20, "F")
  doc.setDrawColor(200, 200, 200)
  doc.rect(15, yPos, pageWidth - 30, 20, "S")

  yPos += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO:", 18, yPos)

  doc.setFont("helvetica", "normal")
  yPos += 5
  doc.text(`Name: ${data.customer_name}`, 18, yPos)
  if (data.shop_name) {
    yPos += 4
    doc.text(`Shop: ${data.shop_name}`, 18, yPos)
  }
  if (data.phone) {
    yPos += 4
    doc.text(`Phone: ${data.phone}`, 18, yPos)
  }
  yPos += 10

  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.item_name,
    item.unit_type.toUpperCase(),
    item.quantity.toString(),
    item.price.toFixed(2),
    item.total.toFixed(2),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["S.No", "Item Description", "Unit", "Qty", "Rate", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "left", cellWidth: 60 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "center", cellWidth: 20 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  const totalsTableData = [
    ["", "", "", "", "Sub Total:", data.total_amount.toFixed(2)],
    ["", "", "", "", "Grand Total:", data.total_amount.toFixed(2)],
  ]

  autoTable(doc, {
    startY: yPos,
    body: totalsTableData,
    theme: "plain",
    bodyStyles: {
      fontSize: 10,
      fontStyle: "bold",
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 35, fontSize: 11, textColor: [41, 128, 185] },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  const amountInWords = numberToWords(Math.floor(data.total_amount))
  const paise = Math.round((data.total_amount - Math.floor(data.total_amount)) * 100)
  const fullAmountInWords =
    amountInWords + " Rupees" + (paise > 0 ? " and " + numberToWords(paise) + " Paise" : "") + " Only"

  doc.setFillColor(245, 245, 245)
  doc.rect(15, yPos, pageWidth - 30, 12, "F")
  doc.setDrawColor(200, 200, 200)
  doc.rect(15, yPos, pageWidth - 30, 12, "S")

  yPos += 4
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("Amount in Words:", 18, yPos)

  yPos += 5
  doc.setFont("helvetica", "italic")
  doc.text(fullAmountInWords, 18, yPos)
  yPos += 10

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Terms & Conditions:", 15, yPos)
  yPos += 4
  doc.text("1. Goods once sold will not be taken back or exchanged", 15, yPos)
  yPos += 3
  doc.text("2. All disputes are subject to local jurisdiction only", 15, yPos)
  yPos += 8

  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("For RAJ AGENCY", pageWidth - 15, pageHeight - 20, { align: "right" })
  doc.line(pageWidth - 60, pageHeight - 15, pageWidth - 15, pageHeight - 15)
  doc.setFont("helvetica", "normal")
  doc.text("Authorized Signatory", pageWidth - 15, pageHeight - 10, { align: "right" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "bolditalic")
  doc.text("Thank You for Your Business!", pageWidth / 2, pageHeight - 10, { align: "center" })

  // Save the PDF
  doc.save(`bill-${data.bill_number}.pdf`)
}

export interface InventoryReportData {
  items: Array<{
    sr_no: number
    product_name: string
    brand_name: string
    stock_quantity: number
  }>
  generated_at: string
}

export function generateInventoryReport(data: InventoryReportData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Title
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("INVENTORY REPORT", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Company name
  doc.setFontSize(14)
  doc.text("RAJ AGENCY", pageWidth / 2, yPos, { align: "center" })
  yPos += 10

  // Date and Time
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const date = new Date(data.generated_at)
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
  doc.text(`Generated on: ${formattedDate} at ${formattedTime}`, pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Separator line
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)
  yPos += 8

  // Summary
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Total Products: ${data.items.length}`, 15, yPos)
  yPos += 10

  // Table data
  const tableData = data.items.map((item) => [
    item.sr_no.toString(),
    item.product_name,
    item.brand_name,
    item.stock_quantity.toString(),
  ])

  // Generate table with auto-pagination
  autoTable(doc, {
    startY: yPos,
    head: [["SR No", "Product", "Brand", "Stock"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 25 },
      1: { halign: "left", cellWidth: 70 },
      2: { halign: "left", cellWidth: 60 },
      3: { halign: "center", cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { top: 10, bottom: 15 },
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
        align: "center",
      })
    },
  })

  // Save the PDF
  const fileName = `inventory-report-${date.toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
