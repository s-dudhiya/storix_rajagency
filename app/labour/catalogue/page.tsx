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

export default function LabourCataloguePage() {
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/labour/shop-items")
      if (response.ok) {
        const products = await response.json()

        // Group products by brand
        const brandMap = new Map<string, ShopItem[]>()
        products.forEach((product: ShopItem) => {
          const brandName = product.brand_name || "Other"
          if (!brandMap.has(brandName)) {
            brandMap.set(brandName, [])
          }
          brandMap.get(brandName)!.push(product)
        })

        // Convert to brands array
        const brandsData: Brand[] = Array.from(brandMap.entries()).map(([name, products]) => ({
          name,
          products,
        }))

        setBrands(brandsData)
        if (brandsData.length > 0) {
          setExpandedBrand(brandsData[0].name)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch shop items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.products.some((p) => p.product_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="labour" />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading products...</p>
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
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Product Catalogue</h1>
            <p className="text-sm text-muted-foreground mt-1">View shop items and prices</p>
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

          <div className="space-y-3">
            {filteredBrands.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No products found</p>
            ) : (
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
            )}
          </div>
        </div>
      </main>
      <MobileNav role="labour" />
    </div>
  )
}
