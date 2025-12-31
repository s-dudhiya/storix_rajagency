"use client"

import { Button } from "@/components/ui/button"
import { Printer, Eye, Plus } from "lucide-react"
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

  return (
    <main className="flex-1 md:ml-64 pb-20 md:pb-0">
      <div className="bg-card border-b border-border p-4 md:p-6 sticky top-0 z-40">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Order Confirmed</h1>
        <p className="text-sm text-muted-foreground mt-1">Your order has been successfully created</p>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full mb-3">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">Order Created Successfully!</h2>
          <p className="text-sm text-green-800 dark:text-green-300">
            Order #{orderData.id.slice(0, 8)} is ready to be processed
          </p>
        </div>

        {/* Invoice Preview Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Invoice Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Raj Agency</h1>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Invoice</p>
                <p className="text-lg font-bold">#{orderData.id.slice(0, 8)}</p>
              </div>
            </div>
            <p className="text-sm opacity-90">{new Date(orderData.order_date).toLocaleDateString()}</p>
          </div>

          {/* Invoice Body */}
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Bill To</p>
                <p className="font-bold text-foreground">{orderData.customers?.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.shop_name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Ship To</p>
                <p className="font-bold text-foreground">{orderData.customers?.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.shop_name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{orderData.customers?.phone || "N/A"}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.order_items.map((item, idx) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {item.shop_items ? `${item.shop_items.brand_name} ${item.shop_items.product_name}` : "Unknown"}
                        <span className="text-xs text-muted-foreground ml-2">({item.unit_type})</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground">Rs. {item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        Rs. {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-foreground">Rs. {orderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <Button
            onClick={handlePrintBill}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Printer size={18} />
            Print PDF
          </Button>
          <Link href={`/${role}/orders`} className="flex">
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <Eye size={18} />
              View Orders
            </Button>
          </Link>
          <Link href={`/${role}/take-order`} className="flex">
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <Plus size={18} />
              New Order
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
