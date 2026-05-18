/**
 * PDF Generation API Routes
 * 
 * Endpoints:
 * POST /api/pdf/generate-server - Server-side PDF generation (Puppeteer)
 * GET /api/pdf/download/:filename - Download generated PDF
 * POST /api/pdf/health - Health check
 */

import express, { Router } from "express";
import type { Request, Response } from "express";
import {
  generatePdfServer,
  generatePdfServerBatch,
  streamPdfResponse,
  healthCheckPuppeteer,
  closeBrowser,
} from "../services/pdf-server";

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Validates PDF generation request
 */
function validatePdfRequest(req: Request, res: Response, next: Function): void {
  const { html, filename } = req.body;

  if (!html || typeof html !== "string") {
    res.status(400).json({
      error: "Invalid request",
      message: "html parameter is required and must be a string",
    });
    return;
  }

  if (!filename || typeof filename !== "string") {
    res.status(400).json({
      error: "Invalid request",
      message: "filename parameter is required and must be a string",
    });
    return;
  }

  if (html.length > 10 * 1024 * 1024) {
    // 10MB limit
    res.status(413).json({
      error: "Request too large",
      message: "HTML content exceeds 10MB limit",
    });
    return;
  }

  next();
}

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter (for production, use Redis)
 */
const rateLimitMap = new Map<string, number[]>();

function rateLimit(windowMs: number = 60000, maxRequests: number = 10) {
  return (req: Request, res: Response, next: Function): void => {
    const clientIp =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const key = `pdf-${clientIp}`;
    const timestamps = rateLimitMap.get(key) || [];

    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      res.status(429).json({
        error: "Rate limit exceeded",
        message: `Maximum ${maxRequests} PDF requests per minute`,
        retryAfter: Math.ceil((validTimestamps[0] + windowMs - now) / 1000),
      });
      return;
    }

    validTimestamps.push(now);
    rateLimitMap.set(key, validTimestamps);

    // Cleanup old entries occasionally
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitMap.entries()) {
        const recent = v.filter((ts) => now - ts < windowMs);
        if (recent.length === 0) {
          rateLimitMap.delete(k);
        } else {
          rateLimitMap.set(k, recent);
        }
      }
    }

    next();
  };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/pdf/generate-server
 * 
 * Server-side PDF generation using Puppeteer
 * More reliable than client-side, slower (2-5s)
 * 
 * Request body:
 * {
 *   html: string (required) - HTML content to convert to PDF
 *   filename: string (required) - Output filename
 *   format?: "a4" | "letter" - Paper format (default: a4)
 *   margin?: object - Page margins in mm
 * }
 * 
 * Response:
 * Success (200):
 * {
 *   success: true,
 *   filename: string,
 *   downloadUrl: string,
 *   size: number,
 *   time: number
 * }
 * 
 * Error (500):
 * {
 *   success: false,
 *   error: string,
 *   message: string
 * }
 */
