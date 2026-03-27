export function calcTotals(items, productsMap) {
  let subtotal = 0;

  for (const it of items) {
    const p = productsMap.get(String(it.product));
    if (!p) continue;

    // اختار السعر: بعد الخصم لو موجود وإلا السعر العادي
    const unit = typeof p.priceAfterDiscount === "number" && p.priceAfterDiscount > 0
      ? p.priceAfterDiscount
      : p.price;

    subtotal += unit * it.qty;
  }

  // حاليا total = subtotal (ممكن تضيف شحن/كوبون بعدين)
  const total = subtotal;

  return { subtotal, total };
}
