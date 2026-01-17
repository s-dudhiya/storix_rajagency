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
          total_amount: Math.round(total),
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

  const totalAmount = Math.round(items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    return sum + qty * price
  }, 0))

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Generate Bill</h1>
              <p className="text-xs font-medium text-muted-foreground hidden md:block">Create a new invoice manually</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4 hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Payable</p>
              <p className="text-xl font-bold text-primary tracking-tight">₹{totalAmount.toFixed(2)}</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check size={18} />
              <span className="hidden md:inline">{submitting ? "Processing..." : "Create Bill"}</span>
              <span className="md:hidden">{submitting ? "..." : "Save"}</span>
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Customer Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                  Customer Details
                </h2>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Customer Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="Enter name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Shop Name
                    </Label>
                    <Input
                      id="shopName"
                      placeholder="Enter shop name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="h-11 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                  Order Items
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="gap-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="group relative bg-card hover:bg-muted/20 border border-border/50 rounded-xl p-5 shadow-sm transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                      {/* Item Selection */}
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name <span className="text-primary">*</span></Label>
                        <Popover
                          open={openPopovers[index]}
                          onOpenChange={(open) => setOpenPopovers({ ...openPopovers, [index]: open })}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openPopovers[index]}
                              className="w-full h-11 justify-between font-normal text-left bg-muted/30 border-border/60 hover:bg-background hover:border-primary/40 focus:border-primary/40 transition-all"
                            >
                              <span className={cn("truncate", !item.item_name && "text-muted-foreground")}>
                                {item.item_name || "Select item..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
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
                                        <span className="truncate mr-2">
                                          {shopItem.brand_name} {shopItem.product_name}
                                        </span>
                                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
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

                        {/* Fallback input if needed, nicely tucked */}
                        <Input
                          placeholder="Or type manual name"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                          className="h-9 text-xs bg-transparent border-transparent hover:border-border/50 focus:border-primary/40 transition-all px-2 placeholder:text-muted-foreground/50"
                        />
                      </div>

                      {/* Qty, Unit, Price Group */}
                      <div className="md:col-span-6 grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty <span className="text-primary">*</span></Label>
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
                            className="h-11 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all font-medium text-center"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</Label>
                          <select
                            className="w-full h-11 px-3 bg-muted/30 border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                            value={item.unit_type}
                            onChange={(e) => handleItemChange(index, "unit_type", e.target.value)}
                          >
                            <option value="piece">Pcs</option>
                            <option value="carton">Box</option>
                            <option value="kg">KG</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price <span className="text-primary">*</span></Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
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
                              className="h-11 pl-7 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40 transition-all font-medium text-right"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remove Button & Total */}
                      <div className="md:col-span-1 flex flex-col justify-between items-end py-1">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                        <div className="bg-primary/5 px-2 py-1 rounded text-right w-full md:w-auto mt-2 md:mt-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                          <p className="text-sm font-bold text-primary">
                            ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Mobile Footer for Total & Action */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-30 flex items-center justify-between gap-4 shadow-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Payable</p>
                <p className="text-xl font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="shadow-lg shadow-primary/20 bg-primary text-primary-foreground rounded-full px-6"
                size="lg"
              >
                {submitting ? "..." : "Create Bill"}
              </Button>
            </div>

          </form>
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
