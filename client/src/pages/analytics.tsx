import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Package, Clock, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/contexts/LocalizationContext";
import type { Product, DetailCommande, ProductWithAnalytics } from "@shared/schema";

export default function Analytics() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [timeFrame, setTimeFrame] = useState<string>("30");
  const { t } = useTranslation();

  // Fetch general statistics
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalProducts: number;
    scansToday: number;
    lastUpdate: string;
  }>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000,
  });

  // Fetch products for selection
  const { data: productsData } = useQuery<{
    products: Product[];
    total: number;
  }>({
    queryKey: ['/api/products', { limit: 100 }],
  });

  // Fetch product analytics if a product is selected
  const { data: productAnalytics, isLoading: analyticsLoading } = useQuery<ProductWithAnalytics>({
    queryKey: ['/api/products', selectedProduct, 'analytics'],
    enabled: !!selectedProduct,
  });

  // Fetch price history if a product is selected
  const { data: priceHistory, isLoading: historyLoading } = useQuery<DetailCommande[]>({
    queryKey: ['/api/products', selectedProduct, 'price-history'],
    enabled: !!selectedProduct,
  });

  const products = productsData?.products || [];
  const isLoading = statsLoading || analyticsLoading || historyLoading;

  return (
    <main className="container mx-auto mobile-container px-2 md:px-4 py-2 md:py-6 max-w-6xl pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("analytics.title")}</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          {t("analytics.subtitle")}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-8">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full md:w-64" data-testid="select-product">
            <SelectValue placeholder={t("analytics.selectProduct")} />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: Product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.designation}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-timeframe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("analytics.last7Days")}</SelectItem>
            <SelectItem value="30">{t("analytics.last30Days")}</SelectItem>
            <SelectItem value="90">{t("analytics.last90Days")}</SelectItem>
            <SelectItem value="365">{t("analytics.lastYear")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{t("analytics.totalProducts")}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total-products">
                  {statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.totalProducts?.toLocaleString() || '0'}
                </p>
              </div>
              <Package className="w-6 h-6 md:w-8 md:h-8 text-material-blue md:mt-0 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{t("analytics.scansToday")}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-scans-today">
                  {statsLoading ? <Skeleton className="h-6 md:h-8 w-16 md:w-20" /> : stats?.scansToday?.toLocaleString() || '0'}
                </p>
              </div>
              <Activity className="w-6 h-6 md:w-8 md:h-8 text-material-green md:mt-0 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{t("analytics.avgPrice")}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-avg-price">
                  {productAnalytics ? (
                    `$${parseFloat(productAnalytics.avgPrice).toFixed(2)}`
                  ) : (
                    <span className="text-gray-400 text-sm">{t("analytics.select")}</span>
                  )}
                </p>
              </div>
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-material-orange md:mt-0 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{t("analytics.lastUpdated")}</p>
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100" data-testid="stat-last-update">
                  {statsLoading ? (
                    <Skeleton className="h-4 md:h-5 w-20 md:w-24" />
                  ) : stats?.lastUpdate ? (
                    new Date(stats.lastUpdate).toLocaleTimeString()
                  ) : (
                    t("analytics.unknown")
                  )}
                </p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-gray-400 md:mt-0 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product-Specific Analytics */}
      {selectedProduct && productAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>{t("analytics.priceAnalytics")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-sm font-medium">{t("analytics.minimumPrice")}</span>
                  <span className="text-lg font-bold text-green-600" data-testid="analytics-min-price">
                    ${parseFloat(productAnalytics.minPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-sm font-medium">{t("analytics.maximumPrice")}</span>
                  <span className="text-lg font-bold text-red-600" data-testid="analytics-max-price">
                    ${parseFloat(productAnalytics.maxPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">{t("analytics.averagePrice")}</span>
                  <span className="text-lg font-bold text-material-blue" data-testid="analytics-avg-price">
                    ${parseFloat(productAnalytics.avgPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <span className="text-sm font-medium">{t("analytics.currentPrice")}</span>
                  <span className="text-lg font-bold text-material-orange" data-testid="analytics-current-price">
                    ${parseFloat(productAnalytics.currentPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <span className="text-sm font-medium">Total Scans</span>
                  <span className="text-lg font-bold text-purple-600" data-testid="analytics-scans-count">
                    {productAnalytics.scansCount}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <span className="text-sm font-medium">Stock Level</span>
                  <span className="text-lg font-bold text-indigo-600" data-testid="analytics-stock-level">
                    {productAnalytics.stockQuantity}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                  <span className="text-sm font-medium">Category</span>
                  <span className="text-lg font-bold text-teal-600" data-testid="analytics-category">
                    {productAnalytics.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price History */}
      {selectedProduct && priceHistory && priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {priceHistory.slice(0, 10).map((entry: DetailCommande, index: number) => (
                <div key={entry.id} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`history-date-${index}`}>
                    {entry.commandeDate ? new Date(entry.commandeDate).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="font-medium" data-testid={`history-price-${index}`}>
                    ${parseFloat(entry.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500" data-testid={`history-quantity-${index}`}>
                    Qty: {entry.quantity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProduct && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select a Product to View Analytics
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a product from the dropdown above to see detailed price analytics and performance metrics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
