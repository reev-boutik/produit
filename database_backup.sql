--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: detail_commande; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.detail_commande (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    commande_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.detail_commande OWNER TO neondb_owner;

--
-- Name: product_scans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_scans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    scanned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_scans OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    codebar character varying(255) NOT NULL,
    designation text NOT NULL,
    current_price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    category character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Data for Name: detail_commande; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.detail_commande (id, product_id, price, quantity, commande_date) FROM stdin;
231ecb74-3fc6-4c21-ac95-60b4993d4c0a	bec412a8-4c4c-41d5-9a2c-846eb351bc95	729.70	2	2025-08-24 23:41:27.744835
ba89e1a5-0cf7-40a2-bee4-0ea1cec270af	1fc3fb93-bfca-4455-b2c7-a5face6f74c8	918.85	1	2025-08-24 23:41:27.744835
3509f665-fc02-4922-af67-e067b6465c21	1ddec026-5b9c-4547-aae5-b7295295408f	132.03	6	2025-08-24 23:41:27.744835
3970e687-b80d-461d-995f-aa0458cff049	2e4098f9-c134-4437-86b4-f8412b61e6e1	104.27	4	2025-08-24 23:41:27.744835
9db2c5a4-2ff1-4253-bd02-a30facaecdb0	309df3f1-c13b-4bad-b01c-83b054243dd5	40.80	3	2025-08-24 23:41:27.744835
\.


--
-- Data for Name: product_scans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_scans (id, product_id, scanned_at) FROM stdin;
0f5b71d9-0be7-4c4a-9906-110cb9b7b3f5	bec412a8-4c4c-41d5-9a2c-846eb351bc95	2025-08-24 23:44:56.59287
05f7bea3-7d14-4b21-9628-9c2e9f148424	1fc3fb93-bfca-4455-b2c7-a5face6f74c8	2025-08-24 23:48:33.822202
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, codebar, designation, current_price, stock_quantity, category, created_at, updated_at) FROM stdin;
bec412a8-4c4c-41d5-9a2c-846eb351bc95	123456789012	Apple iPhone 15	899.99	25	Electronics	2025-08-24 23:41:14.800775	2025-08-24 23:41:14.800775
1fc3fb93-bfca-4455-b2c7-a5face6f74c8	987654321098	Samsung Galaxy S24	799.99	18	Electronics	2025-08-24 23:41:14.800775	2025-08-24 23:41:14.800775
1ddec026-5b9c-4547-aae5-b7295295408f	456789123456	Nike Air Max Shoes	129.99	45	Clothing	2025-08-24 23:41:14.800775	2025-08-24 23:41:14.800775
2e4098f9-c134-4437-86b4-f8412b61e6e1	789456123789	Coffee Maker Deluxe	89.99	12	Home & Garden	2025-08-24 23:41:14.800775	2025-08-24 23:41:14.800775
309df3f1-c13b-4bad-b01c-83b054243dd5	321654987321	Protein Powder 2kg	49.99	8	Health & Beauty	2025-08-24 23:41:14.800775	2025-08-24 23:41:14.800775
\.


--
-- Name: detail_commande detail_commande_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.detail_commande
    ADD CONSTRAINT detail_commande_pkey PRIMARY KEY (id);


--
-- Name: product_scans product_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_scans
    ADD CONSTRAINT product_scans_pkey PRIMARY KEY (id);


--
-- Name: products products_codebar_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_codebar_unique UNIQUE (codebar);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: detail_commande detail_commande_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.detail_commande
    ADD CONSTRAINT detail_commande_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_scans product_scans_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_scans
    ADD CONSTRAINT product_scans_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

