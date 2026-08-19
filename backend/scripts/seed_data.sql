-- ============================================================================
-- seed_data.sql
--
-- Seeds the "categories" and "products" tables with 25 realistic demo
-- products across 6 categories. Matches the schema defined in
-- backend/app/db/models.py (Category, Product).
--
-- Safe to re-run: categories and products are matched by their unique slug,
-- so existing rows are left untouched and nothing is duplicated.
--
-- Usage:
--   psql "$DATABASE_URL" -f seed_data.sql
--   # or, from inside the backend container/venv:
--   psql -h localhost -U ecommerce_user -d ecommerce_db -f seed_data.sql
--
-- Requires the tables to already exist (run the FastAPI app once, or run
-- migrations, before applying this file).
-- ============================================================================

BEGIN;

-- gen_random_uuid() is built into PostgreSQL 13+. Uncomment below if your
-- server is older and the function is not found:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Categories
-- ----------------------------------------------------------------------------

INSERT INTO categories (id, name, slug) VALUES
  (gen_random_uuid()::text, 'Laptops',     'laptops'),
  (gen_random_uuid()::text, 'Monitors',    'monitors'),
  (gen_random_uuid()::text, 'Keyboards',   'keyboards'),
  (gen_random_uuid()::text, 'Mice',        'mice'),
  (gen_random_uuid()::text, 'Headphones',  'headphones'),
  (gen_random_uuid()::text, 'Smartphones', 'smartphones')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------------------

-- Laptops (5)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Vector 15 Ultrabook', 'vector-15-ultrabook',
 'A 15-inch ultrabook built for travel — 1.3kg, all-day battery, and a 16GB/512GB configuration that handles everyday business work without compromise.',
 1349.00, 1499.00, 40, 'https://source.unsplash.com/800x600/?laptop,ultrabook', 'ProLine',
 'laptop ultrabook lightweight business travel 16gb', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'laptops')),

(gen_random_uuid()::text, 'Titan Workstation 17', 'titan-workstation-17',
 'A 17-inch mobile workstation with a discrete GPU, 64GB RAM, and a 2TB NVMe drive — built for 3D rendering, video editing, and heavy multitasking.',
 2499.00, NULL, 18, 'https://source.unsplash.com/800x600/?laptop,workstation', 'ForgeTech',
 'laptop workstation gaming rendering high-performance 64gb', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'laptops')),

(gen_random_uuid()::text, 'Nimbus Slim 13', 'nimbus-slim-13',
 'A compact 13-inch laptop for students and everyday use — fanless design, 12-hour battery life, and a sharp 1080p display.',
 999.00, NULL, 55, 'https://source.unsplash.com/800x600/?laptop,student', 'CloudBook',
 'laptop slim student everyday portable', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'laptops')),

(gen_random_uuid()::text, 'Apex DevPro 16', 'apex-devpro-16',
 'A 16-inch developer laptop with 32GB RAM and a 1TB NVMe SSD — comfortably runs Docker, local Kubernetes clusters, and multiple VMs at once.',
 1899.00, 2099.00, 22, 'https://source.unsplash.com/800x600/?laptop,coding', 'DevStation',
 'laptop developer devops docker kubernetes 32gb', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'laptops')),

(gen_random_uuid()::text, 'Voyager 2-in-1 Convertible', 'voyager-2-in-1-convertible',
 'A touchscreen 2-in-1 that folds into a tablet — stylus included, 11-hour battery, ideal for note-taking and light creative work on the go.',
 1149.00, NULL, 30, 'https://source.unsplash.com/800x600/?laptop,tablet', 'TrailTech',
 'laptop convertible touchscreen tablet hybrid stylus', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'laptops'));

-- Monitors (4)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Horizon 27 QHD Monitor', 'horizon-27-qhd-monitor',
 'A 27-inch QHD monitor with a 165Hz refresh rate and factory-calibrated color — equally at home for coding, design work, or gaming.',
 329.00, 379.00, 60, 'https://source.unsplash.com/800x600/?monitor,desk', 'ViewMax',
 'monitor qhd 165hz color-accurate', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'monitors')),

