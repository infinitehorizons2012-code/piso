export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Xử lý CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    if (url.pathname === "/api/songs" && request.method === "GET") {
      try {
        const { keys } = await env.PIANO_LIBRARY_KV.list();
        let songs = [];
        
        for (const key of keys) {
          const data = await env.PIANO_LIBRARY_KV.get(key.name, "json");
          if (data) {
            songs.push({ id: key.name, ...data });
          }
        }
        
        // Sắp xếp bài mới nhất lên đầu
        songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return new Response(JSON.stringify(songs), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (url.pathname === "/api/songs" && request.method === "POST") {
      try {
        const body = await request.json();
        const id = crypto.randomUUID();
        
        const songData = {
          title: body.title || "Bản nhạc mới",
          abc: body.abc || "",
          createdAt: new Date().toISOString()
        };
        
        await env.PIANO_LIBRARY_KV.put(id, JSON.stringify(songData));
        
        return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
  }
};
