import { apiRequest } from './client.js';

// Driver's own KYC documents that are expired or expiring within the next
// few days — powers the login popup in DriverDashboard.jsx. Returns
// { alerts: [{ documentType, label, expiryDate, daysUntilExpiry, isExpired }] }.
export const getDocumentAlerts = () => apiRequest('/drivers/me/document-alerts');

// Orders assigned to this driver, split by status — powers DeliveryPanel.jsx's
// Delivery/Delivered tabs. Returns { inProgress: [...], delivered: [...] }.
export const getDeliveries = () => apiRequest('/drivers/me/deliveries');
