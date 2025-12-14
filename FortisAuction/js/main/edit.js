import { boot } from "../ui/boot.js";
import { getUser } from "../utils/storage.js";
import { showToast } from "../ui/toast.js";

const BASE_URL = "https://v2.api.noroff.dev";

boot(() => init());

function getId() {
    return new URLSearchParams(window.location.search).get("id");
}

async function init() {
    const id = getId();
    const user = getUser();

    if (!id || !user?.accessToken || !user?.apiKey) {
        showToast("Invalid access.", "error");
        return;
    }

    await loadListing(id, user);
    setupForm(id, user);
}

async function loadListing(id, user) {
    try {
        const res = await fetch(`${BASE_URL}/auction/listings/${id}?_seller=true`, {
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
                "X-Noroff-API-Key": user.apiKey,
            },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.errors?.[0]?.message || "Failed to load listing.");
        }

        const listing = json.data;

        if (listing.seller?.name !== user.name) {
            showToast("You do not own this listing.", "error");
            setTimeout(() => history.back(), 800);
            return;
        }

        document.querySelector("#title").value = listing.title || "";
        document.querySelector("#description").value = listing.description || "";
        document.querySelector("#media").value = listing.media?.[0]?.url || "";
        document.querySelector("#tags").value = (listing.tags || []).join(", ");
    } catch (err) {
        console.error(err);
        showToast(err.message || "Could not load listing.", "error");
    }
}

function setupForm(id, user) {
    const form = document.querySelector("#editListingForm");
    const deleteBtn = document.querySelector("#deleteListingBtn");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            title: document.querySelector("#title").value.trim(),
            description: document.querySelector("#description").value.trim(),
            tags: document
                .querySelector("#tags")
                .value.split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            media: document.querySelector("#media").value
                ? [{ url: document.querySelector("#media").value.trim(), alt: "Listing image" }]
                : [],
        };

        try {
            const res = await fetch(`${BASE_URL}/auction/listings/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.accessToken}`,
                    "X-Noroff-API-Key": user.apiKey,
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.errors?.[0]?.message || "Update failed.");
            }

            showToast("Listing updated!", "success");
            setTimeout(() => {
                window.location.href = `/FortisAuction/listing.html?id=${id}`;
            }, 700);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Could not update listing.", "error");
        }
    });

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Delete this listing permanently?")) return;

            try {
                const res = await fetch(`${BASE_URL}/auction/listings/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${user.accessToken}`,
                        "X-Noroff-API-Key": user.apiKey,
                    },
                });

                if (res.status === 204) {
                    showToast("Listing deleted.", "success");
                    setTimeout(() => {
                        window.location.href = "/FortisAuction/profile.html";
                    }, 700);
                } else {
                    throw new Error("Delete failed.");
                }
            } catch (err) {
                console.error(err);
                showToast("Could not delete listing.", "error");
            }
        });
    }
}