const API_BASE = "https://v2.api.noroff.dev";

const REGISTER_URL = `${API_BASE}/auth/register`;
const LOGIN_URL = `${API_BASE}/auth/login`;
const KEY_URL = `${API_BASE}/auth/create-api-key`;
const PROFILE_URL = `${API_BASE}/auction/profiles`;

// REGISTER USER
export async function registerUser(name, email, password) {
  const response = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  return await response.json();
}

// LOGIN USER
export async function loginUser(email, password) {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return await response.json();
}

// CREATE API KEY
export async function createApiKey(token) {
  const response = await fetch(KEY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
}

// GET USER PROFILE
export async function getProfile(name, token, apiKey) {
  const response = await fetch(`${PROFILE_URL}/${name}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": apiKey,
    },
  });

  return await response.json();
}