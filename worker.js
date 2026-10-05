export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, ""); // Hilangkan trailing slash jika ada

    async function getState() {
      if (!env.DB) {
        throw new Error("Binding D1 Database dengan nama 'DB' belum diset di Settings -> Bindings.");
      }
      const { results } = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").all();
      if (results && results.length > 0) {
        return JSON.parse(results[0].data);
      }
      return {
        players: [
          { id: 'admin1', username: 'admin', password: 'admin', role: 'admin' },
          { id: 'p1', username: 'kinora', password: 'kinora', role: 'player' }
        ],
        beatmaps: [],
        scores: []
      };
    }

    async function saveState(state) {
      await env.DB.prepare(
        "INSERT INTO app_state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
      ).bind(JSON.stringify(state)).run();
    }

    try {
      let state = await getState();

      // [GET] / atau /data -> Kembalikan seluruh data state
      if (request.method === "GET" && (cleanPath === "" || cleanPath === "/data")) {
        return new Response(JSON.stringify(state), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // [POST] /players -> Tambah player
      if (request.method === "POST" && cleanPath === "/players") {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        body.role = 'player';
        state.players.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [DELETE] /players -> Hapus player
      if (request.method === "DELETE" && cleanPath === "/players") {
        const id = url.searchParams.get("id");
        state.players = state.players.filter(p => p.id !== id);
        state.scores = state.scores.filter(s => s.player_id !== id);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [POST] /beatmaps -> Tambah beatmap
      if (request.method === "POST" && cleanPath === "/beatmaps") {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        state.beatmaps.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [DELETE] /beatmaps -> Hapus beatmap
      if (request.method === "DELETE" && cleanPath === "/beatmaps") {
        const id = url.searchParams.get("id");
        state.beatmaps = state.beatmaps.filter(b => b.id !== id);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [POST] /scores -> Tambah score
      if (request.method === "POST" && cleanPath === "/scores") {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        state.scores.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: `Not Found: ${url.pathname}` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
