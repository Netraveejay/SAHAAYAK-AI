const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || 'sahaayak-ai-uploads';

async function uploadFile(fileBuffer, fileName, contentType, folder = 'documents') {
  const key = `${folder}/${Date.now()}_${fileName}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  }));
  
  return { key, url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}` };
}

async function getPresignedUploadUrl(fileName, contentType, folder = 'documents') {
  const key = `${folder}/${Date.now()}_${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl: url, key };
}

async function getPresignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  uploadFile,
  getPresignedUploadUrl,
  getPresignedDownloadUrl
};
