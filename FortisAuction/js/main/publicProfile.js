import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { loadFooter } from "../ui/footer.js";
import { getUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";
import {
  buildListingCard,
  renderProfileHeader,
  setGridMessage,
  setSectionTitle,
  clearGrid,
} from "../ui/profileView.js";

const BASE_URL = "https://v2.api.noroff.dev";

document.addEventListener("DOMContentLoaded", async () => {
  loadHeader();
  activateHeaderEvents();
  loadFooter();

  const name = getProfileNameFromUrl();
  if (!name) {
    showToast("No profile name provided.", "error");
    setGridMessage("<p>Missing profile name.</p>");
    return;
  }

  wireFilters(name);

  document.querySelector('[data-filter="listings"]')?.classList.add("is-active");
  await loadPublicProfileAndView(name, "listings");
});

function getProfileNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("name") || "").trim();
}

function normalizeMedia(media, fallbackUrl) {
  if (!media) return { url: fallbackUrl, alt: "" };
  if (typeof media === "string") return { url: media, alt: "" };
  return { url: media.url || fallbackUrl, alt: media.alt || "" };
}

function authHeaders(user) {
  return {
    Authorization: `Bearer ${user.accessToken}`,
    "X-Noroff-API-Key": user.apiKey,
  };
}

function getAuthUserOrNull() {
  const user = getUser();
  if (!user?.accessToken || !user?.apiKey) return null;
  return user;
}

function wireFilters(profileName) {
  const buttons = document.querySelectorAll(".profile-filter-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const mode = btn.dataset.filter;
      await loadPublicProfileAndView(profileName, mode);
    });
  });
}

async function loadPublicProfileAndView(name, mode) {
  clearGrid();
  setSectionTitle(mode);

  const ok = await loadPublicProfileHeader(name);
  if (!ok) return;

  if (mode === "listings") return loadProfileListings(name);
  if (mode === "bids") return loadProfileBids(name);
  if (mode === "wins") return loadProfileWins(name);
}

async function loadPublicProfileHeader(name) {
  const authUser = getAuthUserOrNull();

  try {
    const res = await fetch(`${BASE_URL}/auction/profiles/${encodeURIComponent(name)}`, {
      headers: authUser ? authHeaders(authUser) : undefined,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.errors?.[0]?.message || "Could not load profile.");
    }

    const profile = json.data;

    const safeProfile = {
      ...profile,
      avatar: normalizeMedia(
        profile.avatar,
        "/FortisAuction/assets/images/avatar-placeholder.png"
      ),
      banner: normalizeMedia(
        profile.banner,
        "/FortisAuction/assets/images/banner-placeholder.jpg"
      ),
      credits: "",
    };

    renderProfileHeader(safeProfile);

    const creditsRow = document.querySelector(".profile-credits");
    if (creditsRow) creditsRow.style.display = "none";
    const editBtn = document.querySelector("#editProfileBtn");
    if (editBtn) editBtn.style.display = "none";

    return true;
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not load public profile.", "error");
    setGridMessage("<p>Could not load profile.</p>");
    return false;
  }
}

function requireAuthOrHint() {
  const u = getAuthUserOrNull();
  if (!u) {
    setGridMessage(
      `<p>You need to be logged in to view this section.</p>`
    );
    return null;
  }
  return u;
}

async function loadProfileListings(name) {
  const authUser = requireAuthOrHint();
  if (!authUser) return;

  setGridMessage("<p>Loading listings…</p>");

  const url =
    `${BASE_URL}/auction/profiles/${encodeURIComponent(name)}` +
    `/listings?_bids=true&_seller=true&sort=created&sortOrder=desc&limit=100&page=1`;

  const res = await fetch(url, { headers: authHeaders(authUser) });
  const json = await res.json();

  if (!res.ok) {
    showToast(json?.errors?.[0]?.message || "Could not load listings.", "error");
    setGridMessage("<p>Could not load listings.</p>");
    return;
  }

  const items = json.data || [];
  if (!items.length) {
    setGridMessage("<p>No listings yet.</p>");
    return;
  }

  const grid = document.querySelector("#profileGrid");
  grid.innerHTML = "";
  items.forEach((item) => grid.appendChild(buildListingCard(item, "listing")));
}

async function loadProfileBids(name) {
  const authUser = requireAuthOrHint();
  if (!authUser) return;

  setGridMessage("<p>Loading bids…</p>");

  const res = await fetch(
    `${BASE_URL}/auction/profiles/${encodeURIComponent(name)}/bids?_listings=true&sort=created&sortOrder=desc&limit=100&page=1`,
    { headers: authHeaders(authUser) }
  );
  const json = await res.json();

  if (!res.ok) {
    showToast(json?.errors?.[0]?.message || "Could not load bids.", "error");
    setGridMessage("<p>Could not load bids.</p>");
    return;
  }

  const bids = json.data || [];
  if (!bids.length) {
    setGridMessage("<p>No bids yet.</p>");
    return;
  }

  const bestByListing = new Map();

  bids.forEach((b) => {
    const id = b.listing?.id;
    if (!id) return;

    const prev = bestByListing.get(id);
    if (
      !prev ||
      b.amount > prev.amount ||
      (b.amount === prev.amount && new Date(b.created) > new Date(prev.created))
    ) {
      bestByListing.set(id, b);
    }
  });

  const listings = await Promise.all(
    [...bestByListing.keys()].map(async (id) => {
      const r = await fetch(`${BASE_URL}/auction/listings/${id}?_bids=true&_seller=true`, {
        headers: authHeaders(authUser),
      });
      const j = await r.json();
      return j.data;
    })
  );

  const valid = listings.filter(Boolean);
  if (!valid.length) {
    setGridMessage("<p>No bid listings could be loaded.</p>");
    return;
  }

  const grid = document.querySelector("#profileGrid");
  grid.innerHTML = "";
  valid.forEach((l) => {
    const bid = bestByListing.get(l.id);
    grid.appendChild(buildListingCard(l, "bid", bid.amount, bid.created));
  });
}

async function loadProfileWins(name) {
  const authUser = requireAuthOrHint();
  if (!authUser) return;

  setGridMessage("<p>Loading wins…</p>");

  const res = await fetch(
    `${BASE_URL}/auction/profiles/${encodeURIComponent(name)}/wins?_bids=true&_seller=true&sort=created&sortOrder=desc&limit=100&page=1`,
    { headers: authHeaders(authUser) }
  );
  const json = await res.json();

  if (!res.ok) {
    showToast(json?.errors?.[0]?.message || "Could not load wins.", "error");
    setGridMessage("<p>Could not load wins.</p>");
    return;
  }

  const items = json.data || [];
  if (!items.length) {
    setGridMessage("<p>No wins yet.</p>");
    return;
  }

  const grid = document.querySelector("#profileGrid");
  grid.innerHTML = "";
  items.forEach((item) => grid.appendChild(buildListingCard(item, "win")));
}