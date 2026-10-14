// An order can hold several items (everything bought from one business in
// one checkout). These read them off any order the API returns — falling
// back to the single storeListing/shopProduct an older response carries.

export function itemsOf(order) {
  if (order.items?.length) return order.items;
  const title = order.storeListing?.masterProduct?.title ?? order.shopProduct?.title;
  return title ? [{ id: order.id, title, quantity: order.quantity ?? 1 }] : [];
}

/** "Kettle", or "Kettle + 2 more". */
export function itemsSummary(order) {
  const items = itemsOf(order);
  if (items.length === 0) return 'Item';
  return items.length === 1 ? items[0].title : `${items[0].title} + ${items.length - 1} more`;
}

/** "2 × Kettle, 1 × Toaster". */
export function itemsList(order) {
  return itemsOf(order)
    .map((item) => `${item.quantity} × ${item.title}`)
    .join(', ');
}
