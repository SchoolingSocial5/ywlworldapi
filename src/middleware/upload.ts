import multer from 'multer';
import path from 'path';
import https from 'https';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';

dotenv.config();

// Cloudflare R2 credentials
const cfAccessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const cfSecretAccessKey =
  process.env.CLOUDFLARE_SECRETE_ACCESS_KEY ||
  process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
  process.env.R2_SECRET_ACCESS_KEY;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfS3Api = process.env.CLOUDFLARE_S3_API;
const cfPublicUrl = process.env.CLOUDFLARE_PUBLIC_URL;

// AWS S3 credentials
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsBucketName = process.env.AWS_S3_BUCKET_NAME;

const isCloudflare = Boolean(cfAccessKeyId && cfSecretAccessKey && (cfAccountId || cfS3Api));
const isAws = Boolean(awsAccessKeyId && awsSecretAccessKey && awsBucketName);

let storage: any;

if (isCloudflare) {
  let endpoint = cfAccountId ? `https://${cfAccountId}.r2.cloudflarestorage.com` : '';
  let bucket = process.env.CLOUDFLARE_BUCKET_NAME || process.env.R2_BUCKET_NAME || '';

  if (cfS3Api) {
    try {
      const parsed = new URL(cfS3Api);
      endpoint = parsed.origin;
      const pathBucket = parsed.pathname.split('/').filter(Boolean)[0];
      if (pathBucket && !bucket) {
        bucket = pathBucket;
      }
    } catch {
      // ignore URL parse errors
    }
  }

  if (!bucket) {
    bucket = 'schooling-social';
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: cfAccessKeyId!,
      secretAccessKey: cfSecretAccessKey!,
    },
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        keepAlive: true,
        family: 4, // Force IPv4 to prevent connection timeouts
      }),
    }),
  });

  const rawStorage = multerS3({
    s3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `uploads/${Date.now()}-${sanitizedName}`);
    },
  });

  const originalHandleFile = (rawStorage as any)._handleFile.bind(rawStorage);
  storage = {
    _handleFile: (req: any, file: any, cb: any) => {
      originalHandleFile(req, file, (err: any, info: any) => {
        if (err) return cb(err);
        if (info && info.key) {
          const publicBase =
            cfPublicUrl ||
            (process.env.CLOUDFRONT_URL
              ? process.env.CLOUDFRONT_URL.startsWith('http')
                ? process.env.CLOUDFRONT_URL
                : `https://${process.env.CLOUDFRONT_URL}`
              : '');

          if (publicBase) {
            const cleanBase = publicBase.replace(/\/+$/, '');
            const cleanKey = info.key.replace(/^\/+/, '');
            info.location = `${cleanBase}/${cleanKey}`;
          }
        }
        cb(null, info);
      });
    },
    _removeFile: (req: any, file: any, cb: any) => {
      (rawStorage as any)._removeFile(req, file, cb);
    },
  };
} else if (isAws) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: awsAccessKeyId!,
      secretAccessKey: awsSecretAccessKey!,
    },
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        keepAlive: true,
        family: 4,
      }),
    }),
  });

  const rawStorage = multerS3({
    s3,
    bucket: awsBucketName!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `uploads/${Date.now()}-${sanitizedName}`);
    },
  });

  const originalHandleFile = (rawStorage as any)._handleFile.bind(rawStorage);
  storage = {
    _handleFile: (req: any, file: any, cb: any) => {
      originalHandleFile(req, file, (err: any, info: any) => {
        if (err) return cb(err);
        if (info && info.key && process.env.CLOUDFRONT_URL) {
          const cleanBase = (
            process.env.CLOUDFRONT_URL.startsWith('http')
              ? process.env.CLOUDFRONT_URL
              : `https://${process.env.CLOUDFRONT_URL}`
          ).replace(/\/+$/, '');
          const cleanKey = info.key.replace(/^\/+/, '');
          info.location = `${cleanBase}/${cleanKey}`;
        }
        cb(null, info);
      });
    },
    _removeFile: (req: any, file: any, cb: any) => {
      (rawStorage as any)._removeFile(req, file, cb);
    },
  };
} else {
  // Fallback to local storage if neither Cloudflare nor AWS is configured
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}-${sanitizedName}`);
    },
  });
}

const fileFilter = (req: any, file: any, cb: any) => {
  // Support images and common document files
  const allowedFileTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xlsx|xls/;
  const mimetype = allowedFileTypes.test(file.mimetype);
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('File type not allowed! Only images and common documents are permitted.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 64 * 1024 * 1024 }, // 64MB
  fileFilter,
});

export default upload;
