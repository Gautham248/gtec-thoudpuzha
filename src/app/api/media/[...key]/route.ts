import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

import { promises as fs } from "node:fs";
import path from "node:path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");
  const bucket = process.env.R2_BUCKET_NAME;

  let r2Failed = false;

  // 1. If R2 is configured, attempt to fetch from R2
  if (bucket && process.env.R2_ACCESS_KEY_ID) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });

      const response = await getS3Client().send(command);

      if (response.Body) {
        const body = await response.Body.transformToByteArray();
        const contentType = response.ContentType ?? "application/octet-stream";

        return new NextResponse(Buffer.from(body), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch (err) {
      // A missing key is an ordinary miss; anything else is an outage or a bad
      // credential and must not be mistaken for one (or cached as one).
      if ((err as { name?: string }).name !== "NoSuchKey") {
        r2Failed = true;
        logger.exception("media", `R2 fetch failed for ${objectKey}`, err);
      }
    }
  }

  // 2. Check local filesystem fallback (e.g. public/uploads or public)
  const publicRoot = path.join(process.cwd(), "public");
  try {
    const candidatePaths = [
      path.join(publicRoot, "uploads", objectKey),
      path.join(publicRoot, objectKey),
      path.join(publicRoot, "images", objectKey),
    ];

    for (const candidate of candidatePaths) {
      const resolved = path.resolve(candidate);

      // `objectKey` is attacker-controlled, and `path.join` does not neutralise
      // `..` segments — without this guard a request for `/api/media/..%2f.env.local`
      // escapes `public/` and reads arbitrary files from the project root.
      if (!resolved.startsWith(publicRoot + path.sep)) {
        continue;
      }

      try {
        const data = await fs.readFile(resolved);
        const ext = path.extname(resolved).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".svg": "image/svg+xml",
          ".pdf": "application/pdf",
        };
        const contentType = mimeMap[ext] ?? "application/octet-stream";

        return new NextResponse(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        // Try next candidate path
      }
    }
  } catch {
    // Ignore filesystem errors and return fallback
  }

  // 3. Nothing found. Never cache a miss or an upstream failure.
  return new NextResponse(null, {
    status: r2Failed ? 502 : 404,
    headers: { "Cache-Control": "no-store" },
  });
}
