import { apiRequest } from "./http";

function withUser(params, userId) {
  const search = new URLSearchParams(params ?? {});
  if (userId != null && userId !== "") search.set("user_id", String(userId));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getCommunityPosts({ category, q, userId, authorUserId } = {}) {
  const params = {};
  if (category && category !== "Tất cả") params.category = category;
  if (q) params.q = q;
  if (authorUserId) params.author_user_id = authorUserId;
  const res = await apiRequest(`/api/community/posts${withUser(params, userId)}`);
  return res.data;
}

export async function getCommunityPost(postId, userId) {
  const res = await apiRequest(`/api/community/posts/${postId}${withUser({}, userId)}`);
  return res.data;
}

export async function createCommunityPost(input) {
  const res = await apiRequest("/api/community/posts", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function updateCommunityPost(postId, input) {
  const res = await apiRequest(`/api/community/posts/${postId}`, {
    method: "PUT",
    body: input,
  });
  return res.data;
}

export async function deleteCommunityPost(postId, userId) {
  const res = await apiRequest(`/api/community/posts/${postId}`, {
    method: "DELETE",
    body: { user_id: userId },
  });
  return res.data;
}

export async function createCommunityComment(postId, input) {
  const res = await apiRequest(`/api/community/posts/${postId}/comments`, {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function toggleCommunityPostLike(postId, userId) {
  const res = await apiRequest(`/api/community/posts/${postId}/like`, {
    method: "POST",
    body: { user_id: userId },
  });
  return res.data;
}

export async function toggleCommunityCommentLike(commentId, userId) {
  const res = await apiRequest(`/api/community/comments/${commentId}/like`, {
    method: "POST",
    body: { user_id: userId },
  });
  return res.data;
}

export async function reportCommunityContent(input) {
  const res = await apiRequest("/api/community/reports", {
    method: "POST",
    body: input,
  });
  return res.data;
}

export async function getCommunityReports(status) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest(`/api/community/reports${params}`);
  return res.data;
}

export async function updateCommunityReportStatus(reportId, status) {
  const res = await apiRequest(`/api/community/reports/${reportId}/status`, {
    method: "PUT",
    body: { status },
  });
  return res.data;
}

export async function updateCommunityPostStatus(postId, status) {
  const res = await apiRequest(`/api/community/posts/${postId}/status`, {
    method: "PUT",
    body: { status },
  });
  return res.data;
}

export async function updateCommunityCommentStatus(commentId, status) {
  const res = await apiRequest(`/api/community/comments/${commentId}/status`, {
    method: "PUT",
    body: { status },
  });
  return res.data;
}