router.post(
  "/generate-server",
  rateLimit(60000, 10), // 10 requests per minute
  validatePdfRequest,
  async (req: Request, res: Response) => {
    try {
      const { html, filename, format, margin, debug } = req.body;

      console.log(`[PDF API] Generate-Server request: ${filename}`);

      const result = await generatePdfServer({
        html,
        filename,
        format: format || "a4",
        margin: margin || {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
        },
        debug: debug || false,
      });

      if (!result.success) {
        console.error(`[PDF API] Generation failed: ${result.error}`);
        res.status(500).json({
          success: false,
          error: "PDF generation failed",
          message: result.error,
        });
        return;
      }

      console.log(`[PDF API] ✓ Generation successful: ${result.filename}`);

      res.status(200).json({
        success: true,
        filename: result.filename,
        downloadUrl: `/api/pdf/download/${encodeURIComponent(result.filename)}`,
        size: result.size,
        time: result.time,
        sizeKb: (result.size / 1024).toFixed(2),
      });
    } catch (err) {
      console.error("[PDF API] Unexpected error:", err);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

/**
 * POST /api/pdf/generate-batch
 * 
 * Batch PDF generation (advanced)
 * Generates multiple PDFs efficiently with browser reuse
 * 
 * Request body:
 * {
 *   requests: Array<{
 *     html: string,
 *     filename: string,
 *     format?: "a4" | "letter"
 *   }>
 * }
 * 
 * Response:
 * {
 *   total: number,
 *   successful: number,
 *   failed: number,
 *   results: Array<PdfServerResult>
 * }
 */
router.post(
  "/generate-batch",
  rateLimit(60000, 5), // 5 batch requests per minute
  async (req: Request, res: Response) => {
    try {
      const { requests } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        res.status(400).json({
          error: "Invalid request",
          message: "requests must be a non-empty array",
        });
        return;
      }

      if (requests.length > 20) {
        res.status(400).json({
          error: "Request too large",
          message: "Maximum 20 PDFs per batch request",
        });
        return;
      }

      console.log(`[PDF API] Batch generate: ${requests.length} PDFs`);

      const results = await generatePdfServerBatch(requests);

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      res.status(200).json({
        total: results.length,
        successful,
        failed,
        results: results.map((r) => ({
          ...r,
          downloadUrl: r.success
            ? `/api/pdf/download/${encodeURIComponent(r.filename)}`
            : undefined,
        })),
      });
    } catch (err) {
      console.error("[PDF API] Batch error:", err);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

/**
 * GET /api/pdf/download/:filename
 * 
 * Download generated PDF
 * Streams file to client and cleans up after download
 * 
 * Params:
 * - filename: string (URL-encoded filename)
 * 
 * Response: PDF file (application/pdf)
 */
router.get("/download/:filename", async (req: Request, res: Response) => {
  try {
    const rawFilename = req.params.filename;
    const filename = Array.isArray(rawFilename)
      ? decodeURIComponent(rawFilename[0])
      : decodeURIComponent(rawFilename);

    // Sanitize filename to prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      res.status(400).json({
        error: "Invalid filename",
        message: "Invalid characters in filename",
      });
      return;
    }

    console.log(`[PDF API] Download request: ${filename}`);

    const pdfPath = `${process.cwd()}/generated-pdfs/${filename}`;

    // Verify file exists before streaming
    try {
      await import("fs").then((fs) =>
        fs.promises.stat(pdfPath)
      );
    } catch {
      res.status(404).json({
        error: "Not found",
        message: "PDF file not found",
      });
      return;
    }

    await streamPdfResponse(pdfPath, res);
  } catch (err) {
    console.error("[PDF API] Download error:", err);
    res.status(500).json({
      success: false,
      error: "Download failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/pdf/health
 * 
 * Health check for PDF service
 * Useful for load balancers and monitoring
 * 
 * Response:
 * {
 *   status: "ok" | "error",
 *   puppeteer: boolean,
 *   timestamp: string,
 *   uptime: number
 * }
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const puppeteerReady = await healthCheckPuppeteer();

    res.status(puppeteerReady ? 200 : 503).json({
      status: puppeteerReady ? "ok" : "degraded",
      puppeteer: puppeteerReady,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    console.error("[PDF API] Health check failed:", err);
    res.status(503).json({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/pdf/shutdown
 * 
 * Graceful shutdown of PDF service
 * Admin only endpoint (should be protected in production)
 */
router.post("/shutdown", async (req: Request, res: Response) => {
  try {
    console.log("[PDF API] Shutdown requested");

    await closeBrowser();

    res.status(200).json({
      status: "ok",
      message: "PDF service shut down successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[PDF API] Shutdown error:", err);
    res.status(500).json({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler for unmatched PDF routes
 */
router.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `No such endpoint: ${req.method} ${req.path}`,
    availableEndpoints: [
      "POST /api/pdf/generate-server",
      "POST /api/pdf/generate-batch",
      "GET /api/pdf/download/:filename",
      "GET /api/pdf/health",
    ],
  });
});

export default router;
