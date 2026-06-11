import { apiRequest } from "./http";
import { uploadFileToCloudinary } from "./uploads";

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

export async function uploadRequestImageToCloudinary(file) {
  return uploadFileToCloudinary(file, "rescuesos/requests");
}
