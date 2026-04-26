/**
 * ═══════════════════════════════════════════════════════════════
 *  SCOREPILOT — Worker de synchronisation utilisateurs
 * ═══════════════════════════════════════════════════════════════
 * 
 *  Ce Worker permet aux utilisateurs de différents appareils
 *  d'être visibles dans le panel admin (résout le problème
 *  du localStorage local à chaque navigateur).
 * 
 *  DÉPLOIEMENT (gratuit, 5 min) :
 *  1. dash.cloudflare.com → Workers & Pages → Create → Worker
 *  2. Colle ce fichier → Save & Deploy
 *  3. Dans l'onglet KV → Create namespace "SCOREPILOT_USERS"
 *  4. Dans le Worker → Settings → Bindings → KV → ajoute SCOREPILOT_USERS
 *  5. Copie l'URL du worker (ex: sync.moncompte.workers.dev)
 *  6. Dans admin-panel.html, remplace SYNC_WORKER_URL par cette URL
 *  7. Dans onboarding.html, pareil
 * ═══════════════════════════════════════════════════════════════
 */

const ALLOWED = ['https://pprdz.github.io', 'http://localhost', 'null'];

function cors(origin) {
  const ok = ALLOWED.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:h });

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── GET /users ─── Liste tous les users
      if (path === '/users' && request.method === 'GET') {
        const keys = await env.SCOREPILOT_USERS.list();
        const users = [];
        for (const k of keys.keys) {
          const val = await env.SCOREPILOT_USERS.get(k.name, 'json');
          if (val) users.push(val);
        }
        return json(users, 200, h);
      }

      // ── POST /user ─── Créer/mettre à jour un user
      if (path === '/user' && request.method === 'POST') {
        const body = await request.json();
        if (!body.userId || !body.name) return json({ error: 'userId and name required' }, 400, h);
        
        // Ne stocker que les données non-sensibles
        const safe = {
          userId: body.userId,
          name: body.name,
          email: body.email || '',
          status: body.status || 'FREE',
          provider: body.provider || 'email',
          rank: body.rank || null,
          points: body.points || 0,
          createdAt: body.createdAt || Date.now(),
          updatedAt: Date.now(),
          // NE PAS stocker : password, pin, googleId
        };
        
        await env.SCOREPILOT_USERS.put(body.userId, JSON.stringify(safe), { expirationTtl: 86400 * 365 });
        return json({ success: true, user: safe }, 200, h);
      }

      // ── PUT /user/:id/rank ─── Mettre à jour le rang
      if (path.startsWith('/user/') && path.endsWith('/rank') && request.method === 'PUT') {
        const userId = path.split('/')[2];
        const body = await request.json();
        const existing = await env.SCOREPILOT_USERS.get(userId, 'json');
        if (!existing) return json({ error: 'User not found' }, 404, h);
        existing.points = body.points || existing.points;
        existing.rank = body.rank || existing.rank;
        existing.updatedAt = Date.now();
        await env.SCOREPILOT_USERS.put(userId, JSON.stringify(existing));
        return json({ success: true }, 200, h);
      }

      // ── DELETE /user/:id ─── Supprimer un user
      if (path.startsWith('/user/') && request.method === 'DELETE') {
        const userId = path.split('/')[2];
        await env.SCOREPILOT_USERS.delete(userId);
        return json({ success: true }, 200, h);
      }

      return json({ error: 'Not found' }, 404, h);

    } catch(e) {
      return json({ error: e.message }, 500, h);
    }
  }
};

function json(data, status, h) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...h, 'Content-Type': 'application/json' }
  });
}
