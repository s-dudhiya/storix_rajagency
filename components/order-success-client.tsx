"use client"

import { Button } from "@/components/ui/button"
import { Printer, Eye, Plus, Download } from "lucide-react"
import Link from "next/link"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_type: string
  price: number
  total: number
  shop_items?: {
    brand_name: string
    product_name: string
  }
}

interface OrderData {
  id: string
  order_date: string
  order_status: string
  total_amount: number
  customers?: {
    name: string
    shop_name: string
    phone: string
  }
  created_by_user?: {
    full_name: string
  }
  order_items: OrderItem[]
  bills?: Array<{
    bill_number: string
  }>
}

export function OrderSuccessClient({ orderData, role }: { orderData: OrderData; role: "owner" | "labour" }) {
  const handlePrintBill = () => {
    try {
      const billNumber = orderData.bills?.[0]?.bill_number || `ORD-${orderData.id.slice(0, 8)}`
      const billData: BillData = {
        bill_number: billNumber,
        bill_date: orderData.order_date,
        customer_name: orderData.customers?.name || "N/A",
        shop_name: orderData.customers?.shop_name || undefined,
        phone: orderData.customers?.phone || undefined,
        items: orderData.order_items.map((item) => ({
          item_name: item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown",
          quantity: item.quantity,
          unit_type: item.unit_type,
          price: item.price,
          total: item.total,
        })),
        total_amount: orderData.total_amount,
      }
      generateStandardBill(billData, "print")
    } catch (error) {
      console.error("Error printing bill:", error)
      alert("Failed to print bill. Please try again.")
    }
  }

  const handleDownloadBill = () => {
    try {
      const billNumber = orderData.bills?.[0]?.bill_number || `ORD-${orderData.id.slice(0, 8)}`
      const billData: BillData = {
        bill_number: billNumber,
        bill_date: orderData.order_date,
        customer_name: orderData.customers?.name || "N/A",
        shop_name: orderData.customers?.shop_name || undefined,
        phone: orderData.customers?.phone || undefined,
        items: orderData.order_items.map((item) => ({
          item_name: item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown",
          quantity: item.quantity,
          unit_type: item.unit_type,
          price: item.price,
          total: item.total,
        })),
        total_amount: orderData.total_amount,
      }
      generateStandardBill(billData, "download")
    } catch (error) {
      console.error("Error downloading bill:", error)
      alert("Failed to download bill. Please try again.")
    }
  }

  return (
    <main className="flex-1 md:ml-64 pb-20 md:pb-0 font-sans">
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between">
        <div className="flex flex-col justify-center h-full">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Order Confirmed</h1>
          <p className="text-xs font-medium text-muted-foreground hidden md:block">Your order has been successfully created</p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 ring-4 ring-green-500/5 shadow-sm animate-in zoom-in duration-300">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2 tracking-tight">Order Created Successfully!</h2>
          <p className="text-green-600/80 font-medium">
            Order <span className="font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded text-green-800">#{orderData.id.slice(0, 8)}</span> is ready to be processed
          </p>
        </div>

        {/* Invoice Preview Card */}
        <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
          {/* Invoice Header */}
          <div className="bg-muted/30 border-b border-border/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">Raj Agency</h3>
              <p className="text-xs text-muted-foreground mt-1">Invoice Preview</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-sm font-medium text-foreground">{new Date(orderData.order_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Invoice Body */}
          <div className="p-6 space-y-8">
            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Bill To</p>
                <p className="font-semibold text-foreground text-lg">{orderData.customers?.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.shop_name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.phone || "N/A"}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Order Details</p>
                <p className="text-sm text-foreground"><span className="text-muted-foreground">ID:</span> {orderData.id.slice(0, 8)}</p>
                <p className="text-sm text-foreground"><span className="text-muted-foreground">Items:</span> {orderData.order_items.length}</p>
                <p className="text-sm text-foreground"><span className="text-muted-foreground">Total:</span> Rs. {orderData.total_amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {orderData.order_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown"}
                        <span className="text-xs text-muted-foreground ml-1 font-normal">({item.unit_type})</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">Rs. {item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                        Rs. {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t border-border/50">
              <div className="flex gap-4 items-baseline">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</span>
                <span className="text-2xl font-bold text-primary tracking-tight">Rs. {orderData.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground italic">Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-center">Next Steps</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handlePrintBill}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 h-12 text-base"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Invoice
            </Button>
            <Button
              onClick={handleDownloadBill}
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary h-12 text-base"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            <Link href={`/${role}/orders`} className="w-full">
              <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50">
                <Eye className="mr-2 h-5 w-5" />
                View All Orders
              </Button>
            </Link>
            <Link href={`/${role}/take-order`} className="w-full">
              <Button variant="outline" className="w-full h-12 text-base border-border hover:bg-muted/50">
                <Plus className="mr-2 h-5 w-5" />
                Create New Order
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
