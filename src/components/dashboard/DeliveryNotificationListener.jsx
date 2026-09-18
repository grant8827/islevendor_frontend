import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '../../lib/socket.js';
import { useToast } from '../../context/ToastContext.jsx';

// Joins this warehouse/shop's socket room and shows a toast the instant a
// driver marks one of its orders DELIVERED (see backend-node's
// dispatch.routes.ts's ORDER_DELIVERED emit). Purely a live "heads up" — the
// Orders tab's Proof column (see OrdersPanel.jsx) is the real source of
// truth and works whether or not this is connected; a missed notification
// just means finding out on the next dashboard visit instead of instantly.
export default function DeliveryNotificationListener({ kind, id }) {
  const { notify } = useToast();

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit(kind === 'shop' ? 'shop:join' : 'warehouse:join', id);

    const onDelivered = () => notify('A driver just delivered one of your orders!');
    socket.on('ORDER_DELIVERED', onDelivered);

    return () => {
      socket.off('ORDER_DELIVERED', onDelivered);
      disconnectSocket();
    };
  }, [kind, id, notify]);

  return null;
}
