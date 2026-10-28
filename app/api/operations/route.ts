import { env } from 'cloudflare:workers';
import { teamContext, reject } from '@/lib/team';
import { bucket } from '@/lib/db';
import { normalizeOperation, publicSummary, publicPayload, text, uuid, type Operation } from '@/lib/operations';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function context(req: Request) {
  const ctx = await teamContext();
  if (req.method !== 'GET' && req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin) reject('Request origin is not allowed.');
  return { ...ctx, mode: new URL(req.url).searchParams.get('mode') === 'real' ? 'real' : 'demo' };
}
function operation(row: any, files: any[] = []): Operation {
  return { id: row.id, kind: row.kind, animalId: row.animal_id, at: row.at, createdAt: row.created_at, author: row.author,
    data: JSON.parse(row.data), resolved: row.resolved, publicState: row.public_state, publicCatId: row.public_cat_id,
    publicTitle: row.public_title, publicDetail: row.public_detail, publicVersion: row.public_version,
    deliveredVersion: row.delivered_version, lastError: row.last_error,
    files: files.filter(f => f.animal_id === row.id).map(f => ({ id: f.id, name: f.name })) };
}
async function owned(ctx: Awaited<ReturnType<typeof context>>, id: unknown) {
  if (!uuid(id)) reject('Operation not found.', 404);
  const row = await ctx.db.prepare('SELECT * FROM operations WHERE id=? AND owner=? AND mode=?').bind(id, ctx.owner, ctx.mode).first<any>();
  if (!row) reject('Operation not found.', 404);
  return row;
}
async function deliver(ctx: Awaited<ReturnType<typeof context>>, row: any) {
  if (ctx.mode !== 'real') reject('Demo records cannot be published.');
  const secret = env.CARE_BRIDGE_SECRET;
  try {
    if (!secret || secret.length < 32) throw new Error('The game connection is not configured. Your approved update is safely queued.');
    const response = await fetch('https://catgardens.org/api/care-ingest', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(publicPayload(operation(row))), signal: AbortSignal.timeout(8000), redirect: 'error',
    });
    const body = await response.json() as { version?: number };
    if (!response.ok || !body.version || body.version < row.public_version) throw new Error('The game did not confirm delivery. The update remains queued for retry.');
    await ctx.db.prepare('UPDATE operations SET delivered_version=?,public_state=?,last_error=NULL WHERE id=? AND owner=? AND mode=? AND public_version=?')
      .bind(row.public_version, row.public_state === 'withdrawn' ? 'withdrawn' : 'published', row.id, ctx.owner, ctx.mode, row.public_version).run();
    return { delivered: true };
  } catch (error) {
    const message = !secret ? 'Game connection pending. Approved update queued.' : 'Delivery was not confirmed. Approved update queued; retry when connected.';
    await ctx.db.prepare('UPDATE operations SET last_error=? WHERE id=? AND owner=? AND mode=? AND public_version=?')
      .bind(message, row.id, ctx.owner, ctx.mode, row.public_version).run();
    return { delivered: false, notice: message };
  }
}
export async function GET(req: Request) {
  try {
    const ctx = await context(req);
    const [rows, files, costs, stock, shortages] = await Promise.all([
      ctx.db.prepare('SELECT * FROM operations WHERE owner=? AND mode=? ORDER BY at DESC,created_at DESC LIMIT 500').bind(ctx.owner, ctx.mode).all<any>(),
      ctx.db.prepare('SELECT id,name,animal_id FROM files WHERE owner=? AND mode=? AND animal_id IN (SELECT id FROM operations WHERE owner=? AND mode=? ORDER BY at DESC,created_at DESC LIMIT 500)').bind(ctx.owner,ctx.mode,ctx.owner,ctx.mode).all<any>(),
      ctx.db.prepare("SELECT json_extract(data,'$.currency') AS currency,json_extract(data,'$.paymentStatus') AS status,SUM(json_extract(data,'$.amountCents')) AS cents FROM operations WHERE owner=? AND mode=? AND json_extract(data,'$.paymentStatus') IN ('paid','planned') GROUP BY currency,status").bind(ctx.owner,ctx.mode).all<any>(),
      ctx.db.prepare("SELECT json_extract(data,'$.item') AS item,json_extract(data,'$.unit') AS unit,SUM(json_extract(data,'$.quantityDelta')) AS quantity FROM operations WHERE owner=? AND mode=? AND json_extract(data,'$.quantityDelta')<>0 GROUP BY lower(json_extract(data,'$.item')),lower(json_extract(data,'$.unit'))").bind(ctx.owner,ctx.mode).all<any>(),
      ctx.db.prepare("SELECT id,json_extract(data,'$.title') AS title FROM operations WHERE owner=? AND mode=? AND kind='food_shortage' AND resolved=0 ORDER BY at DESC").bind(ctx.owner,ctx.mode).all<any>(),
    ]);
    return json({ operations: rows.results.map(row => operation(row, files.results)), costs: costs.results, stock: stock.results,
      shortages: shortages.results, bridgeConfigured: !!env.CARE_BRIDGE_SECRET, limit: 500 });
  } catch (e: any) { return json({ error: e.status ? e.message : 'Operations could not be loaded.' }, e.status || 503); }
}
export async function POST(req: Request) {
  try {
    const ctx = await context(req); const b = await req.json() as Record<string, any>;
    if (b.action === 'create') {
      const o = normalizeOperation(b);
      if (o.animalId && !await ctx.db.prepare('SELECT id FROM animals WHERE id=? AND owner=? AND mode=?').bind(o.animalId,ctx.owner,ctx.mode).first()) reject('Resident not found.',404);
      const existing = await ctx.db.prepare('SELECT * FROM operations WHERE id=? AND owner=? AND mode=?').bind(o.id,ctx.owner,ctx.mode).first<any>();
      if (existing && (existing.kind!==o.kind || existing.at!==o.at || existing.animal_id!==o.animalId || existing.data!==JSON.stringify(o.data))) reject('That form was already saved with different details. Close it and log a new operation.',409);
      if (existing) return json({ ok:true, id:o.id, duplicate:true });
      await ctx.db.prepare('INSERT INTO operations(id,owner,mode,kind,animal_id,at,created_at,author,member_id,data,public_state,public_cat_id,public_title,public_detail) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(o.id,ctx.owner,ctx.mode,o.kind,o.animalId,o.at,new Date().toISOString(),ctx.me.name,ctx.me.id,JSON.stringify(o.data),
          b.suggestPublic ? 'draft' : 'internal',text(b.publicCatId,60)||null,text(b.publicTitle,160),text(b.publicDetail,1600)).run();
      return json({ ok:true, id:o.id });
    }
    const row = await owned(ctx,b.id);
    if (b.action === 'resolve') {
      if (row.kind !== 'food_shortage') reject('Only shortages can be marked resolved.',400);
      await ctx.db.prepare('UPDATE operations SET resolved=1,resolved_by=? WHERE id=? AND owner=? AND mode=?').bind(ctx.me.id,row.id,ctx.owner,ctx.mode).run();
      return json({ ok:true });
    }
    if (!['owner','caretaker'].includes(ctx.me.role)) reject('An owner or caretaker must approve public updates.');
    if (ctx.mode !== 'real') reject('Demo records cannot be published.');
    if (b.action === 'approve' || b.action === 'withdraw') {
      if (b.version !== row.public_version) reject('The public update changed. Reload before approving.',409);
      if (b.action === 'withdraw' && !row.public_version) reject('This record has not been approved.',400);
      const summary = b.action === 'approve' ? publicSummary(b) : { catId:row.public_cat_id,title:row.public_title,detail:row.public_detail };
      const result = await ctx.db.prepare('UPDATE operations SET public_state=?,public_cat_id=?,public_title=?,public_detail=?,public_version=public_version+1,approved_by=?,approved_at=?,last_error=NULL WHERE id=? AND owner=? AND mode=? AND public_version=?')
        .bind(b.action === 'withdraw' ? 'withdrawn' : 'approved',summary.catId,summary.title,summary.detail,ctx.me.id,new Date().toISOString(),row.id,ctx.owner,ctx.mode,row.public_version).run();
      if (!result.meta.changes) reject('The public update changed. Reload before approving.',409);
      return json({ ok:true,...await deliver(ctx,await owned(ctx,row.id)) });
    }
    if (b.action === 'retry') {
      if (!row.public_version || row.delivered_version >= row.public_version) return json({ok:true,delivered:true});
      return json({ ok:true,...await deliver(ctx,row) });
    }
    reject('Unknown operation action.',400);
  } catch(e:any) { return json({ error:e.status?e.message:'The operation could not be saved. Retry with the same form.' },e.status||503); }
}
export async function PUT(req: Request) {
  try {
    const ctx = await context(req), form = await req.formData();
    const row = await owned(ctx,form.get('operationId')); const file = form.get('file') as File;
    if (!file || typeof file.arrayBuffer !== 'function' || !file.size || file.size > 10*1024*1024) reject('Choose a receipt or document up to 10 MB.',400);
    if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)) reject('Use PDF, JPG, PNG, or WEBP.',400);
    const bytes = await file.arrayBuffer(), v = new Uint8Array(bytes);
    if ((file.type==='application/pdf'&&String.fromCharCode(...v.slice(0,5))!=='%PDF-') || (file.type==='image/jpeg'&&(v[0]!==255||v[1]!==216)) || (file.type==='image/png'&&(v[0]!==137||v[1]!==80)) || (file.type==='image/webp'&&String.fromCharCode(...v.slice(8,12))!=='WEBP')) reject('The file contents do not match its type.',400);
    const id=crypto.randomUUID(),key=`operations/${ctx.owner}/${id}`;
    await bucket().put(key,bytes,{httpMetadata:{contentType:file.type}});
    try { await ctx.db.prepare('INSERT INTO files(id,owner,mode,animal_id,name,type,object_key) VALUES(?,?,?,?,?,?,?)')
      .bind(id,ctx.owner,ctx.mode,row.id,text(file.name,200),file.type,key).run(); }
    catch(e) { await bucket().delete(key); throw e; }
    return json({ok:true,id});
  } catch(e:any) { return json({ error:e.status?e.message:'The attachment could not be saved.' },e.status||503); }
}
