import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileName = file.name.toLowerCase();
    let text = "";

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      text = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      // Extract text from PDF using basic parsing
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const raw = new TextDecoder("latin1").decode(bytes);

      // Extract text between stream/endstream markers and decode
      const streams: string[] = [];
      const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
      let match;
      while ((match = streamRegex.exec(raw)) !== null) {
        const content = match[1];
        // Extract text from PDF text operators
        const textMatches = content.match(/\(([^)]*)\)\s*Tj|\[((?:[^]]*?))\]\s*TJ/g);
        if (textMatches) {
          for (const tm of textMatches) {
            const parens = tm.match(/\(([^)]*)\)/g);
            if (parens) {
              for (const p of parens) {
                streams.push(p.slice(1, -1));
              }
            }
          }
        }
      }

      if (streams.length > 0) {
        text = streams.join(" ");
      } else {
        // Fallback: extract any readable text
        const readable = raw.match(/[\x20-\x7E]{4,}/g);
        text = readable ? readable.join(" ") : "";
      }

      if (!text.trim()) {
        return new Response(JSON.stringify({ error: "Could not extract text from PDF. The file may be scanned/image-based. Please paste the text manually." }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (fileName.endsWith(".docx")) {
      // DOCX is a ZIP containing XML
      // Use Deno's built-in zip handling via streams
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Find document.xml in the ZIP
      // Simple ZIP parsing to find the document.xml entry
      const textContent: string[] = [];

      // Convert to string and find XML text between <w:t> tags
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const fullText = decoder.decode(bytes);

      const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let wtMatch;
      while ((wtMatch = wtRegex.exec(fullText)) !== null) {
        textContent.push(wtMatch[1]);
      }

      if (textContent.length > 0) {
        // Join with spaces, but detect paragraph boundaries
        text = textContent.join(" ");
        // Clean up excessive whitespace
        text = text.replace(/\s+/g, " ").trim();
      }

      if (!text.trim()) {
        return new Response(JSON.stringify({ error: "Could not extract text from DOCX. Please paste the text manually." }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ text: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
