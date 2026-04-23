import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

router.post("/storage/uploads/request-url", authenticate, async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.length > 255) {
    res.status(400).json({ error: "Invalid file name" });
    return;
  }

  if (typeof contentType !== "string" || !ALLOWED_UPLOAD_TYPES.has(contentType.toLowerCase())) {
    res.status(415).json({ error: "Unsupported file type. Only PNG, JPEG, WEBP and GIF images are allowed." });
    return;
  }

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    res.status(400).json({ error: "Invalid file extension." });
    return;
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    res.status(400).json({ error: "Invalid file size" });
    return;
  }
  if (size > MAX_UPLOAD_BYTES) {
    res.status(413).json({ error: `File too large. Max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json({
      uploadURL,
      objectPath,
      metadata: { name, size, contentType },
    });
  } catch (error) {
    console.error("Error generating upload URL", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 */
// Headers that browsers (and us) actually want from object storage. We deliberately do NOT
// forward the upstream Content-Type if it isn't on the image allow-list — otherwise a user
// who manages to upload an HTML/JS payload (because the signed-URL Content-Type negotiation
// was bypassed by a misbehaving client) could get the browser to render it as text/html on
// our origin, turning the upload bucket into stored-XSS surface.
function writeSafeAssetHeaders(srcHeaders: Headers, res: Response): void {
  const upstream = (srcHeaders.get("content-type") ?? "").toLowerCase();
  const safeType = ALLOWED_UPLOAD_TYPES.has(upstream) ? upstream : "application/octet-stream";
  res.setHeader("Content-Type", safeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", "inline");
  const len = srcHeaders.get("content-length");
  if (len) res.setHeader("Content-Length", len);
  const cache = srcHeaders.get("cache-control");
  if (cache) res.setHeader("Cache-Control", cache);
}

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    writeSafeAssetHeaders(response.headers, res);

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Error serving public object", error);
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve uploaded objects (unconditionally public for images in questions).
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    writeSafeAssetHeaders(response.headers, res);

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    console.error("Error serving object", error);
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
