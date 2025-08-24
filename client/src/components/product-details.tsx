import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ProductWithAnalytics } from "@shared/schema";

interface ProductDetailsProps {
  product: ProductWithAnalytics;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  // Calculate price position percentage (0-100)
  const minPrice = parseFloat(product.minPrice);
  const maxPrice = parseFloat(product.maxPrice);
  const currentPrice = parseFloat(product.currentPrice);
  
  const pricePosition = maxPrice > minPrice 
    ? ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100
    : 50;

  const getPriceLabel = () => {
    if (pricePosition <= 33) return "Great Deal";
    if (pricePosition <= 66) return "Fair Price";
    return "Expensive";
  };

  const getPriceIcon = () => {
    if (pricePosition <= 33) return <TrendingDown className="w-4 h-4 text-green-600" />;
    if (pricePosition <= 66) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingUp className="w-4 h-4 text-red-600" />;
  };

  const getStockStatus = () => {
    if (product.stockQuantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (product.stockQuantity < 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">Product Details</h2>
          <Badge variant={stockStatus.variant} data-testid="badge-stock-status">
            {stockStatus.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</label>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200" data-testid="text-product-name">
                {product.designation}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</label>
              <p className="font-mono text-gray-600 dark:text-gray-400" data-testid="text-barcode">
                {product.codebar}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</label>
                <p className="text-2xl font-bold text-material-blue" data-testid="text-current-price">
                  ${product.currentPrice}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Quantity</label>
                <p className="text-2xl font-bold text-material-green" data-testid="text-stock-quantity">
                  {product.stockQuantity}
                </p>
              </div>
            </div>

            {product.category && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="text-gray-800 dark:text-gray-200" data-testid="text-category">
                  {product.category}
                </p>
              </div>
            )}
          </div>

          {/* Price Analytics */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Price Analytics</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Minimum Price</span>
                <span className="font-medium text-green-600" data-testid="text-min-price">
                  ${product.minPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Maximum Price</span>
                <span className="font-medium text-red-600" data-testid="text-max-price">
                  ${product.maxPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Average Price</span>
                <span className="font-medium text-gray-800 dark:text-gray-200" data-testid="text-avg-price">
                  ${product.avgPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Scans</span>
                <span className="font-medium text-gray-800 dark:text-gray-200" data-testid="text-scans-count">
                  {product.scansCount}
                </span>
              </div>
            </div>

            {/* Price Position Indicator */}
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Current Price Position
              </label>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="absolute h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full w-full"></div>
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-material-blue rounded-full -top-1 shadow-lg transition-all duration-300"
                  style={{ left: `${Math.max(0, Math.min(100, pricePosition))}%`, transform: 'translateX(-50%)' }}
                  data-testid="indicator-price-position"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-material-blue text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getPriceIcon()}
                      <span>{getPriceLabel()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Great Deal</span>
                <span>Fair Price</span>
                <span>Expensive</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
