export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (!env.DB) {
        return new Response(JSON.stringify({ error: "Database binding 'DB' belum diset di Cloudflare Worker." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // GET: Ambil data dari database D1
      if (request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT data FROM app_state WHERE id = 1").all();
        if (results && results.length > 0) {
          return new Response(results[0].data, {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        // Default kosong jika belum ada data
        return new Response(JSON.stringify({ players: ["faker", "chovy", "showmaker"], beatmaps: [], scores: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // POST: Simpan / Update data ke database D1
      if (request.method === "POST") {
        const body = await request.text();
        await env.DB.prepare(
          "INSERT INTO app_state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
        ).bind(body).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