(gen_random_uuid()::text, 'Spectrum 32 4K UHD Monitor', 'spectrum-32-4k-uhd-monitor',
 'A 32-inch 4K display with crisp text rendering and wide color coverage — built for long coding sessions and detailed photo/video work.',
 549.00, NULL, 35, 'https://source.unsplash.com/800x600/?monitor,4k', 'ViewMax',
 'monitor 4k sharp text coding photo-editing', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'monitors')),

(gen_random_uuid()::text, 'Curve Pro 34 Ultrawide', 'curve-pro-34-ultrawide',
 'A 34-inch curved ultrawide monitor — perfect for tiling terminals, dashboards, and IDE panes side by side without a second screen.',
 699.00, 799.00, 20, 'https://source.unsplash.com/800x600/?monitor,ultrawide', 'ArcDisplay',
 'monitor ultrawide curved multitasking dashboards', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'monitors')),

(gen_random_uuid()::text, 'Studio 24 IPS Monitor', 'studio-24-ips-monitor',
 'A budget-friendly 24-inch IPS monitor with accurate color and thin bezels — a solid everyday second display.',
 219.00, NULL, 70, 'https://source.unsplash.com/800x600/?monitor,office', 'PixelForge',
 'monitor ips budget second-display', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'monitors'));

-- Keyboards (4)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Mechtype K1 Mechanical Keyboard', 'mechtype-k1-mechanical-keyboard',
 'A full-size mechanical keyboard with hot-swappable switches and per-key RGB — built for long typing sessions and easy customization.',
 99.00, 119.00, 80, 'https://source.unsplash.com/800x600/?keyboard,mechanical', 'KeyForge',
 'keyboard mechanical hot-swappable rgb typing', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'keyboards')),

(gen_random_uuid()::text, 'Compact 60% Mechanical Keyboard', 'compact-60-mechanical-keyboard',
 'A minimalist 60% mechanical keyboard that frees up desk space without giving up a satisfying, tactile typing feel.',
 79.00, NULL, 65, 'https://source.unsplash.com/800x600/?keyboard,compact', 'KeyForge',
 'keyboard mechanical compact 60-percent minimalist', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'keyboards')),

(gen_random_uuid()::text, 'Ergo Split Keyboard', 'ergo-split-keyboard',
 'A split ergonomic keyboard with an adjustable tenting angle — designed to reduce wrist and shoulder strain during full workdays.',
 159.00, NULL, 25, 'https://source.unsplash.com/800x600/?keyboard,ergonomic', 'FlexKey',
 'keyboard ergonomic split wrist-friendly', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'keyboards')),

(gen_random_uuid()::text, 'Wireless Slim Keyboard', 'wireless-slim-keyboard',
 'A low-profile wireless keyboard with a quiet typing feel and a 3-month battery life — built for a clean, cable-free desk setup.',
 59.00, 69.00, 90, 'https://source.unsplash.com/800x600/?keyboard,wireless', 'QuietType',
 'keyboard wireless slim quiet office', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'keyboards'));

-- Mice (4)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Precision Pro Wireless Mouse', 'precision-pro-wireless-mouse',
 'A reliable wireless mouse with a precise optical sensor and a 70-day battery life — an everyday driver for office and home use.',
 49.00, NULL, 100, 'https://source.unsplash.com/800x600/?computer,mouse', 'QuietType',
 'mouse wireless precise everyday office', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'mice')),

(gen_random_uuid()::text, 'Vertical Ergo Mouse', 'vertical-ergo-mouse',
 'A vertical ergonomic mouse that keeps the wrist in a natural handshake position — designed to reduce strain over long work sessions.',
 54.00, 64.00, 45, 'https://source.unsplash.com/800x600/?ergonomic,mouse', 'FlexKey',
 'mouse ergonomic vertical wrist-friendly', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'mice')),

(gen_random_uuid()::text, 'Featherlight Gaming Mouse', 'featherlight-gaming-mouse',
 'An ultra-light 62g gaming mouse with a high-DPI sensor and customizable side buttons — built for fast, precise tracking.',
 69.00, NULL, 50, 'https://source.unsplash.com/800x600/?gaming,mouse', 'StrikeGear',
 'mouse gaming lightweight high-dpi', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'mice')),

