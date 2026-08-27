import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import StarRating from '../marketplace/StarRating.jsx';

/**
 * Seller-side view of buyer feedback (rating + optional written comment) —
 * shared across the warehouse, shop, and reseller dashboards, each passing
 * its own `endpoint`:
 *   - warehouse: /warehouse/:id/feedback
 *   - shop:      /shop/:id/feedback
 *   - reseller:  /commerce/stores/:id/feedback
 *
 * An AFFILIATE order's feedback is tied to the StoreListing sold, so the
 * *same* underlying rows show up for both the warehouse that supplied the
 * item and the reseller who sold it — each endpoint just filters from its
 * own side of that relationship (see the backend routes' comments). A
 * STORE order's feedback only ever appears in that shop's panel.
 */
export default function FeedbackPanel({ endpoint, showSeller = false }) {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setFeedback(null);
    apiRequest(endpoint).then(setFeedback);
  }, [endpoint]);

  const itemTitleOf = (f) => f.storeListing?.masterProduct?.title ?? f.shopProduct?.title ?? 'Item';

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Feedback</h2>
          <p className="text-xs text-slate-500">Ratings and comments buyers left after their order was delivered.</p>
        </div>
      </div>

      {feedback === null && <p className="text-sm text-slate-500">Loading…</p>}
      {feedback?.length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}

      <div className="space-y-3">
        {feedback?.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{itemTitleOf(f)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {f.customer.fullName}
                  {showSeller && f.storeListing?.store && <> · sold via {f.storeListing.store.storeName}</>}
                  {' · '}
                  {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StarRating value={f.rating} size="w-4 h-4" />
            </div>
            {f.comment && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{f.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
