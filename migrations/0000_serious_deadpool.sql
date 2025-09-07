CREATE TABLE "detail_commande" (
	"id" integer PRIMARY KEY NOT NULL,
	"produit_id" integer NOT NULL,
	"prix_achat" numeric(10, 2) NOT NULL,
	"qte_achat" numeric(10, 2) NOT NULL,
	"date_commande" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_scans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"codebar" varchar(255),
	"designation" text,
	"prix_vente" numeric(10, 2),
	"stock_actuel" numeric(10, 2),
	"category" varchar(100),
	"image_url" text,
	"valide" boolean,
	"cree_a" timestamp,
	"cree_par" integer,
	"modifie_a" timestamp,
	"modifie_par" integer
);
--> statement-breakpoint
ALTER TABLE "detail_commande" ADD CONSTRAINT "detail_commande_produit_id_products_id_fk" FOREIGN KEY ("produit_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_scans" ADD CONSTRAINT "product_scans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;