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
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Manage your product inventory</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={handleExportPDF} variant="outline" className="flex-1 md:flex-none gap-2 bg-transparent">
              <FileDown size={16} />
              Export PDF
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none gap-2">
                  <Plus size={16} />
                  Add Product
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

        <div className="p-4 md:p-6 space-y-6">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-200">Low Stock Alert</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    {lowStockItems.length} product(s) are running low on stock
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search by product name or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">SR No</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        {items.length === 0 ? "No products found" : "No matching products"}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-primary">{item.sr_no}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.brand_name}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.stock_quantity <= lowStockThreshold ? (
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium">
                              {item.stock_quantity} ⚠️
                            </span>
                          ) : (
                            <span className="text-foreground font-medium">{item.stock_quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => {
                                setQuickReduceId(item.id)
                                setQuickReduceAmount(0)
                              }}
                              size="sm"
                              variant="outline"
                              className="gap-2 text-orange-600 hover:text-orange-700"
                            >
                              <Minus size={14} />
                              Quick Reduce
                            </Button>
                            <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="gap-2">
                              <Edit2 size={14} />
                              Edit
                            </Button>
                            <Button
                              onClick={() => setDeletingId(item.id)}
                              size="sm"
                              variant="outline"
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={14} />
                              Delete
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
              <div className="text-center py-8 text-muted-foreground">
                {items.length === 0 ? "No products found" : "No matching products"}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">{item.brand_name}</p>
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                      #{item.sr_no}
                    </span>
                  </div>

                  <div className="flex justify-between items-center my-3">
                    <span className="text-sm text-muted-foreground">Stock Level:</span>
                    {item.stock_quantity <= lowStockThreshold ? (
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium">
                        {item.stock_quantity} ⚠️
                      </span>
                    ) : (
                      <span className="text-foreground font-medium">{item.stock_quantity}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <Button
                      onClick={() => {
                        setQuickReduceId(item.id)
                        setQuickReduceAmount(0)
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-orange-600 hover:text-orange-700"
                    >
                      <Minus size={12} />
                      Reduce
                    </Button>
                    <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="text-xs gap-1">
                      <Edit2 size={12} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeletingId(item.id)}
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
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
