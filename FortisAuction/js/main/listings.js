import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { getUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";
import { loadFooter } from "../ui/footer.js";

const API_URL =
  "https://v2.api.noroff.dev/auction/listings?_seller=true&_bids=true&_active=true";

let allListings = [];
let visibleCount = 20; // 4 columns x 5 rows

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  activateHeaderEvents();
  loadFooter();

  initControls();
  loadListings();
});

function initControls() {
  const loadMoreBtn = document.querySelector("#loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleCount += 20;
      renderListings();
    });
  }

  const searchInput = document.querySelector("#searchInput");
  const tagInput = document.querySelector("#tagInput");

  if (searchInput) searchInput.addEventListener("input", renderListings);
  if (tagInput) tagInput.addEventListener("input", renderListings);
}

async function loadListings() {
  const grid = document.querySelector("#listingsGrid");
  if (!grid) return;

  grid.innerHTML = `<p>Loading listings…</p>`;

  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.errors?.[0]?.message || "Failed to load listings.");
    }

    allListings = json.data || [];

    if (!allListings.length) {
      grid.innerHTML = `<p>No active listings found.</p>`;
      const btn = document.querySelector("#loadMoreBtn");
      if (btn) btn.style.display = "none";
      return;
    }

    renderListings();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not load listings.", "error");
    grid.innerHTML = `<p>Could not load listings.</p>`;
  }
}

function renderListings() {
  const grid = document.querySelector("#listingsGrid");
  const loadMoreBtn = document.querySelector("#loadMoreBtn");
  const user = getUser();
  if (!grid) return;

  grid.innerHTML = "";

  const searchValue =
    document.querySelector("#searchInput")?.value.trim().toLowerCase() || "";
  const tagValue =
    document.querySelector("#tagInput")?.value.trim().toLowerCase() || "";

  let filtered = [...allListings];

  if (searchValue) {
    filtered = filtered.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return title.includes(searchValue) || desc.includes(searchValue);
    });
  }

  if (tagValue) {
    const tagsWanted = tagValue
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (tagsWanted.length) {
      filtered = filtered.filter((item) =>
        tagsWanted.every((wanted) =>
          (item.tags || []).some((t) => t.toLowerCase().includes(wanted))
        )
      );
    }
  }

  const visibleListings = filtered.slice(0, visibleCount);

  if (!visibleListings.length) {
    grid.innerHTML = `<p>No listings match your filters.</p>`;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

  visibleListings.forEach((item) => {
    const card = document.createElement("article");
    card.className = "listing-card";

    const image =
      item.media?.[0]?.url || "/FortisAuction/assets/images/placeholder.jpg";

    const bids = item.bids || [];
    const bidCount = bids.length;
    const highestBid = bidCount ? Math.max(...bids.map((b) => b.amount)) : 0;

    const endsAtText = item.endsAt
      ? new Date(item.endsAt).toLocaleDateString()
      : "N/A";

    const tags = item.tags?.slice(0, 3) || [];

    const description =
      item.description && item.description.length > 60
        ? item.description.slice(0, 60) + "…"
        : item.description || "";

    const sellerName = item.seller?.name ?? "Unknown";

    card.innerHTML = `
      <img src="${image}" alt="${item.title}" class="listing-image" />

      <div class="card-tags">
        ${tags.map((t) => `<span class="card-tag">${t}</span>`).join("")}
      </div>

      <div class="card-bids">${bidCount} bids</div>

      <div class="listing-info">
        <h2 class="listing-title">${item.title}</h2>

        <p class="listing-seller">
          By
          ${item.seller?.name
        ? `<a class="seller-link" href="/FortisAuction/public-profile.html?name=${encodeURIComponent(
          sellerName
        )}">${sellerName}</a>`
        : `${sellerName}`
      }
        </p>

        <p class="listing-desc">${description}</p>
        <p class="listing-deadline">Ends: ${endsAtText}</p>
        <p class="listing-bids-amount">Highest bid: ${highestBid} credits</p>

        ${user
        ? `<a href="/FortisAuction/listing.html?id=${item.id}" class="view-btn">View Details</a>`
        : `<p class="listing-login-hint">
                 please <a href="/FortisAuction/login.html">login</a> or
                 <a href="/FortisAuction/register.html">register</a> to place bids
               </p>`
      }
      </div>
    `;

    grid.appendChild(card);
  });

  if (loadMoreBtn) {
    if (visibleCount >= filtered.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "block";
      loadMoreBtn.textContent = "Load More ▼";
    }
  }
}