import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { getUser, setUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";
import { loadFooter } from "../ui/footer.js";

const BASE_URL = "https://v2.api.noroff.dev";

document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    activateHeaderEvents();
    loadFooter();
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
    const editBtn = document.querySelector("#editListingBtn");

    if (!titleEl) return;
    titleEl.textContent = "Loading…";

    try {
        const res = await fetch(`${BASE_URL}/auction/listings/${id}?_seller=true&_bids=true`);
        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.errors?.[0]?.message || "Could not load listing.");
        }

        const listing = json.data;

        // Owner-only edit button
        const user = getUser();
        const isOwner = user?.name && listing?.seller?.name === user.name;

        if (editBtn) {
            if (isOwner) {
                editBtn.href = `/FortisAuction/edit.html?id=${listing.id}`;
                editBtn.style.display = "inline-block";
            } else {
                editBtn.style.display = "none";
            }
        }

        // Seller link to public profile
        if (sellerEl) {
            const sellerName = listing.seller?.name || "Unknown seller";
            sellerEl.textContent = sellerName;

            if (listing.seller?.name) {
                sellerEl.href = `/FortisAuction/public-profile.html?name=${encodeURIComponent(
                    listing.seller.name
                )}`;
            } else {
                sellerEl.removeAttribute("href");
            }
        }

        const mediaUrl =
            listing.media?.[0]?.url || "/FortisAuction/assets/images/placeholder.jpg";

        if (imageEl) {
            imageEl.src = mediaUrl;
            imageEl.alt = listing.media?.[0]?.alt || listing.title || "Listing image";
        }

        titleEl.textContent = listing.title || "Untitled listing";

        if (descEl) {
            descEl.textContent =
                listing.description || "No description has been provided for this listing.";
        }

        const bids = listing.bids || [];
        const totalBids = bids.length;
        const highestBid = totalBids ? Math.max(...bids.map((b) => b.amount)) : 0;

        if (totalBidsEl) totalBidsEl.textContent = totalBids;
        if (highestBidEl) highestBidEl.textContent = `${highestBid} credits`;

        if (endsAtEl) {
            endsAtEl.textContent = listing.endsAt ? new Date(listing.endsAt).toLocaleString() : "N/A";
        }

        if (bidHistoryEl) {
            bidHistoryEl.innerHTML = "";

            if (!bids.length) {
                bidHistoryEl.innerHTML = `<li class="no-bids">No bids yet – be the first one.</li>`;
            } else {
                const sorted = [...bids].sort(
                    (a, b) => new Date(b.created) - new Date(a.created)
                );

                sorted.forEach((bid) => {
                    const li = document.createElement("li");
                    li.innerHTML = `
            <span class="bidder-name">${bid.bidder?.name ?? "Unknown"}</span>
            <span class="bidder-date">${new Date(bid.created).toLocaleString()}</span>
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
        if (!user) {
            showToast("You must be logged in to place a bid.", "error");
            return;
        }

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

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await fetch(`${BASE_URL}/auction/listings/${listingId}/bids`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                    "X-Noroff-API-Key": apiKey,
                },
                body: JSON.stringify({ amount }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.errors?.[0]?.message || "Could not place bid.");
            }

            showToast("Bid placed successfully!", "success");
            amountInput.value = "";

            await refreshCreditsAfterBid();

            setTimeout(() => {
                window.location.reload();
            }, 700);
        } catch (error) {
            console.error(error);
            showToast(error.message || "Could not place bid.", "error");
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

async function refreshCreditsAfterBid() {
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

        if (!res.ok) {
            console.warn("Credits refresh failed:", json);
            return;
        }

        const newCredits = json.data?.credits;
        if (typeof newCredits !== "number") return;

        setUser({
            ...user,
            credits: newCredits,
            avatar: json.data?.avatar?.url || user.avatar,
        });

        updateCreditsUI(newCredits);
    } catch (e) {
        console.error("refreshCreditsAfterBid error:", e);
    }
}

function updateCreditsUI(credits) {
    const creditsEl = document.querySelector(".fa-credits");
    if (creditsEl) creditsEl.textContent = `Credits: ${credits}`;

    const pillEl = document.querySelector(".fa-menu-credits-pill");
    if (pillEl) pillEl.textContent = `Credits: ${credits}`;

    const feedCredits = document.querySelector(".feed-credits");
    if (feedCredits) feedCredits.textContent = `Credits: ${credits}`;

    const profileCredits = document.querySelector("#profileCredits");
    if (profileCredits) profileCredits.textContent = credits;
}