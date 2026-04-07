export const buildUploadUrl = (req, filename) => {
  if (!filename) {
    return '';
  }

  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};
