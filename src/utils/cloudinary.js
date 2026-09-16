const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

/**
 * Returns a Cloudinary delivery URL sized for the rendered image. URLs from
 * other image providers are returned unchanged so existing placeholders and
 * local assets continue to work.
 */
export const getOptimizedImageUrl = (url, { width, height, crop = "limit" } = {}) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const transformation = ["f_auto", "q_auto"];

  if (width) transformation.push(`w_${width}`);
  if (height) transformation.push(`h_${height}`);
  if (width || height) transformation.push(`c_${crop}`);

  return url.includes(CLOUDINARY_UPLOAD_SEGMENT)
    ? url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transformation.join(",")}/`)
    : url;
};
