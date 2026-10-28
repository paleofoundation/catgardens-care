import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOperation, publicPayload, publicSummary, operationTotals } from '../lib/operations.ts';
const input={id:'be1e3874-10bb-4aab-9e97-ea99ff70f507',kind:'purchase',title:'Food bought',at:'2026-01-01T10:00:00Z',amount:'12.50',currency:'EUR',paymentStatus:'paid',item:'Food',unit:'kg',quantity:'5',person:'Chanda',provider:'Food shop',notes:'Private receipt details'};
const saved=(patch={})=>{const o=normalizeOperation({...input,...patch});return {...o,createdAt:o.at,author:'Karen',resolved:0,publicState:'approved',publicCatId:'splotch',publicTitle:'Food arrived',publicDetail:'The sanctuary has a fresh delivery.',publicVersion:1,deliveredVersion:0,lastError:null,files:[{id:'private',name:'receipt.pdf'}]};};
test('paid costs, planned costs and stock movements remain distinct',()=>{
  const totals=operationTotals([saved(),saved({kind:'food_used',amount:'',paymentStatus:'none',quantity:'2'}),saved({kind:'transport',amount:'20',paymentStatus:'planned',quantity:''})]);
  assert.equal(totals.spent.EUR,1250);assert.equal(totals.planned.EUR,2000);assert.equal(totals.stock[0].quantity,3);
});
test('public payload excludes people, costs, receipts and internal notes',()=>{
  const payload=publicPayload(saved());assert.deepEqual(Object.keys(payload).sort(),['source','id','version','state','catId','title','detail','occurredAt'].sort());
  assert.ok(!JSON.stringify(payload).includes('Chanda'));assert.ok(!JSON.stringify(payload).includes('receipt'));assert.ok(!JSON.stringify(payload).includes('12.50'));
});
test('publication requires a separate complete summary and explicit public cat',()=>{
  assert.throws(()=>publicSummary({publicTitle:'Visit',publicDetail:'',publicCatId:'splotch'}));
  assert.throws(()=>publicSummary({publicTitle:'Visit',publicDetail:'Done',publicCatId:'private-resident-id'}));
  assert.equal(publicSummary({publicTitle:'Visit',publicDetail:'Done',publicCatId:''}).catId,null);
});
test('rejects negative spending, future records, ambiguous units and invalid quantities',()=>{
  for(const patch of [{amount:-1},{at:'2099-01-01'},{quantity:Infinity},{quantity:2,unit:''},{quantity:-2},{kind:'unknown'}]) assert.throws(()=>normalizeOperation({...input,...patch}));
  assert.equal(normalizeOperation({...input,kind:'stock_adjustment',quantity:-2}).data.quantityDelta,-2);
});
