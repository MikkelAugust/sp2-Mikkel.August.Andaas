import { boot } from "../ui/boot.js";
import { getUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";

const BASE_URL = "https://v2.api.noroff.dev";

boot(() => {
  guardAuth();
  initCreateForm();
});

function guardAuth() {
  const user = getUser();
  const accessToken = user?.accessToken;
  const apiKey = user?.apiKey;

  if (!accessToken || !apiKey) {
    showToast("Please log in to create a listing.", "error");
    setTimeout(() => {
      window.location.href = "/FortisAuction/login.html";
    }, 700);
  }
}

function initCreateForm() {
  const form = document.querySelector("#createForm");
  if (!form) return;
  form.addEventListener("submit", handleCreate);
}

function parseTags(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function parseMedia(text) {
  if (!text) return [];
  const urls = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  return urls.map((url) => ({ url, alt: "Listing image" }));
}

function validateEndsAt(endsAtValue) {
  if (!endsAtValue) return "End date is required.";
  const endsAt = new Date(endsAtValue);
  const now = new Date();

  if (Number.isNaN(endsAt.getTime())) return "Invalid end date.";
  if (endsAt <= now) return "End date must be in the future.";
  return null;
}

async function handleCreate(e) {
  e.preventDefault();

  const user = getUser();
  const accessToken = user?.accessToken;
  const apiKey = user?.apiKey;

  if (!accessToken || !apiKey) {
    showToast("Your session is missing credentials. Please log in again.", "error");
    return;
  }

  const title = document.querySelector("#title")?.value.trim();
  const description = document.querySelector("#description")?.value.trim();
  const tagsRaw = document.querySelector("#tags")?.value.trim();
  const mediaRaw = document.querySelector("#mediaUrls")?.value.trim();
  const endsAtValue = document.querySelector("#endsAt")?.value;

  if (!title) {
    showToast("Title is required.", "error");
    return;
  }

  const endsError = validateEndsAt(endsAtValue);
  if (endsError) {
    showToast(endsError, "error");
    return;
  }

  const tags = parseTags(tagsRaw);
  const media = parseMedia(mediaRaw);

  const payload = {
    title,
    description: description || undefined,
    tags: tags.length ? tags : undefined,
    media: media.length ? media : undefined,
    endsAt: new Date(endsAtValue).toISOString(),
  };

  try {
    const res = await fetch(`${BASE_URL}/auction/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Noroff-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.errors?.[0]?.message || "Could not create listing.");
    }

    showToast("Listing created successfully!", "success");

    const id = json.data?.id;
    setTimeout(() => {
      window.location.href = id
        ? `/FortisAuction/listing.html?id=${id}`
        : "/FortisAuction/index.html";
    }, 700);
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not create listing.", "error");
  }
}