"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { AlertTriangle, Edit2, Plus, Trash2, Search, Minus, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateInventoryReport } from "@/lib/pdf-generator"

interface InventoryItem {
  id: string
  sr_no: number
  product_name: string
  brand_name: string
  stock_quantity: number
}

interface NewProductForm {
  brand_name: string
  product_name: string
  stock_quantity: number | undefined
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<InventoryItem>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("") // Add search state
  const [quickReduceId, setQuickReduceId] = useState<string | null>(null)
  const [quickReduceAmount, setQuickReduceAmount] = useState<number>(0)
  const [quickAddId, setQuickAddId] = useState<string | null>(null)
  const [quickAddAmount, setQuickAddAmount] = useState<number>(0)
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    brand_name: "",
    product_name: "",
    stock_quantity: undefined as any,
  })

  const lowStockThreshold = 10

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/owner/inventory")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const lowStockItems = items.filter((item) => item.stock_quantity <= lowStockThreshold)

  const filteredItems = items.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditValues(item)
  }

  const handleSave = async () => {
    if (!editingId || !editValues) return

    setSaving(true)
    try {
      const response = await fetch(`/api/owner/inventory/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_quantity: editValues.stock_quantity,
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setItems(items.map((item) => (item.id === editingId ? updatedProduct : item)))
        setEditingId(null)
      }
    } catch (error) {
      console.error("[v0] Failed to update inventory:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/owner/inventory/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems(items.filter((item) => item.id !== id))
        setDeletingId(null)
      }
    } catch (error) {
      console.error("[v0] Failed to delete product:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.brand_name || !newProduct.product_name) {
      alert("Brand and Product name are required")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/owner/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      })

      if (response.ok) {
        const createdProduct = await response.json()
        setItems([createdProduct, ...items])
        setIsAddOpen(false)
        setNewProduct({
          brand_name: "",
          product_name: "",
          stock_quantity: undefined as any,
        })
      } else {
        const error = await response.json()
        alert(`Failed to add product: ${error.error}`)
      }
    } catch (error) {
      console.error("[v0] Failed to add product:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdd = async () => {
    if (!quickAddId || quickAddAmount <= 0) return

    const item = items.find((i) => i.id === quickAddId)
    if (!item) return

    const newStock = item.stock_quantity + quickAddAmount

    setSaving(true)
    try {
      const response = await fetch(`/api/owner/inventory/${quickAddId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_quantity: newStock,
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setItems(items.map((item) => (item.id === quickAddId ? updatedProduct : item)))
        setQuickAddId(null)
        setQuickAddAmount(0)
      }
    } catch (error) {
      console.error("[v0] Failed to add stock:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickReduce = async () => {
    if (!quickReduceId || quickReduceAmount <= 0) return

    const item = items.find((i) => i.id === quickReduceId)
    if (!item) return

    const newStock = Math.max(0, item.stock_quantity - quickReduceAmount)

    setSaving(true)
    try {
      const response = await fetch(`/api/owner/inventory/${quickReduceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_quantity: newStock,
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setItems(items.map((item) => (item.id === quickReduceId ? updatedProduct : item)))
        setQuickReduceId(null)
        setQuickReduceAmount(0)
      }
    } catch (error) {
      console.error("[v0] Failed to reduce stock:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = () => {
    generateInventoryReport({
      items: items,
      generated_at: new Date().toISOString(),
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </main>
        <MobileNav role="owner" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Inventory Management</h1>
            <p className="text-xs font-medium text-muted-foreground hidden md:block">Track and manage your stock levels</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-9 gap-2 bg-transparent border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 hidden md:flex">
              <FileDown size={16} />
              Export
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                  <Plus size={16} />
                  <span className="hidden md:inline">Add Product</span>
                  <span className="md:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Enter the details of the new product to add to your inventory.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="brand" className="text-left sm:text-right">
                      Brand
                    </Label>
                    <Input
                      id="brand"
                      value={newProduct.brand_name}
                      onChange={(e) => setNewProduct({ ...newProduct, brand_name: e.target.value })}
                      className="col-span-1 sm:col-span-3"
                      placeholder="e.g. Nestle"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="name" className="text-left sm:text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                      className="col-span-1 sm:col-span-3"
                      placeholder="e.g. KitKat"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="stock" className="text-left sm:text-right">
                      Stock
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock_quantity || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || val === "0") {
                          setNewProduct({ ...newProduct, stock_quantity: "" as any })
                        } else {
                          setNewProduct({
                            ...newProduct,
                            stock_quantity: Number(val.replace(/^0+/, "")) || ("" as any),
                          })
                        }
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = ""
                      }}
                      className="col-span-1 sm:col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddProduct} disabled={saving}>
                    {saving ? "Adding..." : "Add Product"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/60 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                  <AlertTriangle className="text-orange-600 dark:text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-200">Low Stock Alert</h3>
                  <p className="text-sm text-orange-800/80 dark:text-orange-300/80 mt-1 leading-relaxed">
                    <span className="font-bold">{lowStockItems.length}</span> product(s) in your inventory are running low on stock. Please restock soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search by product name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300 shadow-sm"
            />
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden md:block bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">SR No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-2">
                            <Search className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                          <p className="text-foreground font-medium">No products found</p>
                          <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-muted/30 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.product_name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.brand_name}</td>
                        <td className="px-6 py-4 text-sm">
                          {item.stock_quantity <= lowStockThreshold ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-300 border border-red-200/50 dark:border-red-800/30 rounded-md text-xs font-medium">
                              <AlertTriangle size={12} />
                              {item.stock_quantity}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-300 border border-green-200/50 dark:border-green-800/30 rounded-md text-xs font-medium">
                              {item.stock_quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => {
                                setQuickReduceId(item.id)
                                setQuickReduceAmount(0)
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all"
                              title="Quick Reduce"
                            >
                              <Minus size={14} />
                            </Button>
                            <Button
                              onClick={() => {
                                setQuickAddId(item.id)
                                setQuickAddAmount(0)
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                              title="Quick Add"
                            >
                              <Plus size={14} />
                            </Button>
                            <Button
                              onClick={() => handleEdit(item)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg text-foreground border-border hover:bg-muted/80 hover:border-foreground/20 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              onClick={() => setDeletingId(item.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Inventory Card View */}
          <div className="md:hidden space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p>{items.length === 0 ? "No products found" : "No matching products"}</p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div key={item.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform duration-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-foreground text-base tracking-tight">{item.product_name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mt-1">{item.brand_name}</p>
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/10">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex justify-between items-center my-4 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">Current Stock</span>
                    {item.stock_quantity <= lowStockThreshold ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-bold">
                        <AlertTriangle size={14} />
                        {item.stock_quantity}
                      </span>
                    ) : (
                      <span className="text-foreground font-bold text-lg">{item.stock_quantity}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setQuickReduceId(item.id)
                        setQuickReduceAmount(0)
                      }}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs gap-1.5 text-orange-600 border-orange-200/60 hover:bg-orange-50 bg-orange-50/30"
                    >
                      <Minus size={14} />
                      Reduce
                    </Button>
                    <Button
                      onClick={() => {
                        setQuickAddId(item.id)
                        setQuickAddAmount(0)
                      }}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs gap-1.5 text-primary border-primary/20 hover:bg-primary/5 bg-primary/5"
                    >
                      <Plus size={14} />
                      Add
                    </Button>
                    <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="h-9 text-xs gap-1.5">
                      <Edit2 size={14} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeletingId(item.id)}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Modal */}
          {editingId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold text-foreground mb-4">Edit Product</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={editValues.stock_quantity || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || val === "0") {
                          setEditValues({ ...editValues, stock_quantity: "" as any })
                        } else {
                          setEditValues({
                            ...editValues,
                            stock_quantity: Number(val.replace(/^0+/, "")) || ("" as any),
                          })
                        }
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = ""
                      }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="outline" className="flex-1" disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold text-foreground mb-2">Delete Product?</h2>
                <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDelete(deletingId)}
                    disabled={saving}
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </Button>
                  <Button onClick={() => setDeletingId(null)} variant="outline" className="flex-1" disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* Quick Add Stock Modal */}
          {quickAddId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold text-foreground mb-2">Quick Add Stock</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Current stock: {items.find((i) => i.id === quickAddId)?.stock_quantity || 0}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Add amount:</label>
                    <input
                      type="number"
                      min="0"
                      value={quickAddAmount || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || val === "0") {
                          setQuickAddAmount(0)
                        } else {
                          setQuickAddAmount(Number(val.replace(/^0+/, "")) || 0)
                        }
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = ""
                      }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter amount to add"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    New stock will be:{" "}
                    <span className="font-bold text-foreground">
                      {(items.find((i) => i.id === quickAddId)?.stock_quantity || 0) + quickAddAmount}
                    </span>
                  </p>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleQuickAdd}
                      disabled={saving || quickAddAmount <= 0}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {saving ? "Adding..." : "Confirm Add"}
                    </Button>
                    <Button
                      onClick={() => {
                        setQuickAddId(null)
                        setQuickAddAmount(0)
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Reduce Stock Modal */}
          {quickReduceId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold text-foreground mb-2">Quick Reduce Stock</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Current stock: {items.find((i) => i.id === quickReduceId)?.stock_quantity || 0}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Reduce by amount:</label>
                    <input
                      type="number"
                      min="0"
                      value={quickReduceAmount || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || val === "0") {
                          setQuickReduceAmount(0)
                        } else {
                          setQuickReduceAmount(Number(val.replace(/^0+/, "")) || 0)
                        }
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = ""
                      }}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter amount to reduce"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    New stock will be:{" "}
                    <span className="font-bold text-foreground">
                      {Math.max(
                        0,
                        (items.find((i) => i.id === quickReduceId)?.stock_quantity || 0) - quickReduceAmount,
                      )}
                    </span>
                  </p>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleQuickReduce}
                      disabled={saving || quickReduceAmount <= 0}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {saving ? "Reducing..." : "Confirm Reduce"}
                    </Button>
                    <Button
                      onClick={() => {
                        setQuickReduceId(null)
                        setQuickReduceAmount(0)
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
