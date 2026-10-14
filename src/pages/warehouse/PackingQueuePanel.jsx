import PackingQueue from '../../components/dashboard/PackingQueue.jsx';

export default function PackingQueuePanel({ warehouseId, warehouse }) {
  return (
    <PackingQueue
      ordersEndpoint={`/warehouse/${warehouseId}/orders`}
      seller={{ name: warehouse.name, addressLine: warehouse.addressLine, parish: warehouse.parish }}
      shareOf={(order) =>
        `Wholesale share: J$${Number(order.wholesaleTotalJmd).toLocaleString()}` +
        (Number(order.sellerDeliveryFeeJmd) > 0 ? ` + J$${Number(order.sellerDeliveryFeeJmd).toLocaleString()} delivery` : '')
      }
      showReseller
    />
  );
}
