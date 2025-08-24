import { 
  products, 
  detailCommande, 
  productScans,
  type Product, 
  type InsertProduct,
  type DetailCommande,
  type InsertDetailCommande,
  type ProductScan,
  type InsertProductScan,
  type ProductWithAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, count, min, max, avg, sql } from "drizzle-orm";

export interface IStorage {
  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(codebar: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  searchProducts(query?: string, category?: string, limit?: number, offset?: number): Promise<{ products: Product[], total: number }>;
  
  // Price analytics
  getProductAnalytics(productId: string): Promise<ProductWithAnalytics | undefined>;
  
  // Detail commande operations
  createDetailCommande(detail: InsertDetailCommande): Promise<DetailCommande>;
  getProductPriceHistory(productId: string): Promise<DetailCommande[]>;
  
  // Scan tracking
  recordProductScan(productId: string): Promise<ProductScan>;
  getTodayScansCount(): Promise<number>;
  
  // Statistics
  getTotalProductsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(codebar: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.codebar, codebar));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updateData, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async searchProducts(query?: string, category?: string, limit = 10, offset = 0): Promise<{ products: Product[], total: number }> {
    let whereConditions = [];
    
    if (query) {
      whereConditions.push(ilike(products.designation, `%${query}%`));
    }
    
    if (category && category !== 'All Categories') {
      whereConditions.push(eq(products.category, category));
    }

    const whereClause = whereConditions.length > 0 ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(products)
      .where(whereClause);

    const productResults = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(asc(products.designation))
      .limit(limit)
      .offset(offset);

    return {
      products: productResults,
      total: totalResult.count
    };
  }

  async getProductAnalytics(productId: string): Promise<ProductWithAnalytics | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    
    if (!product) return undefined;

    const [analytics] = await db
      .select({
        minPrice: min(detailCommande.price),
        maxPrice: max(detailCommande.price),
        avgPrice: avg(detailCommande.price),
      })
      .from(detailCommande)
      .where(eq(detailCommande.productId, productId));

    const [scansResult] = await db
      .select({ count: count() })
      .from(productScans)
      .where(eq(productScans.productId, productId));

    return {
      ...product,
      minPrice: analytics.minPrice || product.currentPrice,
      maxPrice: analytics.maxPrice || product.currentPrice,
      avgPrice: analytics.avgPrice || product.currentPrice,
      scansCount: scansResult.count
    };
  }

  async createDetailCommande(detail: InsertDetailCommande): Promise<DetailCommande> {
    const [created] = await db
      .insert(detailCommande)
      .values(detail)
      .returning();
    return created;
  }

  async getProductPriceHistory(productId: string): Promise<DetailCommande[]> {
    return await db
      .select()
      .from(detailCommande)
      .where(eq(detailCommande.productId, productId))
      .orderBy(desc(detailCommande.commandeDate));
  }

  async recordProductScan(productId: string): Promise<ProductScan> {
    const [scan] = await db
      .insert(productScans)
      .values({ productId })
      .returning();
    return scan;
  }

  async getTodayScansCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(productScans)
      .where(sql`DATE(scanned_at) = CURRENT_DATE`);
    
    return result.count;
  }

  async getTotalProductsCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(products);
    
    return result.count;
  }
}

export const storage = new DatabaseStorage();
