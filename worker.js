export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight request (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Fungsi mengambil seluruh state dari Database D1
    async function getState() {
      if (!env.DB) throw new Error("Binding D1 Database 'DB' tidak ditemukan.");
      const { results } = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").all();
      if (results && results.length > 0) return JSON.parse(results[0].data);
      
      // Default State Jika Database Kosong
      return {
        players: [
          { id: 'admin1', username: 'admin', password: 'admin', role: 'admin' },
          { id: 'p1', username: 'faker', password: '123', role: 'player' }
        ],
        beatmaps: [],
        scores: []
      };
    }

    // Fungsi menyimpan seluruh state ke Database D1
    async function saveState(state) {
      await env.DB.prepare(
        "INSERT INTO app_state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
      ).bind(JSON.stringify(state)).run();
    }

    try {
      let state = await getState();

      // [GET] /data -> Ambil Semua Data
      if (request.method === "GET" && path.endsWith("/data")) {
        return new Response(JSON.stringify(state), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // [POST] /players -> Tambah Player
      if (request.method === "POST" && path.endsWith("/players")) {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        body.role = 'player';
        state.players.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [DELETE] /players?id=... -> Hapus Player
      if (request.method === "DELETE" && path.endsWith("/players")) {
        const id = url.searchParams.get("id");
        state.players = state.players.filter(p => p.id !== id);
        state.scores = state.scores.filter(s => s.player_id !== id); // Hapus skornya juga
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [POST] /beatmaps -> Tambah Map
      if (request.method === "POST" && path.endsWith("/beatmaps")) {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        state.beatmaps.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [DELETE] /beatmaps?id=... -> Hapus Map
      if (request.method === "DELETE" && path.endsWith("/beatmaps")) {
        const id = url.searchParams.get("id");
        state.beatmaps = state.beatmaps.filter(b => b.id !== id);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // [POST] /scores -> Tambah/Timpa Skor Baru (Tidak perlu hapus skor, biarkan numpuk untuk di rata-rata)
      if (request.method === "POST" && path.endsWith("/scores")) {
        const body = JSON.parse(await request.text());
        body.id = Math.random().toString(36).substr(2, 9);
        state.scores.push(body);
        await saveState(state);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Route Not Found" }), { 
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};
