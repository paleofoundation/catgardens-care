export const operationKinds = ['food_shortage', 'purchase', 'food_used', 'stock_adjustment', 'vet_visit', 'transport', 'care_update'] as const;
export type OperationKind = typeof operationKinds[number];
export const operationLabels: Record<OperationKind, string> = {
  food_shortage: 'Food / supplies running low', purchase: 'Purchase', food_used: 'Food / supplies used',
  stock_adjustment: 'Opening stock / adjustment', vet_visit: 'Vet visit', transport: 'Taxi / transport', care_update: 'Sanctuary update',
};
export const publicCats = [
  ['splotch', 'Splotch'], ['mabel', 'Mabel'], ['winona-p-gray', 'Winona'], ['gray-power', 'Gray Power'],
  ['gabriel', 'Gabriel'], ['poly', 'Poly'],
] as const;
export type OperationData = {
  title: string; notes: string; person: string; provider: string; amountCents: number | null;
  currency: string; paymentStatus: 'none' | 'planned' | 'paid'; item: string; unit: string; quantityDelta: number;
};
export type Operation = {
  id: string; kind: OperationKind; animalId: string | null; at: string; createdAt: string; author: string;
  data: OperationData; resolved: number; publicState: string; publicCatId: string | null;
  publicTitle: string; publicDetail: string; publicVersion: number; deliveredVersion: number; lastError: string | null;
  files: { id: string; name: string }[];
};
export function invalid(message: string): never { throw Object.assign(new Error(message), { status: 400 }); }
export function text(value: unknown, maximum: number) { return typeof value === 'string' ? value.trim().slice(0, maximum) : ''; }
export function uuid(value: unknown) { return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value); }
export function normalizeOperation(input: Record<string, unknown>) {
  if (!uuid(input.id)) invalid('Reload the form before saving.');
  if (!operationKinds.includes(input.kind as OperationKind)) invalid('Choose an operation type.');
  const kind = input.kind as OperationKind;
  const title = text(input.title, 160);
  if (!title) invalid('Describe what happened.');
  const at = text(input.at, 50);
  if (!at || !Number.isFinite(Date.parse(at)) || Date.parse(at) > Date.now() + 300000) invalid('Use the actual event date and time.');
  const amount = input.amount === '' || input.amount == null ? null : Number(input.amount);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1000000)) invalid('Enter a valid non-negative cost.');
  const paymentStatus = input.paymentStatus;
  if (!['none', 'planned', 'paid'].includes(String(paymentStatus))) invalid('Choose a cost status.');
  if (paymentStatus !== 'none' && amount === null) invalid('Enter the cost, or choose no cost recorded.');
  const currency = text(input.currency, 3).toUpperCase();
  if (!['EUR', 'USD', 'GBP'].includes(currency)) invalid('Choose EUR, USD, or GBP.');
  let quantityDelta = input.quantity === '' || input.quantity == null ? 0 : Number(input.quantity);
  if (!Number.isFinite(quantityDelta) || Math.abs(quantityDelta) > 1000000) invalid('Enter a valid stock quantity.');
  if (['purchase', 'food_used'].includes(kind) && quantityDelta < 0) invalid('Enter a positive quantity; the operation sets its direction.');
  if (kind === 'food_used') quantityDelta = -quantityDelta;
  if (!['purchase', 'food_used', 'stock_adjustment'].includes(kind)) quantityDelta = 0;
  const item = text(input.item, 120); const unit = text(input.unit, 30);
  if (quantityDelta && (!item || !unit)) invalid('Stock changes need an item and unit. Use the same names each time.');
  return { id: input.id as string, kind, at: new Date(at).toISOString(), animalId: text(input.animalId, 100) || null,
    data: { title, notes: text(input.notes, 6000), person: text(input.person, 100), provider: text(input.provider, 160),
      amountCents: amount === null ? null : Math.round(amount * 100), currency, paymentStatus,
      item, unit, quantityDelta } as OperationData };
}
export function publicSummary(input: Record<string, unknown>) {
  const catId = text(input.publicCatId, 60) || null;
  if (catId && !publicCats.some(([id]) => id === catId)) invalid('Choose the matching public cat or sanctuary-wide.');
  const title = text(input.publicTitle, 160), detail = text(input.publicDetail, 1600);
  if (!title || !detail) invalid('Write the separate public title and summary before approval.');
  return { catId, title, detail };
}
export function publicPayload(operation: Operation) {
  // Explicit allowlist: internal notes, costs, people, providers, and files never cross this boundary.
  return { source: 'catgardens-care', id: operation.id, version: operation.publicVersion,
    state: operation.publicState === 'withdrawn' ? 'withdrawn' : 'published',
    catId: operation.publicCatId, title: operation.publicTitle, detail: operation.publicDetail, occurredAt: operation.at };
}
export function operationTotals(operations: Operation[]) {
  const spent: Record<string, number> = {}, planned: Record<string, number> = {};
  const stock = new Map<string, { item: string; unit: string; quantity: number }>();
  for (const operation of operations) {
    const d = operation.data;
    const target = d.paymentStatus === 'paid' ? spent : d.paymentStatus === 'planned' ? planned : null;
    if (target && d.amountCents !== null) target[d.currency] = (target[d.currency] || 0) + d.amountCents;
    if (d.item && d.unit && d.quantityDelta) {
      const key = JSON.stringify([d.item.toLocaleLowerCase(), d.unit.toLocaleLowerCase()]);
      const row = stock.get(key) || { item: d.item, unit: d.unit, quantity: 0 };
      row.quantity += d.quantityDelta; stock.set(key, row);
    }
  }
  return { spent, planned, stock: [...stock.values()], shortages: operations.filter(o => o.kind === 'food_shortage' && !o.resolved) };
}
