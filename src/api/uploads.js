import { apiRequest } from "./http";

export async function getCloudinaryUploadSignature(folder = "auto-sos/requests") {
  const res = await apiRequest("/api/requests/cloudinary/signature", {
    method: "POST",
    body: { folder },
  });

  return res.data;
}

export async function uploadFileToCloudinary(file, folder = "auto-sos/requests") {
  const signature = await getCloudinaryUploadSignature(folder);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("signature", signature.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`;
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
        : "Không thể tải tệp lên Cloudinary";
    throw new Error(message);
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    originalFilename: payload.original_filename,
    resourceType: payload.resource_type,
  };
}