(gen_random_uuid()::text, 'Trackball Control Mouse', 'trackball-control-mouse',
 'A stationary trackball mouse that eliminates arm movement entirely — a favorite for tight desks and repetitive strain relief.',
 89.00, 99.00, 20, 'https://source.unsplash.com/800x600/?trackball,mouse', 'OrbitTech',
 'mouse trackball ergonomic stationary', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'mice'));

-- Headphones (4)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Aura ANC Over-Ear Headphones', 'aura-anc-over-ear-headphones',
 'Over-ear active noise-cancelling headphones with 30-hour battery life — built for deep-focus work and noise-free calls.',
 249.00, 299.00, 40, 'https://source.unsplash.com/800x600/?headphones,anc', 'AudioSphere',
 'headphones anc noise-cancelling focus wireless', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'headphones')),

(gen_random_uuid()::text, 'Pulse Wireless Earbuds', 'pulse-wireless-earbuds',
 'True wireless earbuds with adaptive noise cancellation and a compact charging case — 6 hours per charge, 24 with the case.',
 129.00, NULL, 75, 'https://source.unsplash.com/800x600/?earbuds,wireless', 'AudioSphere',
 'earbuds wireless true-wireless anc compact', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'headphones')),

(gen_random_uuid()::text, 'StudioMonitor Reference Headphones', 'studiomonitor-reference-headphones',
 'Wired reference headphones with a flat frequency response — built for audio production, mixing, and critical listening.',
 199.00, NULL, 30, 'https://source.unsplash.com/800x600/?studio,headphones', 'SoundCraft',
 'headphones wired studio reference audio-production', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'headphones')),

(gen_random_uuid()::text, 'SportFit Wireless Earbuds', 'sportfit-wireless-earbuds',
 'Sweat-resistant wireless earbuds with a secure ear-hook fit — built for running, workouts, and outdoor use.',
 89.00, 109.00, 60, 'https://source.unsplash.com/800x600/?earbuds,sport', 'PulseAudio',
 'earbuds wireless sport sweat-resistant workout', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'headphones'));

-- Smartphones (4)
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock_quantity, image_url, brand, tags, rating_avg, rating_count, is_active, created_at, category_id) VALUES
(gen_random_uuid()::text, 'Nova X12 Smartphone', 'nova-x12-smartphone',
 'A flagship smartphone with a 6.5-inch OLED display, triple-camera system, and all-day battery life — 256GB storage.',
 899.00, 999.00, 25, 'https://source.unsplash.com/800x600/?smartphone,flagship', 'Novatech',
 'smartphone flagship oled camera 256gb', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'smartphones')),

(gen_random_uuid()::text, 'Nova X12 Lite', 'nova-x12-lite',
 'A more affordable take on the X12 — same core camera and battery experience in a lighter, 128GB configuration.',
 599.00, NULL, 40, 'https://source.unsplash.com/800x600/?smartphone,budget', 'Novatech',
 'smartphone budget lightweight 128gb', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'smartphones')),

(gen_random_uuid()::text, 'Zenith Pro 5G Smartphone', 'zenith-pro-5g-smartphone',
 'A 5G smartphone with a 120Hz display, fast charging, and a 512GB option — built for power users who want zero compromises.',
 1099.00, 1199.00, 15, 'https://source.unsplash.com/800x600/?smartphone,5g', 'ZenMobile',
 'smartphone 5g 120hz fast-charging premium', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'smartphones')),

(gen_random_uuid()::text, 'Aspect Compact Smartphone', 'aspect-compact-smartphone',
 'A compact 5.8-inch smartphone for people who miss one-handed use — full flagship-tier chipset in a smaller body.',
 499.00, NULL, 35, 'https://source.unsplash.com/800x600/?smartphone,compact', 'AspectMobile',
 'smartphone compact one-handed small', 0, 0, true, now(),
 (SELECT id FROM categories WHERE slug = 'smartphones'));

ON CONFLICT (slug) DO NOTHING;

COMMIT;
