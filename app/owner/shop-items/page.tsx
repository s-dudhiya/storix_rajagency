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
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Shop Items</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Manage items available in your shop</p>
          </div>
          <Button className="gap-2 w-full md:w-auto" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add Item
          </Button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
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

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">SR No.</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-foreground">Price</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        {items.length === 0 ? "No shop items found" : "No matching items"}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-primary">{item.sr_no}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.brand_name}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                          {editingId === item.id ? (
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
                              className="w-24 px-2 py-1 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Price"
                            />
                          ) : (
                            `${item.selling_price}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {items.length === 0 ? "No shop items found" : "No matching items"}
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

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      {editingId === item.id ? (
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
                          className="w-20 px-2 py-1 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Price"
                        />
                      ) : (
                        <span className="font-bold text-foreground">₹{item.selling_price}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(item)} size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        onClick={() => setDeletingId(item.id)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Shop Item</DialogTitle>
                <DialogDescription>Add a new item to your shop inventory</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand Name</Label>
                  <Input
                    id="brand"
                    value={newShopItem.brand_name}
                    onChange={(e) => setNewShopItem({ ...newShopItem, brand_name: e.target.value })}
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product">Product Name</Label>
                  <Input
                    id="product"
                    value={newShopItem.product_name}
                    onChange={(e) => setNewShopItem({ ...newShopItem, product_name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Selling Price</Label>
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
                    placeholder="Enter selling price"
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
                <DialogTitle>Delete Shop Item</DialogTitle>
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
