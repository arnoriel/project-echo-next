const API_URL = "http://localhost:8080";

export const fetchContents = async () => {
  const response = await fetch(`${API_URL}/contents`);
  if (!response.ok) {
    throw new Error("Failed to fetch contents");
  }
  return await response.json();
};

export const createContent = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  const response = await fetch(`${API_URL}/contents`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create content");
  }
  return await response.json();
};

// Tambahkan fungsi lain seperti editContent, deleteContent, dsb.
