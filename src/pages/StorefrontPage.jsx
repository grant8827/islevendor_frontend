import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

export default function StorefrontPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest(`/commerce/stores/${slug}`, { auth: false })
      .then(setStore)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p role="alert">{error}</p>;
  if (!store) return <p>Loading…</p>;

  return (
    <section>
      <h2>{store.storeName}</h2>
      <ul>
        {store.listings.map((listing) => (
          <li key={listing.id}>
            {listing.masterProduct.title} — JMD {listing.retailPriceJmd}
          </li>
        ))}
        {store.listings.length === 0 && <li>No products listed yet.</li>}
      </ul>
    </section>
  );
}
