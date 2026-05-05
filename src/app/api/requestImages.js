import { apiRequest } from "./http";

const CLOUDINARY_UPLOAD_FOLDER = "auto-sos/requests";

export async function getRequestImages(requestId) {
  return apiRequest(`/api/requests/${requestId}/images`);
}

export async function addRequestImage(requestId, input) {
  return apiRequest(`/api/requests/${requestId}/images`, {
    method: "POST",
    body: {
      image_url: input.image_url,
    },
  });
}

export async function deleteRequestImage(requestId, imageId) {
  return apiRequest(`/api/requests/${requestId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function getCloudinaryUploadSignature() {
  const res = await apiRequest("/api/requests/cloudinary/signature", {
    method: "POST",
    body: { folder: CLOUDINARY_UPLOAD_FOLDER },
  });

  return res.data;
}

export async function uploadRequestImageToCloudinary(file) {
  const signature = await getCloudinaryUploadSignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("signature", signature.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && typeof payload.error?.message === "string"
        ? payload.error.message
        : "Không thể tải ảnh lên Cloudinary";
    throw new Error(message);
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    originalFilename: payload.original_filename,
  };
}