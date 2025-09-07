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
  searchProducts(query?: string, category?: string, stockStatus?: string, limit?: number, offset?: number, sortBy?: string, sortOrder?: string): Promise<{ products: Product[], total: number }>;
  
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
  
  // Categories
  getUniqueCategories(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(codebar: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(
      sql`${eq(products.codebar, codebar)} AND ${eq(products.valide, true)}`
    );
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
      .set({ ...updateData, modifieA: sql`now()` })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // Helper function to extract initials from a string
  private extractInitials(text: string): string {
    return text
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase()) // Take first character of each word
      .join('');
  }

  // Helper function to check if query matches initials
  private matchesInitials(query: string, text: string): boolean {
    const initials = this.extractInitials(text);
    const queryUpper = query.toUpperCase();
    return initials.startsWith(queryUpper);
  }

  // Helper function to get the appropriate order by clause
  private getOrderByClause(sortBy?: string, sortOrder?: string) {
    const order = sortOrder?.toLowerCase() === 'desc' ? desc : asc;
    
    switch (sortBy) {
      case 'name':
      case 'designation':
        return order(products.designation);
      case 'price':
      case 'prixVente':
        return order(sql`CAST(${products.prixVente} AS NUMERIC)`);
      case 'stock':
      case 'stockActuel':
        return order(sql`CAST(${products.stockActuel} AS NUMERIC)`);
      case 'category':
        return order(products.category);
      case 'barcode':
      case 'codebar':
        return order(products.codebar);
      case 'created':
      case 'creeA':
        return order(products.creeA);
      case 'modified':
      case 'modifieA':
        return order(products.modifieA);
      default:
        // Default sorting by designation ascending
        return asc(products.designation);
    }
  }

  // Helper function to sort JavaScript arrays (for initials search)
  private sortProductsArray(products: Product[], sortBy?: string, sortOrder?: string): Product[] {
    if (!sortBy || sortBy === 'relevance') {
      return products; // Keep original relevance order for initials search
    }

    const isDesc = sortOrder?.toLowerCase() === 'desc';
    
    return [...products].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortBy) {
        case 'name':
        case 'designation':
          aVal = (a.designation || '').toLowerCase();
          bVal = (b.designation || '').toLowerCase();
          break;
        case 'price':
        case 'prixVente':
          aVal = parseFloat(a.prixVente || '0');
          bVal = parseFloat(b.prixVente || '0');
          break;
        case 'stock':
        case 'stockActuel':
          aVal = parseFloat(a.stockActuel || '0');
          bVal = parseFloat(b.stockActuel || '0');
          break;
        case 'category':
          aVal = (a.category || '').toLowerCase();
          bVal = (b.category || '').toLowerCase();
          break;
        case 'barcode':
        case 'codebar':
          aVal = (a.codebar || '').toLowerCase();
          bVal = (b.codebar || '').toLowerCase();
          break;
        case 'created':
        case 'creeA':
          aVal = new Date(a.creeA || 0);
          bVal = new Date(b.creeA || 0);
          break;
        case 'modified':
        case 'modifieA':
          aVal = new Date(a.modifieA || 0);
          bVal = new Date(b.modifieA || 0);
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });
  }

  async searchProducts(query?: string, category?: string, stockStatus?: string, limit = 10, offset = 0, sortBy?: string, sortOrder?: string): Promise<{ products: Product[], total: number }> {
    let whereConditions = [];
    let useInitialsFiltering = false;
    let initialsQuery = '';
    
    // Always filter for active products only (valide = true)
    whereConditions.push(eq(products.valide, true));
    
    if (query) {
      const searchTerms = query.trim().toLowerCase().split(/\s+/);
      
      if (searchTerms.length === 1) {
        const term = searchTerms[0];
        // Single term - check if it's numeric for price search
        const isSimpleNumeric = /^\d+(\.\d+)?$/.test(term);
        // Check if it's a potential initials pattern (2-6 letters)
        const isPotentialInitials = /^[a-zA-Z]{2,6}$/.test(term);
        
        if (isSimpleNumeric) {
          // Price search: search for exact price OR text containing the number
          const numericValue = parseFloat(term);
          const textQuery = `%${term}%`;
          const searchCondition = sql`(
            ${ilike(products.codebar, textQuery)} OR 
            ${ilike(products.designation, textQuery)} OR 
            ${ilike(products.category, textQuery)} OR
            CAST(${products.prixVente} AS NUMERIC) = ${numericValue}
          )`;
          whereConditions.push(searchCondition);
        } else if (isPotentialInitials) {
          // For potential initials, we'll get ALL products and filter in JS
          // Don't add any text search conditions - we want to check ALL products for initials
          // Initials search detected
          useInitialsFiltering = true;
          initialsQuery = term;
        } else {
          // Regular single term search
          const searchQuery = `%${term}%`;
          const searchCondition = sql`(
            ${ilike(products.codebar, searchQuery)} OR 
            ${ilike(products.designation, searchQuery)} OR 
            ${ilike(products.category, searchQuery)}
          )`;
          whereConditions.push(searchCondition);
        }
      } else {
        // Multiple terms: create individual conditions for each term
        // Each term must appear somewhere in the product (AND logic)
        for (const term of searchTerms) {
          const termQuery = `%${term}%`;
          const termCondition = sql`(
            ${ilike(products.codebar, termQuery)} OR 
            ${ilike(products.designation, termQuery)} OR 
            ${ilike(products.category, termQuery)}
          )`;
          whereConditions.push(termCondition);
        }
      }
    }
    
    if (category && category !== 'All Categories') {
      whereConditions.push(eq(products.category, category));
    }

    // Add stock status filtering
    if (stockStatus && stockStatus !== 'All Stock Levels') {
      const stockActuel = products.stockActuel;
      if (stockStatus === 'Out of Stock') {
        whereConditions.push(sql`CAST(${stockActuel} AS INTEGER) = 0`);
      } else if (stockStatus === 'Low Stock') {
        whereConditions.push(sql`CAST(${stockActuel} AS INTEGER) > 0 AND CAST(${stockActuel} AS INTEGER) < 10`);
      } else if (stockStatus === 'In Stock') {
        whereConditions.push(sql`CAST(${stockActuel} AS INTEGER) >= 10`);
      }
    }

    // Fixed whereClause construction with proper SQL template handling
    let whereClause;
    if (whereConditions.length === 0) {
      whereClause = undefined;
    } else if (whereConditions.length === 1) {
      // Just use the single condition directly
      whereClause = whereConditions[0];
    } else {
      // Combine multiple conditions with AND
      whereClause = whereConditions.reduce((acc, condition) => 
        sql`${acc} AND ${condition}`
      );
    }

    if (useInitialsFiltering) {
      // For initials search, get a larger set first, then filter
      // For initials search, get all products and filter in JavaScript
      const allResults = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(asc(products.designation));
      
      // Filter for initials matches + exact text matches
      const textMatches: Product[] = [];
      const initialsMatches: Product[] = [];
      
      for (const product of allResults) {
        const designation = product.designation || '';
        const codebar = product.codebar || '';
        const category = product.category || '';
        
        // Check if it matches initials first (prioritize initials over substring matches)
        if (this.matchesInitials(initialsQuery, designation)) {
          // Check if it matches initials
          initialsMatches.push(product);
        } else {
          // Check if it's a regular text match (only if no initials match)
          const searchLower = initialsQuery.toLowerCase();
          const isTextMatch = 
            designation.toLowerCase().includes(searchLower) ||
            codebar.toLowerCase().includes(searchLower) ||
            category.toLowerCase().includes(searchLower);
            
          if (isTextMatch) {
            textMatches.push(product);
          }
        }
      }
      
      // Combine results: initials matches first (prioritized), then text matches
      let combinedResults = [...initialsMatches, ...textMatches];
      
      // Apply sorting to combined results if requested
      combinedResults = this.sortProductsArray(combinedResults, sortBy, sortOrder);
      
      const totalCount = combinedResults.length;
      const paginatedResults = combinedResults.slice(offset, offset + limit);
      
      return {
        products: paginatedResults,
        total: totalCount
      };
    } else {
      // Regular search path
      // Get total count with same filters
      const [totalResult] = await db
        .select({ count: count() })
        .from(products)
        .where(whereClause);

      // Get products with limit and offset, applying sorting
      const productResults = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(this.getOrderByClause(sortBy, sortOrder))
        .limit(limit)
        .offset(offset);

      return {
        products: productResults,
        total: totalResult.count
      };
    }
  }

  async getProductAnalytics(productId: string): Promise<ProductWithAnalytics | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    
    if (!product) return undefined;

    const [analytics] = await db
      .select({
        minPrice: min(detailCommande.prixAchat),
        maxPrice: max(detailCommande.prixAchat),
        avgPrice: avg(detailCommande.prixAchat),
      })
      .from(detailCommande)
      .where(eq(detailCommande.produitId, productId));

    const [scansResult] = await db
      .select({ count: count() })
      .from(productScans)
      .where(eq(productScans.productId, productId));

    return {
      ...product,
      minPrice: analytics.minPrice || product.prixVente || '0',
      maxPrice: analytics.maxPrice || product.prixVente || '0',
      avgPrice: analytics.avgPrice || product.prixVente || '0',
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
      .where(eq(detailCommande.produitId, productId))
      .orderBy(desc(detailCommande.dateCommande));
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
      .from(products)
      .where(eq(products.valide, true));
    
    return result.count;
  }

  async getUniqueCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(sql`${products.category} IS NOT NULL AND ${products.category} != '' AND ${eq(products.valide, true)}`)
      .orderBy(asc(products.category));
    
    return results.map(result => result.category!).filter(Boolean);
  }
}

export const storage = new DatabaseStorage();
