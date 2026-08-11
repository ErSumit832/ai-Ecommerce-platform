"""
Seeds the database with demo categories, products (using free Unsplash stock
photo URLs) and an admin account, so the frontend has real data to render
without waiting on manual data entry.

Run with:
    python -m scripts.seed_data
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import Category, Product, User, UserRole

Base.metadata.create_all(bind=engine)

CATEGORIES = ["Laptops", "Monitors", "Keyboards & Mice", "Networking", "Cloud & DevOps Gear", "Audio"]

PRODUCTS = [
    dict(name="DevStation Pro 16 Laptop", brand="DevStation", price=1899.00, compare_at_price=2099.00,
         stock_quantity=25, category="Laptops",
         image_url="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
         tags="laptop devops kubernetes docker development 32gb ram",
         description="16-inch developer laptop with 32GB RAM, 1TB NVMe SSD — built for running Docker, "
                      "Kubernetes clusters, and multiple VMs without breaking a sweat."),
    dict(name="CloudBook Air 14", brand="CloudBook", price=1199.00, compare_at_price=None,
         stock_quantity=40, category="Laptops",
         image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
         tags="laptop lightweight portable engineer",
         description="Ultra-light 14-inch laptop for engineers who travel — 16GB RAM, all-day battery."),
    dict(name="UltraWide DevOps Monitor 34\"", brand="ViewMax", price=549.00, compare_at_price=649.00,
         stock_quantity=30, category="Monitors",
         image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
         tags="monitor ultrawide kubernetes dashboards grafana multitasking",
         description="34-inch curved ultrawide monitor — perfect for tiling terminals, Grafana dashboards, "
                      "and IDE panes side by side."),
    dict(name="4K Productivity Monitor 27\"", brand="ViewMax", price=379.00, compare_at_price=None,
         stock_quantity=50, category="Monitors",
         image_url="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800",
         tags="monitor 4k sharp text coding",
         description="27-inch 4K monitor with crisp text rendering, ideal for long coding sessions."),
    dict(name="Mechanical Keyboard - Silent Switches", brand="KeyForge", price=129.00, compare_at_price=149.00,
         stock_quantity=60, category="Keyboards & Mice",
         image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
         tags="keyboard mechanical silent typing programming",
         description="Full-size mechanical keyboard with silent tactile switches — built for long typing sessions."),
    dict(name="Ergonomic Wireless Mouse", brand="KeyForge", price=59.00, compare_at_price=None,
         stock_quantity=80, category="Keyboards & Mice",
         image_url="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
         tags="mouse ergonomic wireless office",
         description="Vertical ergonomic mouse designed to reduce wrist strain during long work sessions."),
    dict(name="Gigabit 8-Port Managed Switch", brand="NetCore", price=89.00, compare_at_price=None,
         stock_quantity=35, category="Networking",
         image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800",
         tags="networking switch homelab devops infrastructure",
         description="8-port managed gigabit switch with VLAN support — great for home labs and small racks."),
    dict(name="Mini Rack Server (Homelab Edition)", brand="RackForge", price=749.00, compare_at_price=899.00,
         stock_quantity=15, category="Cloud & DevOps Gear",
         image_url="https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800",
         tags="server rack homelab kubernetes cluster devops self-hosted",
         description="Compact 1U server ideal for running a self-hosted Kubernetes cluster or CI/CD runners."),
    dict(name="USB-C Docking Station (12-in-1)", brand="ConnectPro", price=139.00, compare_at_price=None,
         stock_quantity=45, category="Cloud & DevOps Gear",
         image_url="https://images.unsplash.com/photo-1618410320928-25228d811631?w=800",
         tags="dock usb-c docking station laptop accessory",
         description="12-in-1 USB-C docking station — dual 4K output, gigabit ethernet, and 100W PD passthrough."),
    dict(name="Noise-Cancelling Headphones", brand="AudioSphere", price=249.00, compare_at_price=299.00,
         stock_quantity=55, category="Audio",
         image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
         tags="headphones noise cancelling focus deep work",
         description="Over-ear ANC headphones for deep-focus work and noise-free video calls."),
]


def run():
    db = SessionLocal()
    try:
        category_map: dict[str, Category] = {}
        for name in CATEGORIES:
            slug = name.lower().replace(" & ", "-").replace(" ", "-")
            existing = db.query(Category).filter_by(slug=slug).first()
            if not existing:
                existing = Category(name=name, slug=slug)
                db.add(existing)
                db.flush()
            category_map[name] = existing

        for p in PRODUCTS:
            slug = p["name"].lower().replace(" ", "-").replace('"', "").replace("&", "and")
            if db.query(Product).filter_by(slug=slug).first():
                continue
            db.add(Product(
                name=p["name"], slug=slug, description=p["description"], price=p["price"],
                compare_at_price=p["compare_at_price"], stock_quantity=p["stock_quantity"],
                image_url=p["image_url"], brand=p["brand"], tags=p["tags"],
                category_id=category_map[p["category"]].id,
            ))

        if not db.query(User).filter_by(email="admin@ecommerce.local").first():
            db.add(User(
                full_name="Platform Admin", email="admin@ecommerce.local",
                hashed_password=hash_password("Admin123!"), role=UserRole.ADMIN,
            ))

        db.commit()
        print("Seed complete. Admin login: admin@ecommerce.local / Admin123!")
    finally:
        db.close()


if __name__ == "__main__":
    run()
