import cloudinary from '../config/cloudinary.js';

export const uploadImageBuffer = async (fileBuffer) => {
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!hasCloudinaryConfig) {
    const error = new Error('Image uploads are not configured on the server');
    error.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw error;
  }

  const base64 = fileBuffer.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'kura'
    });

    return result.secure_url;
  } catch (err) {
    const error = new Error('Image upload failed');
    error.code = 'CLOUDINARY_UPLOAD_FAILED';
    throw error;
  }
};
