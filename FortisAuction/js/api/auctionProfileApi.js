const BASE_URL = "https://v2.api.noroff.dev";

function requireAuth(user) {
  if (!user?.accessToken || !user?.apiKey || !user?.name) {
    throw new Error("Missing auth credentials (accessToken/apiKey/name).");
  }
}

function authHeaders(user) {
  requireAuth(user);
  return {
    Authorization: `Bearer ${user.accessToken}`,
    "X-Noroff-API-Key": user.apiKey,
  };
}

async function parseJson(res) {

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function apiError(json, fallback) {
  return json?.errors?.[0]?.message || fallback || "Request failed.";
}

/* ===================== PROFILE ===================== */

export async function getProfile(user) {
  const res = await fetch(`${BASE_URL}/auction/profiles/${user.name}`, {
    headers: authHeaders(user),
  });

  const json = await parseJson(res);

  if (!res.ok) {
    throw new Error(apiError(json, "Profile load failed."));
  }

  return json.data;
}

export async function getMyListings(user) {
  const res = await fetch(
    `${BASE_URL}/auction/profiles/${user.name}/listings` +
    `?_bids=true&_seller=true&sort=created&sortOrder=desc&limit=100&page=1`,
    { headers: authHeaders(user) }
  );

  const json = await parseJson(res);

  if (!res.ok) {
    throw new Error(apiError(json, "Could not load listings."));
  }

  return json.data || [];
}

export async function getMyBids(user) {
  const res = await fetch(
    `${BASE_URL}/auction/profiles/${user.name}/bids` +
    `?_listings=true&sort=created&sortOrder=desc&limit=100&page=1`,
    { headers: authHeaders(user) }
  );

  const json = await parseJson(res);

  if (!res.ok) {
    throw new Error(apiError(json, "Could not load bids."));
  }

  return json.data || [];
}

export async function getMyWins(user) {
  const res = await fetch(
    `${BASE_URL}/auction/profiles/${user.name}/wins` +
    `?_bids=true&_seller=true&sort=created&sortOrder=desc&limit=100&page=1`,
    { headers: authHeaders(user) }
  );

  const json = await parseJson(res);

  if (!res.ok) {
    throw new Error(apiError(json, "Could not load wins."));
  }

  return json.data || [];
}

export async function updateProfile(user, payload) {
  const res = await fetch(`${BASE_URL}/auction/profiles/${user.name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(user),
    },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);

  if (!res.ok) {
    throw new Error(apiError(json, "Could not update profile."));
  }

  return json.data;
}

export async function getListingsByIds(user, ids = []) {
  requireAuth(user);

  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return [];

  const results = await Promise.all(
    unique.map(async (id) => {
      const res = await fetch(
        `${BASE_URL}/auction/listings/${id}?_bids=true&_seller=true`,
        { headers: authHeaders(user) }
      );
      const json = await parseJson(res);
      return res.ok ? json.data : null;
    })
  );

  return results.filter(Boolean);
}