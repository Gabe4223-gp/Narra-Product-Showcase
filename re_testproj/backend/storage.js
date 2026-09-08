// backend/storage.js
//
// One place that knows where uploaded files live. Several handlers used to
// call s3.upload()/s3.getObject() unconditionally, which threw
// "Cannot read properties of undefined (reading 'upload')" whenever
// STORAGE_TYPE was not 's3' -- and failed with NoSuchBucket when it was but
// the bucket had been deleted.
//
// STORAGE_TYPE=s3    -> AWS (or any S3-compatible endpoint)
// anything else      -> local disk under backend/lease_bills, served by the
//                       existing /lease_bills static mount
//
// Local storage is ephemeral on free-tier hosts: files survive until the next
// restart or redeploy. Fine for a demo, not for real tenancy documents.

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const API_BASE_URL =
  process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LOCAL_DIR = path.join(__dirname, 'lease_bills');

let s3 = null;
if (STORAGE_TYPE === 's3') {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: REGION,
  });
}

const usingS3 = () => Boolean(s3);

// Keys arrive from request bodies and query strings. Collapse anything that
// looks like a path so a caller cannot read or write outside LOCAL_DIR.
function safeKey(key) {
  const base = path.basename(String(key || ''));
  if (!base || base === '.' || base === '..') {
    throw new Error('Invalid file name');
  }
  return base;
}

function publicUrl(key) {
  const k = safeKey(key);
  return usingS3()
    ? `https://${BUCKET}.s3.${REGION}.amazonaws.com/${k}`
    : `${API_BASE_URL}/lease_bills/${encodeURIComponent(k)}`;
}

async function putObject(key, buffer, contentType = 'application/pdf') {
  const k = safeKey(key);

  if (usingS3()) {
    await s3
      .upload({ Bucket: BUCKET, Key: k, Body: buffer, ContentType: contentType })
      .promise();
    return publicUrl(k);
  }

  await fs.promises.mkdir(LOCAL_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(LOCAL_DIR, k), buffer);
  return publicUrl(k);
}

const EXT_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

// Leases are stored under a bare UUID with no file extension, so extension
// alone cannot identify them and they came back as octet-stream -- which the
// frontend viewer renders as "Unsupported file type". Fall back to the file's
// magic bytes.
function detectContentType(buffer, key) {
  const byExt = EXT_TYPES[path.extname(key).toLowerCase()];
  if (byExt) return byExt;

  if (!buffer || buffer.length < 4) return 'application/octet-stream';
  const head = buffer.subarray(0, 4);

  if (head.toString('latin1') === '%PDF') return 'application/pdf';
  if (head[0] === 0x89 && head.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (head[0] === 0xff && head[1] === 0xd8) return 'image/jpeg';
  if (head.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif';

  return 'application/octet-stream';
}

// Returns { body: Buffer, contentType: string }
async function getObject(key) {
  const k = safeKey(key);

  if (usingS3()) {
    const data = await s3.getObject({ Bucket: BUCKET, Key: k }).promise();
    const stored = data.ContentType;
    const contentType =
      stored && stored !== 'application/octet-stream'
        ? stored
        : detectContentType(data.Body, k);
    return { body: data.Body, contentType };
  }

  const body = await fs.promises.readFile(path.join(LOCAL_DIR, k));
  return { body, contentType: detectContentType(body, k) };
}

module.exports = { putObject, getObject, publicUrl, usingS3, detectContentType, LOCAL_DIR, STORAGE_TYPE };
