import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertDetailCommandeSchema } from "@shared/schema";
import { getExchangeRates, getCacheInfo } from "./services/exchangeRateService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Product routes
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/barcode/:codebar", async (req, res) => {
    try {
      const product = await storage.getProductByBarcode(req.params.codebar);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Record the scan
      await storage.recordProductScan(product.id);
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product by barcode" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string; // Use 'q' parameter for search
      const category = req.query.category as string;
      const stockStatus = req.query.stockStatus as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as string;

      console.log('Search request:', { query, category, stockStatus, limit, offset, sortBy, sortOrder });
      const result = await storage.searchProducts(query, category, stockStatus, limit, offset, sortBy, sortOrder);
      console.log('Search result:', { count: result.products.length, total: result.total });
      res.json(result);
    } catch (error) {
      console.error('Search error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to fetch product", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const query = req.query.search as string;
      const category = req.query.category as string;
      const stockStatus = req.query.stockStatus as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as string;

      const result = await storage.searchProducts(query, category, stockStatus, limit, offset, sortBy, sortOrder);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Analytics routes
  app.get("/api/products/:id/analytics", async (req, res) => {
    try {
      const analytics = await storage.getProductAnalytics(req.params.id);
      if (!analytics) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product analytics" });
    }
  });

  app.get("/api/products/:id/price-history", async (req, res) => {
    try {
      const history = await storage.getProductPriceHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Price recording
  app.post("/api/products/:id/prices", async (req, res) => {
    try {
      const priceData = insertDetailCommandeSchema.parse({
        ...req.body,
        produitId: req.params.id
      });
      const detail = await storage.createDetailCommande(priceData);
      res.status(201).json(detail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid price data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record price" });
    }
  });

  // Categories route
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getUniqueCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Sorting options route
  app.get("/api/sort-options", async (req, res) => {
    try {
      const sortOptions = [
        { value: 'relevance', label: 'Relevance', description: 'Best match for search query' },
        { value: 'name', label: 'Name (A-Z)', description: 'Sort by product name alphabetically' },
        { value: 'price', label: 'Price', description: 'Sort by price' },
        { value: 'stock', label: 'Stock Level', description: 'Sort by available stock' },
        { value: 'category', label: 'Category', description: 'Sort by product category' },
        { value: 'created', label: 'Date Added', description: 'Sort by creation date' },
        { value: 'modified', label: 'Last Modified', description: 'Sort by last modification date' }
      ];
      
      const sortOrders = [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' }
      ];
      
      res.json({ sortOptions, sortOrders });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sort options" });
    }
  });

  // Statistics routes
  app.get("/api/stats", async (req, res) => {
    try {
      const [totalProducts, scansToday] = await Promise.all([
        storage.getTotalProductsCount(),
        storage.getTodayScansCount()
      ]);

      res.json({
        totalProducts,
        scansToday,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Exchange rates routes
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await getExchangeRates();
      const cacheInfo = getCacheInfo();
      
      res.json({
        rates,
        cache: {
          lastUpdated: cacheInfo.lastUpdated ? new Date(cacheInfo.lastUpdated).toISOString() : null,
          expiresAt: cacheInfo.expiresAt ? new Date(cacheInfo.expiresAt).toISOString() : null
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
