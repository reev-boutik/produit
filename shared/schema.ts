import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: integer("id").primaryKey(),
  articleId: varchar("article_id", { length: 255 }),
  codebar: varchar("codebar", { length: 255 }),
  designation: text("designation"),
  prixVente: decimal("prix_vente", { precision: 10, scale: 2 }),
  stockActuel: decimal("stock_actuel", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }),
  imageUrl: text("image_url"),
  valide: boolean("valide"),
  creeA: timestamp("cree_a"),
  creePar: integer("cree_par"),
  modifieA: timestamp("modifie_a"),
  modifiePar: integer("modifie_par"),
});

export const detailCommande = pgTable("detail_commande", {
  id: integer("id").primaryKey(),
  produitId: integer("produit_id").notNull().references(() => products.id),
  prixAchat: decimal("prix_achat", { precision: 10, scale: 2 }).notNull(),
  qteAchat: decimal("qte_achat", { precision: 10, scale: 2 }).notNull(),
  dateCommande: timestamp("date_commande"),
});

export const productScans = pgTable("product_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: integer("product_id").notNull().references(() => products.id),
  scannedAt: timestamp("scanned_at").defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  detailCommandes: many(detailCommande),
  scans: many(productScans),
}));

export const detailCommandeRelations = relations(detailCommande, ({ one }) => ({
  product: one(products, {
    fields: [detailCommande.produitId],
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
