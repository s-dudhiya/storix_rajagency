"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Search, ChevronDown } from "lucide-react"

interface ShopItem {
  id: string
  product_name: string
  brand_name: string
  selling_price: number
}

interface Brand {
  name: string
  products: ShopItem[]
}

export default function CataloguePage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/owner/shop-items")
        if (!response.ok) throw new Error("Failed to fetch")

        const data = await response.json()

        // Group products by brand
        const groupedByBrand = (data || []).reduce((acc: { [key: string]: ShopItem[] }, product: ShopItem) => {
          const brand = product.brand_name
          if (!acc[brand]) {
            acc[brand] = []
          }
          acc[brand].push(product)
          return acc
        }, {})

        const brandsList = Object.entries(groupedByBrand).map(([name, products]) => ({
          name,
          products: products as ShopItem[],
        }))

        setBrands(brandsList)
        if (brandsList.length > 0) {
          setExpandedBrand(brandsList[0].name)
        }
      } catch (err) {
        console.log("[v0] Error fetching shop items:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.products.some((p) => p.product_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Product Catalogue</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse all shop items</p>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search brands or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading products...</div>
          ) : (
            <div className="space-y-3">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <div key={brand.name} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setExpandedBrand(expandedBrand === brand.name ? null : brand.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
                    >
                      <h3 className="font-bold text-foreground">{brand.name}</h3>
                      <ChevronDown
                        size={20}
                        className={`text-muted-foreground transition-transform ${expandedBrand === brand.name ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {expandedBrand === brand.name && (
                      <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/30">
                        {brand.products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-card rounded border border-border"
                          >
                            <div>
                              <p className="font-medium text-foreground">{product.product_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">₹{product.selling_price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">No products found</div>
              )}
            </div>
          )}
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
