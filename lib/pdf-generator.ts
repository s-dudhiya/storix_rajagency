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

// Theme Colors (Warm Industrial)
const THEME = {
  primary: [165, 95, 40] as [number, number, number], // Warm Bronze
  secondary: [250, 248, 245] as [number, number, number], // Warm Paper
  text: [60, 50, 45] as [number, number, number], // Dark Warm Grey
  textLight: [120, 110, 100] as [number, number, number], // Muted Warm Grey
  border: [200, 190, 180] as [number, number, number], // Soft Warm Border
}

export function generateStandardBill(data: BillData, action: "download" | "print" = "print"): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // --- Header Section ---
  doc.setFontSize(28)
  doc.setTextColor(THEME.primary[0], THEME.primary[1], THEME.primary[2])
  doc.setFont("helvetica", "bold")
  doc.text("RAJ AGENCY", 15, yPos)

  doc.setFontSize(10)
  doc.setTextColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
  doc.setFont("helvetica", "bold")
  doc.text("Wholesaler in Quality Products", 15, yPos + 6)

  // Invoice Details (Top Right)
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.setFontSize(20)
  doc.text("INVOICE", pageWidth - 15, yPos, { align: "right" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`#${data.bill_number}`, pageWidth - 15, yPos + 6, { align: "right" })
  doc.text(new Date(data.bill_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }), pageWidth - 15, yPos + 11, { align: "right" })

  yPos += 20

  // --- Separator ---
  doc.setDrawColor(THEME.primary[0], THEME.primary[1], THEME.primary[2])
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)
  yPos += 10

  // --- Customer & Shop Info ---
  const leftColX = 15
  const labelWidth = 35

  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.setFontSize(10)

  // Customer Name
  doc.setFont("helvetica", "bold")
  doc.text("Customer Name:", leftColX, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(data.customer_name, leftColX + labelWidth, yPos)
  yPos += 6

  // Shop Name
  if (data.shop_name) {
    doc.setFont("helvetica", "bold")
    doc.text("Shop Name:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(data.shop_name, leftColX + labelWidth, yPos)
    yPos += 6
  }

  // Phone
  if (data.phone) {
    doc.setFont("helvetica", "bold")
    doc.text("Phone Number:", leftColX, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(`+91 ${data.phone}`, leftColX + labelWidth, yPos)
    yPos += 6
  }

  yPos += 10

  // --- Items Table ---
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.item_name,
    item.quantity.toString(),
    item.price.toFixed(2),
    item.total.toFixed(2),
  ])

  // Ensure minimum rows for look
  const minRows = 8
  if (tableData.length < minRows) {
    for (let i = tableData.length; i < minRows; i++) {
      tableData.push(["", "", "", "", ""])
    }
  }

  autoTable(doc, {
    startY: yPos,
    head: [["S.No", "Item Description", "Qty", "Rate", "Amount"]],
    body: tableData,
    theme: "plain", // Custom styling
    headStyles: {
      fillColor: THEME.primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: THEME.text,
      cellPadding: 3,
      lineColor: THEME.border,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 35, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: THEME.secondary,
    },
    didParseCell: (data) => {
      // Remove borders for cleaner look if desired, or keep them light
      if (data.section === 'body' && data.row.index >= 0) {
        data.cell.styles.lineWidth = 0.1;
        data.cell.styles.lineColor = THEME.border;
      }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  // --- Totals Section ---
  const rightMargin = pageWidth - 15
  const totalLabelX = rightMargin - 40
  const totalValueX = rightMargin

  // Draw line above totals
  doc.setDrawColor(THEME.border[0], THEME.border[1], THEME.border[2])
  doc.setLineWidth(0.1)
  doc.line(totalLabelX - 20, yPos, rightMargin, yPos)
  yPos += 6

  doc.setFontSize(10)

  // Total Amount
  // Calculate Subtotal and Round Off
  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const roundOff = data.total_amount - subtotal

  // Subtotal
  yPos += 4
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Sub Total:", totalLabelX, yPos, { align: "right" })
  doc.text(`${subtotal.toFixed(2)}`, totalValueX, yPos, { align: "right" })

  // Round Off
  yPos += 5
  doc.text("Round Off:", totalLabelX, yPos, { align: "right" })
  doc.text(`${roundOff > 0 ? "+" : ""}${roundOff.toFixed(2)}`, totalValueX, yPos, { align: "right" })

  // Total Amount
  yPos += 8
  doc.setTextColor(THEME.primary[0], THEME.primary[1], THEME.primary[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Total:", totalLabelX, yPos, { align: "right" })
  doc.text(`Rs. ${data.total_amount.toFixed(2)}`, totalValueX, yPos, { align: "right" })

  yPos += 15

  // --- Amount in Words ---
  const amountInWords = numberToWords(Math.floor(data.total_amount))
  const paise = Math.round((data.total_amount - Math.floor(data.total_amount)) * 100)
  const fullAmountInWords =
    amountInWords + " Rupees" + (paise > 0 ? " and " + numberToWords(paise) + " Paise" : "") + " Only"

  doc.setFillColor(THEME.secondary[0], THEME.secondary[1], THEME.secondary[2])
  doc.roundedRect(15, yPos, pageWidth - 30, 16, 2, 2, "F")

  doc.setFontSize(9)
  doc.setTextColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
  doc.setFont("helvetica", "bold")
  doc.text("Amount in Words:", 20, yPos + 6)

  doc.setFontSize(10)
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.setFont("helvetica", "italic")
  doc.text(fullAmountInWords, 20, yPos + 12)

  // --- Footer ---
  const footerY = pageHeight - 30

  // Terms
  doc.setFontSize(8)
  doc.setTextColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
  doc.setFont("helvetica", "bold")
  doc.text("Terms & Conditions:", 15, footerY)
  doc.setFont("helvetica", "normal")
  doc.text("1. Goods once sold will not be taken back.", 15, footerY + 5)
  doc.text("2. Disputes subject to local jurisdiction.", 15, footerY + 9)

  // Signatory
  doc.setFontSize(9)
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.setFont("helvetica", "bold")
  doc.text("For RAJ AGENCY", pageWidth - 15, footerY, { align: "right" })

  // Signature Line
  doc.setDrawColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
  doc.line(pageWidth - 55, footerY + 15, pageWidth - 15, footerY + 15)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Authorized Signatory", pageWidth - 15, footerY + 20, { align: "right" })

  // Thank You
  doc.setFontSize(8)
  doc.setTextColor(THEME.primary[0], THEME.primary[1], THEME.primary[2])
  doc.setFont("helvetica", "bold")
  doc.text("THANK YOU FOR YOUR BUSINESS", pageWidth / 2, pageHeight - 10, { align: "center" })

  // --- File Saving ---
  const namePrefix = data.shop_name || data.customer_name || "Bill"
  const sanitizedPrefix = namePrefix.replace(/[^a-zA-Z0-9]/g, "_")
  const sanitizedBillNo = data.bill_number.replace(/[^a-zA-Z0-9]/g, "_")
  const fileName = `${sanitizedPrefix}_${sanitizedBillNo}`

  doc.setProperties({
    title: fileName,
    subject: `Bill ${data.bill_number}`,
    author: "Raj Agency",
    creator: "Raj Agency Billing System",
  })

  if (action === "print") {
    const blob = doc.output("blob")
    const blobUrl = URL.createObjectURL(blob)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      window.open(blobUrl, "_blank")
    } else {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { margin: 0; padding: 0; overflow: hidden; height: 100vh; }
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <iframe id="pdfFrame" src="${blobUrl}"></iframe>
              <script>
                const iframe = document.getElementById('pdfFrame');
                iframe.onload = function() {
                  setTimeout(function() {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  } else {
    doc.save(`${fileName}.pdf`)
  }
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
  let yPos = 20

  // Title
  doc.setFontSize(22)
  doc.setTextColor(THEME.primary[0], THEME.primary[1], THEME.primary[2])
  doc.setFont("helvetica", "bold")
  doc.text("INVENTORY REPORT", 15, yPos)

  doc.setFontSize(10)
  doc.setTextColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
  doc.setFont("helvetica", "normal")
  doc.text("RAJ AGENCY", 15, yPos + 6)

  yPos += 15

  // Meta Info
  const date = new Date(data.generated_at)
  doc.setFontSize(10)
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2])
  doc.text(`Generated: ${date.toLocaleString("en-IN")}`, 15, yPos)
  doc.text(`Total Products: ${data.items.length}`, pageWidth - 15, yPos, { align: "right" })

  yPos += 10

  // Table
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.product_name,
    item.brand_name,
    item.stock_quantity.toString(),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["SR No", "Product", "Brand", "Stock"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: THEME.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: THEME.text,
      cellPadding: 3,
      lineColor: THEME.border,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "left", cellWidth: 50 },
      3: { halign: "center", cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: THEME.secondary,
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(8)
      doc.setTextColor(THEME.textLight[0], THEME.textLight[1], THEME.textLight[2])
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
        align: "center",
      })
    },
  })

  // Save the PDF
  const fileName = `inventory-report-${date.toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
