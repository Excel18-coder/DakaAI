import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

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
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const raw = new TextDecoder("latin1").decode(bytes);

      const streams: string[] = [];
      const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
      let match;
      while ((match = streamRegex.exec(raw)) !== null) {
        const content = match[1];
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
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      const docXml = zip.file("word/document.xml");
      if (!docXml) {
        return new Response(JSON.stringify({ error: "Invalid DOCX file: missing document.xml" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const xmlContent = await docXml.async("string");
      const textContent: string[] = [];

      // Extract text from <w:t> tags
      const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let wtMatch;
      while ((wtMatch = wtRegex.exec(xmlContent)) !== null) {
        textContent.push(wtMatch[1]);
      }

      // Detect paragraph boundaries for better formatting
      const paragraphs: string[] = [];
      const pRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
      let pMatch;
      while ((pMatch = pRegex.exec(xmlContent)) !== null) {
        const pText: string[] = [];
        const innerWt = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let m;
        while ((m = innerWt.exec(pMatch[0])) !== null) {
          pText.push(m[1]);
        }
        if (pText.length > 0) {
          paragraphs.push(pText.join(""));
        }
      }

      text = paragraphs.length > 0 ? paragraphs.join("\n") : textContent.join(" ");

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
