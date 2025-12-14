import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { loadFooter } from "../ui/footer.js";
import { getUser, setUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";

import {
  renderProfileHeader,
  setSectionTitle,
  clearGrid,
  setGridMessage,
  renderCards,
} from "../ui/profileView.js";

import { wireProfileFilters } from "../ui/profileFilters.js";
import { wireProfileModal } from "../ui/profileModal.js";

const BASE_URL = "https://v2.api.noroff.dev";

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", async () => {
  loadHeader();
  activateHeaderEvents();
  loadFooter();

  if (!guardAuth()) return;

  wireProfileFilters(handleFilterChange);
  wireProfileModal({ onSave: saveProfileEdits });

  await refreshProfileUserData();

  document.querySelector('[data-filter="listings"]')?.classList.add("is-active");
  await loadUserListings(getUser());
});

/* ===================== AUTH ===================== */

function guardAuth() {
  const user = getUser();
  if (!user?.accessToken || !user?.apiKey || !user?.name) {
    showToast("Please log in to view your profile.", "error");
    setTimeout(() => {
      window.location.href = "/FortisAuction/login.html";
    }, 700);
    return false;
  }
  return true;
}

/* ===================== FILTER HANDLER ===================== */

async function handleFilterChange(filter) {
  const user = getUser();
  if (!user) return;

  if (filter === "listings") await loadUserListings(user);
  if (filter === "bids") await loadUserBids(user);
  if (filter === "wins") await loadUserWins(user);
}

/* ===================== PROFILE DATA ===================== */

function normalizeMedia(media, fallbackUrl) {
  if (!media) return { url: fallbackUrl, alt: "" };
  if (typeof media === "string") return { url: media, alt: "" };
  return { url: media.url || fallbackUrl, alt: media.alt || "" };
}

async function refreshProfileUserData() {
  const user = getUser();
  if (!user?.accessToken || !user?.apiKey || !user?.name) return;

  try {
    const res = await fetch(`${BASE_URL}/auction/profiles/${user.name}`, {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        "X-Noroff-API-Key": user.apiKey,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.message || "Profile load failed.");

    const avatar = normalizeMedia(
      json.data.avatar,
      "/FortisAuction/assets/images/avatar-placeholder.png"
    );
    const banner = normalizeMedia(
      json.data.banner,
      "/FortisAuction/assets/images/banner-placeholder.jpg"
    );

    setUser({
      ...user,
      credits: json.data.credits ?? user.credits,
      bio: json.data.bio || "",
      avatar,
      banner,
    });

    renderProfileHeader(getUser());
  } catch (err) {
    console.error(err);
  }
}

/* ===================== LISTINGS ===================== */

async function loadUserListings(user) {
  setSectionTitle("listings");
  clearGrid();
  setGridMessage("<p>Loading your listings…</p>");

  try {
    const res = await fetch(
      `${BASE_URL}/auction/profiles/${user.name}/listings?_bids=true&_seller=true&sort=created&sortOrder=desc&limit=100&page=1`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "X-Noroff-API-Key": user.apiKey,
        },
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.message || "Could not load listings.");

    const listings = json.data || [];
    if (!listings.length) {
      setGridMessage("<p>No listings yet.</p>");
      return;
    }

    renderCards(listings, "listing");
  } catch (e) {
    console.error(e);
    setGridMessage(`<p>${e.message || "Could not load listings."}</p>`);
  }
}

/* ===================== BIDS ===================== */

async function loadUserBids(user) {
  setSectionTitle("bids");
  clearGrid();
  setGridMessage("<p>Loading your bids…</p>");

  try {
    const res = await fetch(
      `${BASE_URL}/auction/profiles/${user.name}/bids?_listings=true&sort=created&sortOrder=desc&limit=100&page=1`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "X-Noroff-API-Key": user.apiKey,
        },
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.message || "Could not load bids.");

    const bids = json.data || [];
    if (!bids.length) {
      setGridMessage("<p>No bids yet.</p>");
      return;
    }

    // best/highest/latest bid per listing
    const bestByListing = new Map();
    bids.forEach((bid) => {
      const id = bid.listing?.id;
      if (!id) return;

      const prev = bestByListing.get(id);
      if (
        !prev ||
        bid.amount > prev.amount ||
        (bid.amount === prev.amount && new Date(bid.created) > new Date(prev.created))
      ) {
        bestByListing.set(id, bid);
      }
    });

    // refetch listings to get correct bid counts + bids array
    const listings = await Promise.all(
      [...bestByListing.keys()].map(async (id) => {
        const r = await fetch(`${BASE_URL}/auction/listings/${id}?_bids=true&_seller=true`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "X-Noroff-API-Key": user.apiKey,
          },
        });
        const j = await r.json();
        return j.data || null;
      })
    );

    const valid = listings.filter(Boolean);
    if (!valid.length) {
      setGridMessage("<p>No bid listings could be loaded.</p>");
      return;
    }

    renderCards(valid, "bid", bestByListing);
  } catch (e) {
    console.error(e);
    setGridMessage(`<p>${e.message || "Could not load bids."}</p>`);
  }
}

/* ===================== WINS ===================== */

async function loadUserWins(user) {
  setSectionTitle("wins");
  clearGrid();
  setGridMessage("<p>Loading wins…</p>");

  try {
    const res = await fetch(
      `${BASE_URL}/auction/profiles/${user.name}/wins?_bids=true&_seller=true`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "X-Noroff-API-Key": user.apiKey,
        },
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.message || "Could not load wins.");

    const wins = json.data || [];
    if (!wins.length) {
      setGridMessage("<p>No wins yet.</p>");
      return;
    }

    renderCards(wins, "win");
  } catch (e) {
    console.error(e);
    setGridMessage(`<p>${e.message || "Could not load wins."}</p>`);
  }
}

/* ===================== EDIT PROFILE SAVE ===================== */

async function saveProfileEdits(closeModal) {
  const user = getUser();
  if (!user?.accessToken || !user?.apiKey || !user?.name) return;

  const payload = {
    bio: document.querySelector("#bioInput")?.value || "",
    avatar: document.querySelector("#avatarUrlInput")?.value
      ? { url: document.querySelector("#avatarUrlInput").value }
      : undefined,
    banner: document.querySelector("#bannerUrlInput")?.value
      ? { url: document.querySelector("#bannerUrlInput").value }
      : undefined,
  };

  try {
    const res = await fetch(`${BASE_URL}/auction/profiles/${user.name}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.accessToken}`,
        "X-Noroff-API-Key": user.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.message || "Could not update profile.");

    setUser({ ...user, ...json.data });
    renderProfileHeader(getUser());
    showToast("Profile updated", "success");
    closeModal?.();
  } catch (e) {
    console.error(e);
    showToast(e.message || "Could not update profile.", "error");
  }
}