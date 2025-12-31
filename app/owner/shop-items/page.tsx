"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Edit2, Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShopItem {
  id: string
  sr_no: number
  product_name: string
  brand_name: string
  selling_price: number
  stock_pieces: number
}

interface NewShopItemForm {
  brand_name: string
  product_name: string
  selling_price: number | string
}

export default function ShopItemsPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ShopItem>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newShopItem, setNewShopItem] = useState<NewShopItemForm>({
    brand_name: "",
    product_name: "",
    selling_price: undefined as any,
  })

  useEffect(() => {
    fetchShopItems()
  }, [])

  const fetchShopItems = async () => {
    try {
      const response = await fetch("/api/owner/shop-items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch shop items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items
    .filter(
      (item) =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.sr_no - b.sr_no)

  const handleEdit = (item: ShopItem) => {
    setEditingId(item.id)
    setEditValues({ selling_price: item.selling_price })
  }

  const handleSave = async () => {
    if (!editingId || !editValues.selling_price) return

    setSaving(true)
    try {
      const response = await fetch(`/api/owner/shop-items/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selling_price: editValues.selling_price,
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setItems(items.map((item) => (item.id === editingId ? updatedItem : item)))
        setEditingId(null)
      }
    } catch (error) {
      console.error("[v0] Failed to update shop item:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/owner/shop-items/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems(items.filter((item) => item.id !== id))
        setDeletingId(null)
      }
    } catch (error) {
      console.error("[v0] Failed to delete shop item:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddShopItem = async () => {
    if (!newShopItem.brand_name || !newShopItem.product_name || newShopItem.selling_price === "") {
      alert("Brand, Product name, and Price are required")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/owner/shop-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShopItem),
      })

      if (response.ok) {
        const createdItem = await response.json()
        setItems([createdItem, ...items])
        setIsAddOpen(false)
        setNewShopItem({
          brand_name: "",
          product_name: "",
          selling_price: undefined as any,
        })
      } else {
        const error = await response.json()
        alert(`Failed to add shop item: ${error.error}`)
      }
    } catch (error) {
      console.error("[v0] Failed to add shop item:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading shop items...</p>
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
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Shop Items</h1>
            <p className="text-xs font-medium text-muted-foreground hidden md:block">Manage items available in your shop</p>
          </div>
          <Button
            className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={18} />
            <span className="hidden md:inline">Add Item</span>
            <span className="md:hidden">Add</span>
          </Button>
        </div>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by product name or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">SR No.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="h-8 w-8 text-muted-foreground/30" />
                          <p>{items.length === 0 ? "No shop items found" : "No matching items"}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-muted/30 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{item.product_name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.brand_name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.selling_price || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || val === "0") {
                                    setEditValues({ selling_price: "" as any })
                                  } else {
                                    setEditValues({ selling_price: Number(val.replace(/^0+/, "")) || ("" as any) })
                                  }
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === "0") e.target.value = ""
                                }}
                                onBlur={handleSave}
                                autoFocus
                                className="w-24 px-2 py-1 bg-background border border-primary/50 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Price"
                              />
                            </div>
                          ) : (
                            `₹${item.selling_price.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-border/60 hover:bg-background hover:border-primary/30 hover:text-primary transition-all">
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              onClick={() => setDeletingId(item.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 border-2 border-dashed border-border/50 rounded-xl">
                <div className="h-14 w-14 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground">No items found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div key={item.id} className="group bg-card hover:bg-muted/20 border border-border/50 rounded-xl p-5 shadow-sm active:scale-[0.99] transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">{item.brand_name}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Price:</span>
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-sm">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.selling_price || ""}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === "" || val === "0") {
                                setEditValues({ selling_price: "" as any })
                              } else {
                                setEditValues({ selling_price: Number(val.replace(/^0+/, "")) || ("" as any) })
                              }
                            }}
                            onFocus={(e) => {
                              if (e.target.value === "0") e.target.value = ""
                            }}
                            onBlur={handleSave}
                            autoFocus
                            className="w-20 px-2 py-1 bg-background border border-primary/50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Price"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-primary text-lg">₹{item.selling_price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg border-border/60">
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        onClick={() => setDeletingId(item.id)}
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>Add a new product to your shop's inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Name</Label>
                  <Input
                    id="brand"
                    value={newShopItem.brand_name}
                    onChange={(e) => setNewShopItem({ ...newShopItem, brand_name: e.target.value })}
                    placeholder="e.g. Parle"
                    className="h-10 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product Name</Label>
                  <Input
                    id="product"
                    value={newShopItem.product_name}
                    onChange={(e) => setNewShopItem({ ...newShopItem, product_name: e.target.value })}
                    placeholder="e.g. G-Biscuit Small"
                    className="h-10 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selling Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newShopItem.selling_price || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || val === "0") {
                        setNewShopItem({ ...newShopItem, selling_price: "" as any })
                      } else {
                        setNewShopItem({ ...newShopItem, selling_price: Number(val.replace(/^0+/, "")) || ("" as any) })
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0") e.target.value = ""
                    }}
                    placeholder="0.00"
                    className="h-10 bg-muted/30 border-border/60 focus:bg-background focus:border-primary/40"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleAddShopItem} disabled={saving}>
                  {saving ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Item</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this item? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
