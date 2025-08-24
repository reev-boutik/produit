import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codebar: varchar("codebar", { length: 255 }).notNull().unique(),
  designation: text("designation").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const detailCommande = pgTable("detail_commande", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  commandeDate: timestamp("commande_date").defaultNow(),
});

export const productScans = pgTable("product_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  scannedAt: timestamp("scanned_at").defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  detailCommandes: many(detailCommande),
  scans: many(productScans),
}));

export const detailCommandeRelations = relations(detailCommande, ({ one }) => ({
  product: one(products, {
    fields: [detailCommande.productId],
    references: [products.id],
  }),
}));

export const productScansRelations = relations(productScans, ({ one }) => ({
  product: one(products, {
    fields: [productScans.productId],
    references: [products.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDetailCommandeSchema = createInsertSchema(detailCommande).omit({
  id: true,
  commandeDate: true,
});

export const insertProductScanSchema = createInsertSchema(productScans).omit({
  id: true,
  scannedAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type DetailCommande = typeof detailCommande.$inferSelect;
export type InsertDetailCommande = z.infer<typeof insertDetailCommandeSchema>;
export type ProductScan = typeof productScans.$inferSelect;
export type InsertProductScan = z.infer<typeof insertProductScanSchema>;

export type ProductWithAnalytics = Product & {
  minPrice: string;
  maxPrice: string;
  avgPrice: string;
  scansCount: number;
};
