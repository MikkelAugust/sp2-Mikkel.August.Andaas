import { getUser } from "../utils/storage.js";

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
}

function isEnded(endsAt) {
  if (!endsAt) return false;
  return new Date(endsAt).getTime() < Date.now();
}

function calcHighestBid(bids = []) {
  if (!Array.isArray(bids) || !bids.length) return 0;
  return Math.max(...bids.map((b) => Number(b.amount) || 0));
}

export function setSectionTitle(mode) {
  const title = document.querySelector("#profileSectionTitle");
  if (!title) return;
  if (mode === "listings") title.textContent = "My Listings";
  if (mode === "bids") title.textContent = "My Bids";
  if (mode === "wins") title.textContent = "Wins";
}

export function clearGrid() {
  const grid = document.querySelector("#profileGrid");
  if (grid) grid.innerHTML = "";
}

export function setGridMessage(html) {
  const grid = document.querySelector("#profileGrid");
  if (grid) grid.innerHTML = html;
}

export function renderProfileHeader(user) {
  if (!user) return;

  const bannerEl = document.querySelector("#profileBanner");
  if (bannerEl) {
    const bannerUrl =
      user.banner?.url || "/FortisAuction/assets/images/banner-placeholder.jpg";
    bannerEl.style.backgroundImage = `url("${bannerUrl}")`;
  }

  const avatarEl = document.querySelector("#profileAvatar");
  if (avatarEl) {
    avatarEl.src =
      user.avatar?.url || "/FortisAuction/assets/images/avatar-placeholder.png";
  }

  document.querySelector("#profileName").textContent = user.name || "";
  document.querySelector("#profileEmail").textContent = user.email || "";
  document.querySelector("#profileCredits").textContent = user.credits ?? 0;

  const bioEl = document.querySelector("#profileBio");
  if (bioEl) bioEl.textContent = user.bio?.trim() ? user.bio : "No bio yet.";
}

export function renderCards(items, type, extraById = null) {
  const grid = document.querySelector("#profileGrid");
  if (!grid) return;

  grid.innerHTML = "";

  items.forEach((item) => {
    const extra = extraById?.get(item.id);
    grid.appendChild(
      buildListingCard(item, type, extra?.amount ?? null, extra?.created ?? null)
    );
  });
}

export function buildListingCard(item, type = "listing", myBidAmount = null, myBidCreated = null) {
  const card = document.createElement("article");
  card.className = "profile-card";

  const user = getUser();
  const isOwner = item?.seller?.name && user?.name && item.seller.name === user.name;

  const img = item.media?.[0]?.url || "/FortisAuction/assets/images/placeholder.jpg";
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];
  const bids = item.bids || [];
  const bidCount = bids.length || item._count?.bids || 0;
  const highest = calcHighestBid(bids);

  const ends = fmtDate(item.endsAt);
  const status = isEnded(item.endsAt) ? "Ended" : "Active";

  const desc =
    item.description && item.description.length > 90
      ? item.description.slice(0, 90) + "…"
      : item.description || "No description.";

  let badgeText = status;
  let badgeClass = status === "Active" ? "is-active" : "is-ended";

  if (type === "bid") {
    badgeText = "Your bid";
    badgeClass = "is-bid";
  }
  if (type === "win") {
    badgeText = "Win";
    badgeClass = "is-win";
  }

  const placedWhen = myBidCreated ? new Date(myBidCreated).toLocaleString() : null;

  card.innerHTML = `
    <div class="profile-card-image">
      <img src="${img}" alt="${item.title || "Listing"}" loading="lazy" />
      <span class="profile-badge ${badgeClass}">${badgeText}</span>

      ${isOwner
      ? `<a class="card-edit-btn" href="/FortisAuction/edit.html?id=${item.id}" aria-label="Edit listing">✎</a>`
      : ""
    }
    </div>

    <div class="profile-card-body">
      <h3 class="profile-card-title">${item.title || "Untitled listing"}</h3>
      <p class="profile-card-desc">${desc}</p>

      <div class="profile-tags">
        ${tags.length
      ? tags.map((t) => `<span class="profile-tag">${t}</span>`).join("")
      : `<span class="profile-tag is-muted">no tags</span>`
    }
      </div>

      <div class="profile-stats">
        <span>${bidCount} bids</span>
        <span>Ends: ${ends}</span>
      </div>

      ${type === "bid"
      ? `
            <p class="profile-card-meta-line">
              Your bid: <strong>${myBidAmount}</strong> credits
              ${placedWhen ? `<br/>Placed: ${placedWhen}` : ""}
            </p>
          `
      : `
            <p class="profile-card-bid">
              Highest bid: <strong>${highest}</strong> credits
            </p>
          `
    }

      <div class="profile-card-actions">
        <a class="profile-card-btn" href="/FortisAuction/listing.html?id=${item.id}">View listing</a>
      </div>
    </div>
  `;

  return card;
}