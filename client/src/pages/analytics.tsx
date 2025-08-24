import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Package, Clock, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [timeFrame, setTimeFrame] = useState<string>("30");

  // Fetch general statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 60000,
  });

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['/api/products', { limit: 100 }],
  });

  // Fetch product analytics if a product is selected
  const { data: productAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/products', selectedProduct, 'analytics'],
    enabled: !!selectedProduct,
  });

  // Fetch price history if a product is selected
  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/products', selectedProduct, 'price-history'],
    enabled: !!selectedProduct,
  });

  const products = productsData?.products || [];
  const isLoading = statsLoading || analyticsLoading || historyLoading;

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor price trends and product performance across your database
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full md:w-64" data-testid="select-product">
            <SelectValue placeholder="Select a product..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: any) => (
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
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total-products">
                  {statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.totalProducts?.toLocaleString() || '0'}
                </p>
              </div>
              <Package className="w-8 h-8 text-material-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scans Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-scans-today">
                  {statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.scansToday?.toLocaleString() || '0'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-material-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Price Range</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-avg-price">
                  {productAnalytics ? (
                    `$${parseFloat(productAnalytics.avgPrice).toFixed(2)}`
                  ) : (
                    <span className="text-gray-400">Select product</span>
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-material-orange" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid="stat-last-update">
                  {statsLoading ? (
                    <Skeleton className="h-5 w-24" />
                  ) : stats?.lastUpdate ? (
                    new Date(stats.lastUpdate).toLocaleTimeString()
                  ) : (
                    'Unknown'
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
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
                <span>Price Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <span className="text-sm font-medium">Minimum Price</span>
                  <span className="text-lg font-bold text-green-600" data-testid="analytics-min-price">
                    ${parseFloat(productAnalytics.minPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-sm font-medium">Maximum Price</span>
                  <span className="text-lg font-bold text-red-600" data-testid="analytics-max-price">
                    ${parseFloat(productAnalytics.maxPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Average Price</span>
                  <span className="text-lg font-bold text-material-blue" data-testid="analytics-avg-price">
                    ${parseFloat(productAnalytics.avgPrice).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <span className="text-sm font-medium">Current Price</span>
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
              {priceHistory.slice(0, 10).map((entry: any, index: number) => (
                <div key={entry.id} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400" data-testid={`history-date-${index}`}>
                    {new Date(entry.commandeDate).toLocaleDateString()}
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
