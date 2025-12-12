// js/main/listing.js

import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { getUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";

const BASE_URL = "https://v2.api.noroff.dev";

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  activateHeaderEvents();
  initPage();
});

function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function initPage() {
  const id = getListingIdFromUrl();

  if (!id) {
    showToast("No listing id provided.", "error");
    return;
  }

  await fetchAndRenderListing(id);
  setupBidForm(id);
}

async function fetchAndRenderListing(id) {
  const imageEl = document.querySelector("#listingImage");
  const titleEl = document.querySelector("#listingTitle");
  const descEl = document.querySelector("#listingDescription");
  const sellerEl = document.querySelector("#listingSeller");
  const totalBidsEl = document.querySelector("#listingTotalBids");
  const highestBidEl = document.querySelector("#listingHighestBid");
  const endsAtEl = document.querySelector("#listingEndsAt");
  const bidHistoryEl = document.querySelector("#bidHistory");

  if (!titleEl) return;

  titleEl.textContent = "Loading…";

  try {
    const res = await fetch(
      `${BASE_URL}/auction/listings/${id}?_seller=true&_bids=true`
    );
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.errors?.[0]?.message || "Could not load listing.");
    }

    const listing = json.data;

    // IMAGE
    const mediaUrl =
      listing.media?.[0]?.url ||
      "/FortisAuction/assets/images/placeholder.jpg";

    if (imageEl) {
      imageEl.src = mediaUrl;
      imageEl.alt = listing.media?.[0]?.alt || listing.title || "Listing image";
    }

    // BASIC INFO
    titleEl.textContent = listing.title || "Untitled listing";
    descEl.textContent =
      listing.description || "No description has been provided for this listing.";

    sellerEl.textContent = listing.seller?.name || "Unknown seller";

    const bids = listing.bids || [];
    const totalBids = bids.length;
    const highestBid = totalBids
      ? Math.max(...bids.map((b) => b.amount))
      : 0;

    totalBidsEl.textContent = totalBids;
    highestBidEl.textContent = `${highestBid} credits`;

    if (listing.endsAt) {
      const endsDate = new Date(listing.endsAt);
      endsAtEl.textContent = endsDate.toLocaleString();
    } else {
      endsAtEl.textContent = "N/A";
    }

    // BID HISTORY
    if (bidHistoryEl) {
      bidHistoryEl.innerHTML = "";

      if (!bids.length) {
        bidHistoryEl.innerHTML = `
          <li class="no-bids">No bids yet – be the first one.</li>
        `;
      } else {
        const sorted = [...bids].sort(
          (a, b) => new Date(b.created) - new Date(a.created)
        );

        sorted.forEach((bid) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span class="bidder-name">${bid.bidder?.name ?? "Unknown"}</span>
            <span class="bidder-date">
              ${new Date(bid.created).toLocaleString()}
            </span>
            <span class="bidder-amount">${bid.amount} credits</span>
          `;
          bidHistoryEl.appendChild(li);
        });
      }
    }
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not load listing.", "error");
    titleEl.textContent = "Error loading listing";
  }
}

function setupBidForm(listingId) {
  const form = document.querySelector("#bidForm");
  const amountInput = document.querySelector("#bidAmount");

  if (!form || !amountInput) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = getUser();
    console.log("BID USER DATA:", user);

    if (!user) {
      showToast("You must be logged in to place a bid.", "error");
      return;
    }

    // SAMME FELTNAVN SOM I login.js -> setUser(...)
    const accessToken = user.accessToken;
    const apiKey = user.apiKey;

    if (!accessToken || !apiKey) {
      showToast("Your session is missing credentials. Please log in again.", "error");
      return;
    }

    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) {
      showToast("Please enter a valid bid amount.", "error");
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/auction/listings/${listingId}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Noroff-API-Key": apiKey,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.errors?.[0]?.message || "Could not place bid.");
      }

      showToast("Bid placed successfully!", "success");
      amountInput.value = "";

      // Reload listing to refresh highest bid + history
      await fetchAndRenderListing(listingId);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Could not place bid.", "error");
    }
  });
}