export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // GET /api/songs - Fetch all items (songs & folders) in PARALLEL
    if (url.pathname === "/api/songs" && request.method === "GET") {
      try {
        const { keys } = await env.PIANO_LIBRARY_KV.list();
        
        // Concurrent parallel fetching for 10x speedup
        const items = await Promise.all(
          keys.map(async (key) => {
            const data = await env.PIANO_LIBRARY_KV.get(key.name, "json");
            return data ? { id: key.name, ...data } : null;
          })
        );
        
        const validItems = items.filter(Boolean);
        validItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        return new Response(JSON.stringify(validItems), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/songs - Create or Update Item (Song or Folder)
    if (url.pathname === "/api/songs" && request.method === "POST") {
      try {
        const body = await request.json();
        const id = body.id || crypto.randomUUID();
        
        let itemData = {
          title: body.title || "Bản nhạc mới",
          abc: body.abc || "",
          type: body.type || "file", // "file" or "folder"
          folderPath: body.folderPath || "/", // e.g. "/" or "/Piano/Nhạc Trẻ"
          createdAt: new Date().toISOString()
        };

        // If updating existing item, preserve original createdAt
        if (body.id) {
          const existing = await env.PIANO_LIBRARY_KV.get(id, "json");
          if (existing && existing.createdAt) {
            itemData.createdAt = existing.createdAt;
            itemData.updatedAt = new Date().toISOString();
          }
        }
        
        await env.PIANO_LIBRARY_KV.put(id, JSON.stringify(itemData));
        
        return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // DELETE /api/songs - Delete Item
    if (url.pathname === "/api/songs" && request.method === "DELETE") {
      try {
        const body = await request.json();
        if (!body.id) {
          return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });
        }
        await env.PIANO_LIBRARY_KV.delete(body.id);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
  }
};
