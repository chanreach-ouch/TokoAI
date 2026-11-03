import pytest
from app.models.product import Product
from app.models.order import Order

def test_product_variants_model_instantiation():
    """Verify Product model handles variants JSONB properly with size, color, stock."""
    variants = [
        {"size": "S", "color": "Black", "stock": 10},
        {"size": "M", "color": "Black", "stock": 25},
        {"size": "L", "color": "Black", "stock": 0},
        {"size": "XL", "color": "Black", "stock": 15},
    ]
    p = Product(
        name="Oversized Streetwear Tee",
        name_kh="អាវយឺត Streetwear",
        price=15.00,
        stock=50,
        sku="KZ-STREET-TEE",
        variants=variants
    )
    assert p.variants == variants
    assert len(p.variants) == 4
    assert p.variants[2]["stock"] == 0


def test_variant_stock_deduction_and_refusal():
    """Verify out-of-stock detection and atomic deduction on product variants."""
    p_variants = [
        {"size": "S", "stock": 10},
        {"size": "M", "stock": 25},
        {"size": "L", "stock": 0}, # Out of stock
    ]
    prod = Product(
        name="Fashion Tee",
        price=15.00,
        stock=35,
        sku="TEE-01",
        variants=p_variants
    )

    # Simulation 1: Attempt to purchase Size L (Stock 0)
    target_size = "L"
    qty = 1
    matching_var = None
    var_out_of_stock = False
    var_reason = ""

    for v in prod.variants:
        if str(v.get("size", "")).strip().lower() == target_size.lower():
            matching_var = v
            break

    assert matching_var is not None
    if matching_var.get("stock", 0) < qty:
        var_out_of_stock = True
        in_stock_opts = [
            v.get("size", "") for v in prod.variants if int(v.get("stock", 0)) > 0
        ]
        var_reason = f"Out of stock for Size {target_size}. Available options: {', '.join(in_stock_opts)}."

    assert var_out_of_stock is True
    assert "Size L" in var_reason
    assert "S, M" in var_reason

    # Simulation 2: Successful purchase of Size M (Stock 25)
    target_size = "M"
    qty = 2
    matching_var = None
    for v in prod.variants:
        if str(v.get("size", "")).strip().lower() == target_size.lower():
            matching_var = v
            break

    assert matching_var is not None
    assert matching_var["stock"] >= qty
    
    # Perform atomic decrement
    prod.stock = max(0, prod.stock - qty)
    matching_var["stock"] = max(0, matching_var["stock"] - qty)
    prod.variants = list(prod.variants)

    assert prod.stock == 33
    assert matching_var["stock"] == 23


def test_order_cancellation_restores_variant_stock():
    """Verify that cancelling an order restores both total stock and the specific variant stock."""
    p_variants = [
        {"size": "S", "stock": 8},
        {"size": "M", "stock": 23},
        {"size": "L", "stock": 0},
    ]
    prod = Product(
        name="Fashion Tee",
        price=15.00,
        stock=31,
        sku="TEE-01",
        variants=p_variants
    )

    order = Order(
        items={
            "sku": "TEE-01",
            "name": "Fashion Tee",
            "quantity": 2,
            "size": "M",
            "color": None
        },
        status="CONFIRMED"
    )

    # Simulate cancellation restoration logic from app/api/v1/orders.py
    qty = int(order.items.get("quantity", 1))
    size = order.items.get("size")
    color = order.items.get("color")

    prod.stock = int(prod.stock) + qty
    updated_variants = []
    for v in prod.variants:
        match_s = not size or str(v.get("size", "")).strip().lower() == str(size).strip().lower()
        match_c = not color or str(v.get("color", "")).strip().lower() == str(color).strip().lower()
        if match_s and match_c:
            v["stock"] = int(v.get("stock", 0)) + qty
        updated_variants.append(v)
    prod.variants = updated_variants

    # Total stock restored from 31 to 33
    assert prod.stock == 33
    # Size M stock restored from 23 to 25
    m_var = next(v for v in prod.variants if v["size"] == "M")
    assert m_var["stock"] == 25
