"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Search, Plus, Minus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrderItem {
  product_id: string
  product_name: string
  brand_name: string
  price: number
  unit_type: "piece" | "carton"
  quantity: number
}

interface Customer {
  id: string
  name: string
  shop_name: string
  phone: string
}

interface Product {
  id: string
  sr_no: number
  product_name: string
  brand_name: string
  selling_price: number
  stock_pieces: number
}

export default function TakeOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [customerPhone, setCustomerPhone] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingPrice, setEditingPrice] = useState<number>(0)
  const [newCustomer, setNewCustomer] = useState({ name: "", shop_name: "", area: "" })
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    brand_name: "",
    product_name: "",
    selling_price: 0,
  })

  useEffect(() => {
    if (step === 2) {
      fetchProducts()
    }
  }, [step])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/owner/shop-items")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch products:", error)
    }
  }

  const handleCustomerSearch = async () => {
    if (!customerPhone.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/owner/customers/search?phone=${encodeURIComponent(customerPhone)}`)

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setCustomer(data)
          setStep(2)
        } else {
          setShowNewCustomerForm(true)
        }
      }
    } catch (error) {
      console.error("[v0] Customer search failed:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.shop_name) {
      alert("Please fill in name and shop name")
      return
    }

    setSearching(true)
    try {
      const response = await fetch("/api/owner/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCustomer,
          phone: customerPhone,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setShowNewCustomerForm(false)
        setStep(2)
      }
    } catch (error) {
      console.error("[v0] Customer creation failed:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    const price = product.selling_price || 0
    const existing = cartItems.findIndex((item) => item.product_id === product.id)

    if (existing !== -1) {
      const updatedCart = [...cartItems]
      updatedCart[existing].quantity += 1
      setCartItems(updatedCart)
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          product_name: product.product_name,
          brand_name: product.brand_name,
          price,
          unit_type: "piece",
          quantity: 1,
        },
      ])
    }
  }

  const removeFromCart = (productId: string, unitType: string) => {
    setCartItems(cartItems.filter((item) => !(item.product_id === productId && item.unit_type === unitType)))
  }

  const updateQuantity = (productId: string, unitType: string, change: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.product_id === productId && item.unit_type === unitType
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    )
  }

  const handleEditPrice = (index: number, currentPrice: number) => {
    setEditingItemIndex(index)
    setEditingPrice(currentPrice)
  }

  const handlePriceChange = (index: number, value: string) => {
    const numValue = Number(value.replace(/^0+/, "") || "0")
    const updatedCart = [...cartItems]
    updatedCart[index].price = numValue
    setCartItems(updatedCart)
  }

  const handlePriceBlur = () => {
    if (editingItemIndex !== null && editingPrice > 0) {
      const updatedCart = [...cartItems]
      updatedCart[editingItemIndex].price = editingPrice
      setCartItems(updatedCart)
      setEditingItemIndex(null)
    }
  }

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePriceBlur()
    }
  }

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0 || !customer) return

    setSubmitting(true)
    try {
      const itemsForAPI = cartItems.map((item) => ({
        id: item.product_id, // shop_item.id
        brand_name: item.brand_name,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      }))

      const response = await fetch("/api/owner/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          items: itemsForAPI,
          total_amount: Math.round(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)),
        }),
      })

      if (response.ok) {
        const order = await response.json()
        router.push(`/owner/order-success?orderId=${order.id}`)
      }
    } catch (error) {
      console.error("[v0] Order submission failed:", error)
      alert("Failed to create order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNewItem = async () => {
    if (!newItem.brand_name || !newItem.product_name || !newItem.selling_price) {
      alert("Please fill all fields")
      return
    }

    try {
      const response = await fetch("/api/owner/shop-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        await fetchProducts()
        setIsAddItemOpen(false)
        setNewItem({ brand_name: "", product_name: "", selling_price: 0 })
        alert("Item added successfully!")
      }
    } catch (error) {
      console.error("[v0] Failed to add item:", error)
    }
  }

  const total = Math.round(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0))

  if (step === 1) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">Take Order - Step 1</h1>
              <p className="text-sm text-muted-foreground mt-1">Select or create a customer</p>
            </div>
          </div>

          <div className="p-4 md:p-6 max-w-md mx-auto">
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">Customer Details</h2>

              {!showNewCustomerForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <Button
                    onClick={handleCustomerSearch}
                    disabled={searching || !customerPhone.trim()}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {searching ? "Searching..." : "Search Customer"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    No customer found with phone {customerPhone}. Create new customer:
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Shop Name *</label>
                    <input
                      type="text"
                      value={newCustomer.shop_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, shop_name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Area</label>
                    <input
                      type="text"
                      value={newCustomer.area}
                      onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateCustomer}
                      disabled={searching}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {searching ? "Creating..." : "Create Customer"}
                    </Button>
                    <Button onClick={() => setShowNewCustomerForm(false)} variant="outline" className="flex-1">
                      Back
                    </Button>
                  </div>
                </div>
              )
              }
            </div>
          </div>
        </main>
        <MobileNav role="owner" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      {step === 2 && (
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">Take Order - Step 2</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {customer?.shop_name} ({customer?.phone})
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep(1)}>
              Change Customer
            </Button>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button onClick={() => setIsAddItemOpen(true)} className="gap-2 w-full sm:w-auto">
                    <Plus size={16} />
                    Add Item
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products
                    .filter(
                      (p) =>
                        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((product) => (
                      <div key={product.id} className="bg-card border border-border rounded-lg p-4">
                        <p className="font-medium text-foreground">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{product.brand_name}</p>
                        <p className="text-sm font-bold text-primary mb-3">{product.selling_price || 0}</p>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm sticky top-20">
                  <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {cartItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items added</p>
                    ) : (
                      cartItems.map((item, idx) => (
                        <div key={`${item.product_id}-${idx}`} className="bg-muted rounded-md p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.unit_type}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product_id, item.unit_type)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Price:</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || val === "0") {
                                    handlePriceChange(idx, "")
                                  } else {
                                    handlePriceChange(idx, val.replace(/^0+/, "") || "0")
                                  }
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === "0") e.target.value = ""
                                }}
                                className="w-20 px-2 py-1 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.unit_type, -1)}
                                className="p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product_id, item.unit_type, 1)}
                                className="p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-foreground">Total:</p>
                      <p className="text-xl font-bold text-primary">₹{total.toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={handleConfirmOrder}
                      disabled={cartItems.length === 0 || submitting}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {submitting ? "Processing..." : "Confirm Order"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Shop Item</DialogTitle>
                <DialogDescription>Quickly add a missing item to your shop.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="brand" className="text-right">
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    value={newItem.brand_name}
                    onChange={(e) => setNewItem({ ...newItem, brand_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newItem.product_name}
                    onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newItem.selling_price || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || val === "0") {
                        setNewItem({ ...newItem, selling_price: "" as any })
                      } else {
                        setNewItem({ ...newItem, selling_price: Number(val.replace(/^0+/, "")) || ("" as any) })
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = ""
                    }}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddNewItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      )}
      <MobileNav role="owner" />
    </div>
  )
}
