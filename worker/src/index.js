/* Ranking API for "ひたすらペダル" on Cloudflare Workers + D1.
 *   GET  /scores  -> [{name, m}, ...]  top 10
 *   POST /scores  {name, m, top} -> {ok:true}
 */
const MAX_M = 20000;      // sanity cap on distance
const MAX_KMH = 90;       // 700 px/s * 1.35 boost * .09
const KEEP = 100;         // rows kept in the table
const NAME_LEN = 8;

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(env) },
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
    if (url.pathname !== '/scores') return json({ error: 'not found' }, 404, env);

    if (req.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT name, m FROM scores ORDER BY m DESC, id ASC LIMIT 10').all();
      return json(results, 200, env);
    }

    if (req.method === 'POST') {
      let b;
      try { b = await req.json(); } catch (_) { return json({ error: 'bad json' }, 400, env); }
      const name = typeof b.name === 'string' ? [...b.name.trim()].slice(0, NAME_LEN).join('') : '';
      const m = b.m, top = b.top;
      if (!name || !Number.isInteger(m) || m < 1 || m > MAX_M || !Number.isInteger(top) || top < 0 || top > MAX_KMH) {
        return json({ error: 'invalid score' }, 400, env);
      }
      await env.DB.batch([
        env.DB.prepare('INSERT INTO scores (name, m, top) VALUES (?, ?, ?)').bind(name, m, top),
        env.DB.prepare('DELETE FROM scores WHERE id NOT IN (SELECT id FROM scores ORDER BY m DESC, id ASC LIMIT ?)').bind(KEEP),
      ]);
      return json({ ok: true }, 200, env);
    }

    return json({ error: 'method not allowed' }, 405, env);
  },
};
