"use client"

import type React from "react"
import { generateStandardBill, type BillData } from "@/lib/pdf-generator"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Printer, Trash2, Eye, Search } from "lucide-react"
import { DownloadBillButton } from "@/components/download-bill-button"
import { useRouter } from "next/navigation"

interface BillItem {
  id: string
  item_name: string
  quantity: number
  unit_type: string
  price: number
  total: number
}

interface Bill {
  id: string
  bill_number: string
  customer_name: string
  shop_name: string
  phone: string
  bill_date: string
  total_amount: number
  bill_type: "app_order" | "manual_entry"
  bill_items: BillItem[]
}

interface ShopItem {
  id: string
  brand_name: string
  product_name: string
  selling_price: number
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [customerName, setCustomerName] = useState("")
  const [shopName, setShopName] = useState("")
  const [phone, setPhone] = useState("")
  const [items, setItems] = useState([{ item_name: "", quantity: 1, unit_type: "piece", price: undefined as any }])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")

  // State for view bill dialog
  const [viewBillDialogOpen, setViewBillDialogOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  // State for shop item selection
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)

  const router = useRouter()

  useEffect(() => {
    fetchBills()
    fetchShopItems()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/owner/bills")
      if (response.ok) {
        const data = await response.json()
        setBills(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch bills:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchShopItems = async () => {
    try {
      const response = await fetch("/api/owner/shop-items")
      if (response.ok) {
        const data = await response.json()
        setShopItems(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch shop items:", error)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { item_name: "", quantity: 1, unit_type: "piece", price: undefined as any }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSelectShopItem = (shopItem: ShopItem, index: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      item_name: `${shopItem.brand_name} ${shopItem.product_name}`,
      price: shopItem.selling_price,
    }
    setItems(newItems)
    setShowItemSelector(false)
    setCurrentItemIndex(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    try {
      const response = await fetch("/api/owner/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          shop_name: shopName,
          phone: phone,
          items,
          total_amount: total,
        }),
      })

      if (response.ok) {
        alert("Bill created successfully!")
        setIsDialogOpen(false)
        setCustomerName("")
        setShopName("")
        setPhone("")
        setItems([{ item_name: "", quantity: 1, unit_type: "piece", price: undefined as any }])
        fetchBills()
      }
    } catch (error) {
      console.error("[v0] Failed to create bill:", error)
      alert("Failed to create bill")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintBill = (bill: Bill) => {
    const billData: BillData = {
      bill_number: bill.bill_number,
      bill_date: bill.bill_date,
      customer_name: bill.customer_name,
      shop_name: bill.shop_name || undefined,
      phone: bill.phone || undefined,
      items: bill.bill_items.map((item) => ({
        item_name: item.item_name,
        quantity: item.quantity,
        unit_type: item.unit_type,
        price: item.price,
        total: item.total,
      })),
      total_amount: bill.total_amount,
    }
    generateStandardBill(billData, "print")
  }



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return

    try {
      const response = await fetch(`/api/owner/bills/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchBills()
      }
    } catch (error) {
      console.error("[v0] Failed to delete bill:", error)
    }
  }

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill)
    setViewBillDialogOpen(true)
  }

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      searchQuery === "" ||
      bill.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDate =
      selectedDate === "" ||
      new Date(bill.bill_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()

    return matchesSearch && matchesDate
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Bills</h1>
            <p className="text-xs font-medium text-muted-foreground hidden md:block">Manage and generate invoices</p>
          </div>
          <Button
            onClick={() => router.push("/owner/generate-bill")}
            className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Generate Bill</span>
            <span className="md:hidden">New Bill</span>
          </Button>
        </div>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search by customer, shop, or bill number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all"
                />
                {(searchQuery || selectedDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedDate("")
                    }}
                    className="border-dashed"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Loading bills...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 border-2 border-dashed border-border/50 rounded-xl">
                <div className="h-14 w-14 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground">No bills found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new bill</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="group bg-card hover:bg-muted/20 border border-border/50 rounded-xl p-5 hover:shadow-md transition-all duration-300 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-mono font-bold text-foreground text-lg tracking-tight">{bill.bill_number}</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${bill.bill_type === "app_order"
                              ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50"
                              : "bg-purple-100/50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200/50"
                              }`}
                          >
                            {bill.bill_type === "app_order" ? "App Order" : "Manual"}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {bill.customer_name}
                          </p>
                          <span className="hidden sm:inline text-muted-foreground/40">•</span>
                          <p className="text-muted-foreground font-medium">{bill.shop_name || "No shop linked"}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          {new Date(bill.bill_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Amount</p>
                          <p className="text-2xl font-bold text-primary tracking-tight">₹{bill.total_amount.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)} className="flex-1 sm:flex-none gap-2 h-9 border-border/60 hover:bg-background hover:border-primary/30 hover:text-primary transition-all">
                            <Eye size={15} />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePrintBill(bill)} className="h-9 w-9 p-0 border-border/60 hover:bg-background hover:border-foreground/30 transition-all" title="Print">
                            <Printer size={15} />
                          </Button>
                          <div className="h-9">
                            <DownloadBillButton
                              billData={{
                                bill_number: bill.bill_number,
                                bill_date: bill.bill_date,
                                customer_name: bill.customer_name,
                                shop_name: bill.shop_name || undefined,
                                phone: bill.phone || undefined,
                                items: bill.bill_items.map((item) => ({
                                  item_name: item.item_name,
                                  quantity: item.quantity,
                                  unit_type: item.unit_type,
                                  price: item.price,
                                  total: item.total,
                                })),
                                total_amount: bill.total_amount,
                              }}
                              variant="outline"
                              className="h-full w-9 p-0 border-border/60 hover:bg-background hover:border-foreground/30 transition-all"
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(bill.id)}
                            className="h-9 w-9 p-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            }
          </div>
        </div>
      </main>
      <MobileNav role="owner" />

      <Dialog open={viewBillDialogOpen} onOpenChange={setViewBillDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">Raj Agency</h2>
                <p className="text-sm text-muted-foreground mt-1">BILL</p>
              </div>

              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill No:</p>
                  <p className="font-medium">{selectedBill.bill_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date:</p>
                  <p className="font-medium">{new Date(selectedBill.bill_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-semibold mb-2">Bill To:</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{selectedBill.customer_name}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Shop:</span>{" "}
                    <span className="font-medium">{selectedBill.shop_name || "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <span className="font-medium">{selectedBill.phone || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="text-left p-3">Item</th>
                      <th className="text-center p-3">Unit</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedBill.bill_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">{item.item_name}</td>
                        <td className="text-center p-3">{item.unit_type}</td>
                        <td className="text-center p-3">{item.quantity || 0}</td>
                        <td className="text-right p-3">₹{(item.price || 0).toFixed(2)}</td>
                        <td className="text-right p-3">₹{(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{selectedBill.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                Thank you for your business!
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={() => handlePrintBill(selectedBill)} className="flex-1 gap-2">
                  <Printer size={16} />
                  Print PDF
                </Button>
                <DownloadBillButton
                  billData={{
                    bill_number: selectedBill.bill_number,
                    bill_date: selectedBill.bill_date,
                    customer_name: selectedBill.customer_name,
                    shop_name: selectedBill.shop_name || undefined,
                    phone: selectedBill.phone || undefined,
                    items: selectedBill.bill_items.map((item) => ({
                      item_name: item.item_name,
                      quantity: item.quantity,
                      unit_type: item.unit_type,
                      price: item.price,
                      total: item.total,
                    })),
                    total_amount: selectedBill.total_amount,
                  }}
                  variant="outline"
                  className="flex-1 gap-2"
                />
                <Button variant="outline" onClick={() => setViewBillDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shop Item Selector Dialog */}
      <Dialog open={showItemSelector} onOpenChange={setShowItemSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Shop Item</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {shopItems.map((shopItem) => (
              <button
                key={shopItem.id}
                type="button"
                onClick={() => currentItemIndex !== null && handleSelectShopItem(shopItem, currentItemIndex)}
                className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {shopItem.brand_name} {shopItem.product_name}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">₹{shopItem.selling_price.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}