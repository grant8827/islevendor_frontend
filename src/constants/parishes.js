// Jamaica's 14 parishes — kept in one place so every onboarding form (and
// the older WarehouseSetupForm) picks from the same list. Coordinates are
// no longer needed client-side for the onboarding wizards: the backend
// derives a parish centroid itself (see backend-node/src/lib/parishes.ts).
export const PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Catherine',
  'Clarendon',
  'Manchester',
  'St. Elizabeth',
  'Westmoreland',
  'Hanover',
  'St. James',
  'Trelawny',
  'St. Ann',
  'St. Mary',
  'Portland',
  'St. Thomas',
];

// NCB, BNS (Scotiabank), JN, Sagicor Bank, JMMB, FGB — the six commercial
// banks named in ISLE-101's spec.
export const JM_BANKS = [
  'National Commercial Bank (NCB)',
  'Bank of Nova Scotia Jamaica (BNS)',
  'Jamaica National Bank (JN)',
  'Sagicor Bank Jamaica',
  'JMMB Bank',
  'First Global Bank (FGB)',
];
