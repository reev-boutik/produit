import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Eye, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery<{
    products: Product[];
    total: number;
  }>({
    queryKey: ['/api/products', { 
      search: searchQuery || undefined, 
      category: category !== "All Categories" ? category : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    }],
    staleTime: 30000, // Cache for 30 seconds
  });

  const products: Product[] = data?.products || [];
  const totalProducts = data?.total || 0;
  const totalPages = Math.ceil(totalProducts / pageSize);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" data-testid="badge-out-stock">Out of Stock</Badge>;
    }
    if (quantity < 10) {
      return <Badge variant="secondary" data-testid="badge-low-stock">Low Stock</Badge>;
    }
    return <Badge variant="default" data-testid="badge-in-stock">In Stock</Badge>;
  };

  const categories = [
    "All Categories",
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Sports",
    "Books",
    "Health & Beauty",
    "Food & Beverages"
  ];

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl pb-24 md:pb-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-medium text-gray-800 dark:text-gray-200">
              Product Database
            </CardTitle>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full md:w-64"
                  data-testid="input-search-products"
                />
              </div>
              
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Failed to load products</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No products found</p>
            </div>
          ) : (
            <>
              {/* Products Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid={`text-product-name-${product.id}`}>
                                {product.designation}
                              </div>
                              {product.category && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {product.category}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-gray-500 dark:text-gray-400" data-testid={`text-barcode-${product.id}`}>
                            {product.codebar}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid={`text-price-${product.id}`}>
                            ${product.currentPrice}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`text-stock-${product.id}`}>
                            {product.stockQuantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStockBadge(product.stockQuantity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-material-blue hover:text-blue-700"
                              data-testid={`button-view-${product.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-material-orange hover:text-orange-700"
                              data-testid={`button-scan-${product.id}`}
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span data-testid="text-pagination-start">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span data-testid="text-pagination-end">
                    {Math.min(currentPage * pageSize, totalProducts)}
                  </span>{" "}
                  of{" "}
                  <span data-testid="text-pagination-total">
                    {totalProducts.toLocaleString()}
                  </span>{" "}
                  products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page{" "}
                    <span data-testid="text-current-page">{currentPage}</span>{" "}
                    of{" "}
                    <span data-testid="text-total-pages">{totalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
