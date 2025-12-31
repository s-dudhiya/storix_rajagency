"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShopItem {
  id: string
  brand_name: string
  product_name: string
  selling_price: number
}

export default function GenerateBillPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({})

  const [customerName, setCustomerName] = useState("")
  const [shopName, setShopName] = useState("")
  const [phone, setPhone] = useState("")
  const [items, setItems] = useState([{ item_name: "", quantity: "1", unit_type: "piece", price: "" as any }])

  useEffect(() => {
    fetchShopItems()
  }, [])

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
    setItems([...items, { item_name: "", quantity: "1", unit_type: "piece", price: "" as any }])
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
    setOpenPopovers({ ...openPopovers, [index]: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const total = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      return sum + qty * price
    }, 0)

    try {
      const response = await fetch("/api/owner/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          shop_name: shopName,
          phone: phone,
          items: items.map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
          })),
          total_amount: total,
        }),
      })

      if (response.ok) {
        alert("Bill created successfully!")
        router.push("/owner/bills")
      }
    } catch (error) {
      console.error("Failed to create bill:", error)
      alert("Failed to create bill")
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + qty * price
  }, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:p-6 md:sticky md:top-0 md:z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft size={18} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Generate Bill</h1>
              <p className="text-sm text-muted-foreground mt-1">Create a new manual bill</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium mb-2 block">
                    Customer Name*
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shopName" className="text-sm font-medium mb-2 block">
                    Shop Name
                  </Label>
                  <Input
                    id="shopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                    Phone
                  </Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Items</h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="gap-2 bg-transparent"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="md:col-span-5">
                      <Label className="text-sm mb-2 block">Item Name*</Label>
                      <Popover
                        open={openPopovers[index]}
                        onOpenChange={(open) => setOpenPopovers({ ...openPopovers, [index]: open })}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPopovers[index]}
                            className="w-full h-12 justify-between font-normal text-left bg-transparent"
                          >
                            <span className={cn("truncate", !item.item_name && "text-muted-foreground")}>
                              {item.item_name || "Search or select item..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search shop items..." />
                            <CommandList>
                              <CommandEmpty>No items found.</CommandEmpty>
                              <CommandGroup>
                                {shopItems.map((shopItem) => (
                                  <CommandItem
                                    key={shopItem.id}
                                    value={`${shopItem.brand_name} ${shopItem.product_name}`}
                                    onSelect={() => handleSelectShopItem(shopItem, index)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        item.item_name === `${shopItem.brand_name} ${shopItem.product_name}`
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex-1 flex justify-between items-center">
                                      <span>
                                        {shopItem.brand_name} {shopItem.product_name}
                                      </span>
                                      <span className="text-sm font-semibold text-primary ml-4">
                                        ₹{shopItem.selling_price}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        placeholder="Or type custom item name"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                        className="h-10 mt-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm mb-2 block">Quantity*</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "" || val === "0") {
                            handleItemChange(index, "quantity", "")
                          } else {
                            handleItemChange(index, "quantity", val.replace(/^0+/, ""))
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = ""
                        }}
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm mb-2 block">Unit*</Label>
                      <select
                        className="w-full h-12 px-4 bg-input border border-border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-ring"
                        value={item.unit_type}
                        onChange={(e) => handleItemChange(index, "unit_type", e.target.value)}
                      >
                        <option value="piece">Piece</option>
                        <option value="carton">Carton</option>
                        <option value="kg">KG</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm mb-2 block">Price*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "" || val === "0") {
                            handleItemChange(index, "price", "")
                          } else {
                            handleItemChange(index, "price", val.replace(/^0+(?=\d)/, ""))
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = ""
                        }}
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <div className="md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-12 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    )}
                    <div className="md:col-span-12 pt-2 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Total:</span>
                        <span className="font-semibold">
                          ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={submitting} className="flex-1 h-12 text-base">
                {submitting ? "Creating Bill..." : "Create Bill"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 px-8 text-base">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
