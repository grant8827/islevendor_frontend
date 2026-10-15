import PackingQueue from '../../components/dashboard/PackingQueue.jsx';

export default function PackingQueuePanel({ shopId, shop }) {
  return (
    <PackingQueue
      ordersEndpoint={`/shop/${shopId}/orders`}
      seller={{ name: shop.shopName, addressLine: shop.addressLine, parish: shop.parish }}
      shareOf={(order) =>
        `Your share: J$${Number(order.resellerMarginJmd).toLocaleString()}` +
        (Number(order.sellerDeliveryFeeJmd) > 0 ? ` + J$${Number(order.sellerDeliveryFeeJmd).toLocaleString()} delivery` : '')
      }
    />
  );
}
