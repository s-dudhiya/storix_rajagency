"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Search, Plus, Minus, X } from "lucide-react"

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

export default function LabourTakeOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [customerPhone, setCustomerPhone] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    shop_name: "",
    phone: "",
    area: "",
  })

  useEffect(() => {
    if (step === 2) {
      fetchProducts()
    }
  }, [step])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/labour/shop-items")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSearch = async () => {
    if (!customerPhone) return

    try {
      setLoading(true)
      const response = await fetch(`/api/labour/customers/search?phone=${customerPhone}`)
      if (response.ok) {
        const customers = await response.json()
        if (customers.length > 0) {
          setCustomer(customers[0])
          setStep(2)
        } else {
          setShowNewCustomerForm(true)
          setNewCustomerData({ ...newCustomerData, phone: customerPhone })
        }
      }
    } catch (error) {
      console.error("[v0] Customer search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.shop_name || !newCustomerData.phone) {
      alert("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/labour/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerData),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomer(newCustomer)
        setShowNewCustomerForm(false)
        setStep(2)
      }
    } catch (error) {
      console.error("[v0] Customer creation failed:", error)
    } finally {
      setLoading(false)
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

  const handleConfirmOrder = async () => {
    if (!customer || cartItems.length === 0) return

    try {
      setSubmitting(true)
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const itemsForAPI = cartItems.map((item) => ({
        id: item.product_id, // shop_item.id
        product_name: item.product_name,
        brand_name: item.brand_name,
        price: item.price,
        quantity: item.quantity,
      }))

      const response = await fetch("/api/labour/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          items: itemsForAPI,
          total_amount: total,
        }),
      })

      if (response.ok) {
        const order = await response.json()
        router.push(`/labour/order-success?orderId=${order.id}`)
      } else {
        alert("Failed to create order")
      }
    } catch (error) {
      console.error("[v0] Order creation failed:", error)
      alert("Failed to create order")
    } finally {
      setSubmitting(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handlePriceChange = (index: number, value: string) => {
    const numValue = Number(value.replace(/^0+/, "") || "0")
    const updatedCart = [...cartItems]
    updatedCart[index].price = numValue
    setCartItems(updatedCart)
  }

  if (step === 1) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="labour" />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create Order - Step 1</h1>
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
                    disabled={loading || !customerPhone}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? "Searching..." : "Search Customer"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Customer not found. Create new:</p>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Shop Name *</label>
                    <input
                      type="text"
                      value={newCustomerData.shop_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, shop_name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Area</label>
                    <input
                      type="text"
                      value={newCustomerData.area}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, area: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateCustomer}
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {loading ? "Creating..." : "Create Customer"}
                    </Button>
                    <Button onClick={() => setShowNewCustomerForm(false)} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileNav role="labour" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="labour" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create Order - Step 2</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {customer?.shop_name} ({customer?.phone})
            </p>
          </div>
          <Button variant="outline" onClick={() => setStep(1)}>
            Change Customer
          </Button>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading products...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Products */}
              <div className="md:col-span-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
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

              {/* Cart */}
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
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.unit_type}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product_id, item.unit_type)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
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
                            <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="mb-2 text-xs">
                            <span className="text-muted-foreground">Price: </span>
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
                      ))
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-foreground">Total:</p>
                      <p className="text-xl font-bold text-primary">₹{total}</p>
                    </div>
                    <Button
                      onClick={handleConfirmOrder}
                      disabled={cartItems.length === 0 || submitting}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {submitting ? "Creating Order..." : "Confirm Order"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav role="labour" />
    </div>
  )
}
