import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import path from "node:path";

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

export async function uploadFile(
  file: { name: string; type: string; arrayBuffer(): Promise<ArrayBuffer> },
  folder: string,
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (!(bucket && accessKey) && process.env.NODE_ENV === "production") {
    // The local fallback would write to an ephemeral or read-only filesystem and
    // lose the file, so a misconfigured deployment must fail loudly instead.
    throw new Error("R2 storage is not configured (R2_BUCKET_NAME / R2_ACCESS_KEY_ID)");
  }

  if (bucket && accessKey) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );
  } else {
    // Local development fallback: store in public/uploads/${key}
    const localPath = path.join(process.cwd(), "public", "uploads", key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
  }

  return key;
}
