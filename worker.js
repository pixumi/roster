const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Nanti ganti dengan URL Pages kamu demi keamanan
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. GET /data - Mengambil semua pemain, map, dan skor untuk ditampilkan
      if (request.method === "GET" && path === "/data") {
        const players = await env.DB.prepare("SELECT * FROM players").all();
        const beatmaps = await env.DB.prepare("SELECT * FROM beatmaps").all();
        const scores = await env.DB.prepare("SELECT * FROM scores").all();
        
        return new Response(JSON.stringify({
          players: players.results,
          beatmaps: beatmaps.results,
          scores: scores.results
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        const body = await request.json();

        // 2. Tambah Pemain
        if (path === "/players") {
          const id = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO players (id, username, password, role) VALUES (?, ?, ?, 'player')")
            .bind(id, body.username, body.password).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // 3. Tambah Beatmap
        if (path === "/beatmaps") {
          const id = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO beatmaps (id, mod, name) VALUES (?, ?, ?)")
            .bind(id, body.mod, body.name).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // 4. Submit Skor
        if (path === "/scores") {
          const id = crypto.randomUUID();
          // Simpan setiap run baru sebagai row terpisah, agar nanti bisa dirata-ratakan
          await env.DB.prepare("INSERT INTO scores (id, player_id, map_key, score) VALUES (?, ?, ?, ?)")
            .bind(id, body.player_id, body.map_key, body.score).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        
        if (path === "/players") {
          await env.DB.prepare("DELETE FROM players WHERE id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM scores WHERE player_id = ?").bind(id).run(); // Hapus skornya juga
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
        
        if (path === "/beatmaps") {
          await env.DB.prepare("DELETE FROM beatmaps WHERE id = ?").bind(id).run();
          // Kita tidak menghapus skor berdasarkan beatmap di sini untuk kesederhanaan, tapi idealnya dihapus
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (e) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  }
};