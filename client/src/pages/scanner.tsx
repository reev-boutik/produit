import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BarcodeScannerComponent from "@/components/barcode-scanner";
import ProductDetails from "@/components/product-details";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithAnalytics, Product } from "@shared/schema";

export default function Scanner() {
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Fetch product by barcode
  const { 
    data: product, 
    isLoading: isLoadingProduct, 
    error: productError,
    refetch: refetchProduct 
  } = useQuery<Product>({
    queryKey: ['/api/products/barcode', scannedBarcode],
    enabled: !!scannedBarcode,
  });

  // Fetch analytics if we have a product
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics 
  } = useQuery<ProductWithAnalytics>({
    queryKey: ['/api/products', product?.id, 'analytics'],
    enabled: !!product?.id,
  });

  // Fetch general statistics
  const { data: stats } = useQuery<{
    totalProducts: number;
    scansToday: number;
    lastUpdate: string;
  }>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleBarcodeDetected = (barcode: string) => {
    setScannedBarcode(barcode);
    refetchProduct();
  };

  const isLoading = isLoadingProduct || isLoadingAnalytics;
  const productWithAnalytics: ProductWithAnalytics | undefined = analytics || (product ? {
    ...product,
    minPrice: product.currentPrice,
    maxPrice: product.currentPrice, 
    avgPrice: product.currentPrice,
    scansCount: 0
  } : undefined);

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl pb-24 md:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Scanner Card */}
        <BarcodeScannerComponent 
          onBarcodeDetected={handleBarcodeDetected}
          isLoading={isLoading}
        />

        {/* Quick Stats Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Database Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-material-blue" />
                  <span className="font-medium">Total Products</span>
                </div>
                <span className="text-xl font-bold text-material-blue" data-testid="text-total-products">
                  {stats?.totalProducts?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-material-green" />
                  <span className="font-medium">Scans Today</span>
                </div>
                <span className="text-xl font-bold text-material-green" data-testid="text-scans-today">
                  {stats?.scansToday?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-material-orange" />
                  <span className="font-medium">Last Updated</span>
                </div>
                <span className="text-sm font-medium text-material-orange" data-testid="text-last-update">
                  {stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Details Section */}
      {isLoading && scannedBarcode && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-material-blue"></div>
              <span className="text-gray-600 dark:text-gray-400">Searching database...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {productError && scannedBarcode && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Product Not Found</AlertTitle>
          <AlertDescription>
            No product found with barcode: {scannedBarcode}. The product may not be in our database.
          </AlertDescription>
        </Alert>
      )}

      {productWithAnalytics && !isLoading && (
        <ProductDetails product={productWithAnalytics} />
      )}

      {!scannedBarcode && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ready to Scan
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Use the camera to scan a barcode or enter one manually to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
