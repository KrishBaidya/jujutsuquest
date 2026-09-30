import "server-only";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Photos live in the Neon bucket (S3 API; `uploads` exists today). Only object keys go
// in the database; the browser gets short-lived signed URLs.

const BUCKET = process.env.STORAGE_BUCKET ?? "uploads";

let client: S3Client | undefined;
function s3() {
  client ??= new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
  });
  return client;
}

export type PhotoFolder = "submissions" | "archive";

/** Stores an image and returns its object key. */
export async function uploadPhoto(
  folder: PhotoFolder,
  userId: string,
  bytes: Uint8Array,
  contentType: "image/jpeg" | "image/png" | "image/webp",
): Promise<string> {
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `${folder}/${userId}/${randomUUID()}.${ext}`;
  await s3().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: contentType }),
  );
  return key;
}

/**
 * A URL the browser can load for the next `expiresIn` seconds. Keys that are
 * already paths (seeded sample photos under /public) are returned as they are.
 */
export async function photoUrl(key: string, expiresIn = 3600): Promise<string> {
  if (key.startsWith("/")) return key;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

/** Parses a canvas `toDataURL()` string from the in-app camera. */
export function parseDataUrl(dataUrl: string) {
  const match = DATA_URL.exec(dataUrl);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) return null;
  return { bytes, contentType: match[1] as "image/jpeg" | "image/png" | "image/webp" };
}
