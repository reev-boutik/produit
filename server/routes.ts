import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertDetailCommandeSchema } from "@shared/schema";
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

  app.get("/api/products", async (req, res) => {
    try {
      const query = req.query.search as string;
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.searchProducts(query, category, limit, offset);
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
        productId: req.params.id
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

  const httpServer = createServer(app);
  return httpServer;
}
