import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Eye, QrCode, ChevronLeft, ChevronRight, Tag, Barcode as BarcodeIcon, DollarSign, Package2, Download, ChevronUp, ChevronDown, Grid3X3, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPrice, formatNumber, type Currency } from "@/lib/format";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "@/contexts/LocalizationContext";
import type { Product } from "@shared/schema";
import Barcode from "react-barcode";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [stockStatus, setStockStatus] = useState("All Stock Levels");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("name"); // Default to name sorting
  const [sortOrder, setSortOrder] = useState("asc"); // Default to ascending
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table"); // Default to table view
  const { currency } = useCurrency();
  const { t } = useTranslation();

  // Calculate offset for server-side pagination
  const offset = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const limit = pageSize === -1 ? 10000 : pageSize;
  
  const { data, isLoading, error } = useQuery<{
    products: Product[];
    total: number;
  }>({
    queryKey: ['/api/products', { 
      search: searchQuery || undefined, 
      category: category !== "All Categories" ? category : undefined,
      stockStatus: stockStatus !== "All Stock Levels" ? stockStatus : undefined,
      limit,
      offset,
      sortBy,
      sortOrder
    }],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch unique categories from the database
  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ['/api/categories'],
    staleTime: 300000, // Cache categories for 5 minutes
  });

  // Fetch sort options from the backend
  const { data: sortOptionsData } = useQuery<{
    sortOptions: Array<{ value: string; label: string; description: string }>;
    sortOrders: Array<{ value: string; label: string }>;
  }>({
    queryKey: ['/api/sort-options'],
    staleTime: 600000, // Cache sort options for 10 minutes
  });

  // Helper function to determine stock status
  const getStockStatus = (quantity: number): string => {
    if (quantity === 0) return t("products.outOfStock");
    if (quantity < 10) return t("products.lowStock");
    return t("products.inStock");
  };

  // Use server-side data directly (server already filters for active products)
  const products: Product[] = data?.products || [];
  const totalProducts = data?.total || 0; // Use server-side total count
  
  // Handle "All" option for page size
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalProducts / pageSize);
  
  // For display purposes - calculate what we're showing
  const startIndex = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalProducts : Math.min(startIndex + pageSize, totalProducts);
  const displayedProductsCount = products.length;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    setCurrentPage(1); // Reset to first page on sort order change
  };

  // Helper function to handle column sorting
  const handleColumnSort = (column: string) => {
    if (sortBy === column) {
      // If clicking the same column, toggle the order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it as sortBy and default to asc
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Helper function to render sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortOrder === "asc" ? 
      <ChevronUp className="w-4 h-4 text-gray-600" /> : 
      <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <Badge 
          className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800" 
          data-testid="badge-out-stock"
        >
          {t("products.outOfStock")}
        </Badge>
      );
    }
    if (quantity < 10) {
      return (
        <Badge 
          className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800" 
          data-testid="badge-low-stock"
        >
          {t("products.lowStock")}
        </Badge>
      );
    }
    return (
      <Badge 
        className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" 
        data-testid="badge-in-stock"
      >
        {t("products.inStock")}
      </Badge>
    );
  };

  // Build categories list with "All Categories" first, then unique categories from database
  const categories = [
    t("products.allCategories"),
    ...(categoriesData || [])
  ];

  // Get sort options from API data
  const sortOptions = sortOptionsData?.sortOptions || [];
  const sortOrders = sortOptionsData?.sortOrders || [];


  // Barcode renderer component with error handling
  const BarcodeRenderer = ({ value }: { value: string }) => {
    console.log('BarcodeRenderer called with value:', value);
    
    if (!value || value.trim() === '') {
      console.log('No barcode value provided');
      return (
        <div className="text-center text-gray-500">
          <div className="text-sm mb-1">{t("products.noBarcodeAvailable")}</div>
        </div>
      );
    }

    // First try with original value (for cases where special characters are valid)
    let barcodeValue = value.trim();
    console.log('Original barcode value:', barcodeValue);

    // Determine format based on value characteristics
    let format = "CODE128"; // Default format
    
    // EAN-13 (13 digits)
    if (/^\d{13}$/.test(barcodeValue)) {
      format = "EAN13";
    }
    // EAN-8 (8 digits)
    else if (/^\d{8}$/.test(barcodeValue)) {
      format = "EAN8";
    }
    // UPC-A (12 digits)
    else if (/^\d{12}$/.test(barcodeValue)) {
      format = "UPC";
    }
    // CODE39 (alphanumeric with specific pattern)
    else if (/^[A-Z0-9\-\.\s\+\%\$\/]+$/.test(barcodeValue)) {
      format = "CODE39";
    }
    
    console.log('Determined format:', format, 'for value:', barcodeValue);

    if (barcodeValue.length < 1) {
      console.log('Invalid barcode format - too short:', barcodeValue);
      return (
        <div className="text-center text-gray-500">
          <div className="text-sm mb-1">{t("products.invalidBarcodeFormat")}</div>
          <div className="font-mono text-xs">{t("products.original")}: {value}</div>
        </div>
      );
    }

    try {
      console.log('Attempting to render barcode with format:', format, 'and value:', barcodeValue);
      return (
        <div className="flex flex-col items-center">
          <Barcode 
            value={barcodeValue}
            width={2}
            height={60}
            fontSize={12}
            textMargin={8}
            format={format}
            background="#ffffff"
            lineColor="#000000"
            displayValue={true}
          />
        </div>
      );
    } catch (error) {
      console.error('Barcode generation error with format', format, ':', error);
      
      // Fallback: try with CODE128 and cleaned value if original format failed
      if (format !== "CODE128") {
        try {
          const cleanValue = value.replace(/[^A-Za-z0-9]/g, '');
          console.log('Fallback: trying CODE128 with cleaned value:', cleanValue);
          
          if (cleanValue && cleanValue.length >= 1) {
            return (
              <div className="flex flex-col items-center">
                <Barcode 
                  value={cleanValue}
                  width={2}
                  height={60}
                  fontSize={12}
                  textMargin={8}
                  format="CODE128"
                  background="#ffffff"
                  lineColor="#000000"
                  displayValue={true}
                />
              </div>
            );
          }
        } catch (fallbackError) {
          console.error('Fallback barcode generation also failed:', fallbackError);
        }
      }
      
      return (
        <div className="text-center text-gray-500">
          <div className="text-sm mb-1">{t("products.couldNotGenerateBarcode")}</div>
          <div className="font-mono text-xs">{t("products.value")}: {barcodeValue}</div>
          <div className="text-xs text-red-500 mt-1">{t("products.error")}: {String(error)}</div>
        </div>
      );
    }
  };

  // Product detail modal component
  const ProductDetailModal = ({ product }: { product: Product }) => {
    const stockQuantity = Number(product.stockActuel) || 0;
    const stockStatus = getStockStatus(stockQuantity);
    
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t("products.productDetails")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden mx-auto">
                {product.imageUrl ? (
                  <img 
                    src={`/${product.imageUrl}`} 
                    alt={product.designation}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                    }}
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </div>
            
            {/* Basic Information */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {product.designation || t("products.unnamedProduct")}
                </h3>
                {product.category && (
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Price and Stock Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{t("products.price")}</span>
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {formatPrice(product.prixVente, currency)}
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Package2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">{t("products.stock")}</span>
                  </div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatNumber(product.stockActuel)}
                  </div>
                  <div className="mt-1">
                    {getStockBadge(stockQuantity)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barcode Section */}
          {product.codebar && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarcodeIcon className="w-4 h-4" />
                {t("products.barcode")}
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 mb-4 text-center">
                  {product.codebar}
                </div>
                {/* Scannable Barcode */}
                <div className="bg-white p-3 rounded border">
                  <div className="flex justify-center items-center min-h-[60px]">
                    <BarcodeRenderer value={product.codebar} />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {t("products.scannableBarcode")}
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                // Copy barcode to clipboard
                if (product.codebar) {
                  navigator.clipboard.writeText(product.codebar);
                }
              }}
            >
              <QrCode className="w-4 h-4" />
              {t("products.copyBarcode")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                // Copy product ID to clipboard
                if (product.id) {
                  navigator.clipboard.writeText(product.id.toString());
                }
              }}
            >
              <Package className="w-4 h-4" />
              Copy ID
            </Button>
            {product.codebar && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Download barcode as image
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `barcode-${product.codebar}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Download Barcode
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <main className="container mx-auto mobile-container px-2 md:px-4 py-2 md:py-6 max-w-6xl pb-24 md:pb-6">
      <Card className="border-0 md:border shadow-none md:shadow-sm">
        <CardHeader className="px-2 md:px-6 py-3 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-end">
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={t("products.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-full md:w-72"
                    data-testid="input-search-products"
                  />
                </div>
                {searchQuery && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    Searching across product names, barcodes, and categories
                  </div>
                )}
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
              
              <Select value={stockStatus} onValueChange={(value) => { setStockStatus(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-44" data-testid="select-stock-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Stock Levels">{t("products.allStockLevels")}</SelectItem>
                  <SelectItem value="In Stock">{t("products.inStock")}</SelectItem>
                  <SelectItem value="Low Stock">{t("products.lowStock")}</SelectItem>
                  <SelectItem value="Out of Stock">{t("products.outOfStock")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t("products.viewMode")}:</span>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-r-none border-0"
                  data-testid="button-table-view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="rounded-l-none border-0"
                  data-testid="button-card-view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 md:px-6 py-3 md:py-6">
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
              <p className="text-gray-500 dark:text-gray-400">{t("errors.serverError")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t("products.noProductsFound")}</p>
            </div>
          ) : (
            <>
              {/* Sort Controls for Card View */}
              {viewMode === "card" && (
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("products.sortBy")}:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortBy === "name" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleColumnSort("name")}
                      className="flex items-center gap-1"
                    >
                      Product {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </Button>
                    <Button
                      variant={sortBy === "codebar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleColumnSort("codebar")}
                      className="flex items-center gap-1"
                    >
                      Barcode {sortBy === "codebar" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </Button>
                    <Button
                      variant={sortBy === "price" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleColumnSort("price")}
                      className="flex items-center gap-1"
                    >
                      Price {sortBy === "price" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </Button>
                    <Button
                      variant={sortBy === "stock" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleColumnSort("stock")}
                      className="flex items-center gap-1"
                    >
                      Stock {sortBy === "stock" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Table View */}
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                          onClick={() => handleColumnSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            {t("products.designation")}
                            {renderSortIcon("name")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                          onClick={() => handleColumnSort("codebar")}
                        >
                          <div className="flex items-center gap-1">
                            {t("products.barcode")}
                            {renderSortIcon("codebar")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                          onClick={() => handleColumnSort("price")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {t("products.price")} ({currency === 'FCFA' ? 'FCFA' : currency === 'EUR' ? '€' : '$'})
                            {renderSortIcon("price")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                          onClick={() => handleColumnSort("stock")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {t("products.stock")}
                            {renderSortIcon("stock")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                          onClick={() => handleColumnSort("category")}
                        >
                          <div className="flex items-center gap-1">
                            {t("products.stockLevel")}
                            {renderSortIcon("category")}
                          </div>
                        </TableHead>
                        <TableHead>{t("products.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                  <img 
                                    src={`/${product.imageUrl}`} 
                                    alt={product.designation}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to package icon if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.parentElement!.innerHTML = '<svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                )}
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
                          <TableCell className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono" data-testid={`text-price-${product.id}`}>
                              {formatPrice(product.prixVente, currency)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono" data-testid={`text-stock-${product.id}`}>
                              {formatNumber(product.stockActuel)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStockBadge(Number(product.stockActuel) || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-material-blue hover:text-blue-700"
                                    data-testid={`button-view-${product.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <ProductDetailModal product={product} />
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-material-orange hover:text-orange-700"
                                data-testid={`button-scan-${product.id}`}
                                onClick={() => {
                                  // Copy barcode to clipboard or trigger scan functionality
                                  if (product.codebar) {
                                    navigator.clipboard.writeText(product.codebar);
                                    // You could add a toast notification here
                                  }
                                }}
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
              )}
              
              {/* Card View */}
              {viewMode === "card" && (
                <div className="mobile-card-container">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                    {products.map((product) => (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-2 md:p-4">
                        {/* Product Image */}
                        <div className="w-full h-24 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden mb-2 md:mb-3">
                          {product.imageUrl ? (
                            <img 
                              src={`/${product.imageUrl}`} 
                              alt={product.designation}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to package icon if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="space-y-1 md:space-y-2">
                          <div>
                            <h3 className="font-medium text-xs md:text-sm text-gray-900 dark:text-gray-100 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                              {product.designation}
                            </h3>
                            {product.category && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden md:block">
                                {product.category}
                              </p>
                            )}
                          </div>
                          
                          {/* Barcode - hidden on mobile */}
                          {product.codebar && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono hidden md:block" data-testid={`text-barcode-${product.id}`}>
                              {product.codebar}
                            </div>
                          )}
                          
                          {/* Price and Stock */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-0">
                            <div className="text-sm md:text-lg font-bold text-gray-900 dark:text-gray-100" data-testid={`text-price-${product.id}`}>
                              {formatPrice(product.prixVente, currency)}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400" data-testid={`text-stock-${product.id}`}>
                              {formatNumber(product.stockActuel)}
                            </div>
                          </div>
                          
                          {/* Status Badge and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="scale-75 md:scale-100 origin-left">
                              {getStockBadge(Number(product.stockActuel) || 0)}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-material-blue hover:text-blue-700 h-6 w-6 md:h-8 md:w-8 p-0"
                                    data-testid={`button-view-${product.id}`}
                                  >
                                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                  </Button>
                                </DialogTrigger>
                                <ProductDetailModal product={product} />
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-material-orange hover:text-orange-700 h-6 w-6 md:h-8 md:w-8 p-0"
                                data-testid={`button-scan-${product.id}`}
                                onClick={() => {
                                  // Copy barcode to clipboard or trigger scan functionality
                                  if (product.codebar) {
                                    navigator.clipboard.writeText(product.codebar);
                                    // You could add a toast notification here
                                  }
                                }}
                              >
                                <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination and Page Size Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-6 gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("products.showing", {
                      start: totalProducts > 0 ? startIndex + 1 : 0,
                      end: Math.min(startIndex + products.length, totalProducts),
                      total: totalProducts.toLocaleString()
                    })}
                    {stockStatus !== "All Stock Levels" && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (filtered by {stockStatus.toLowerCase()})
                      </span>
                    )}
                  </div>
                  
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t("products.pageSize")}:</span>
                    <Select 
                      value={pageSize === -1 ? "all" : pageSize.toString()} 
                      onValueChange={(value) => {
                        const newPageSize = value === "all" ? -1 : parseInt(value);
                        setPageSize(newPageSize);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-8" data-testid="select-page-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="all">{t("products.all")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Pagination Controls */}
                {pageSize !== -1 && (
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
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
