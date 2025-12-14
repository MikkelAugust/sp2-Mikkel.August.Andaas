import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { loadFooter } from "../ui/footer.js";
import { showToast } from "../ui/toast.js";
import { setUser } from "../utils/storage.js";

const BASE_URL = "https://v2.api.noroff.dev";

document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    activateHeaderEvents();
    loadFooter();
    wireRegister();
});

function wireRegister() {
    const form =
        document.querySelector("#registerForm") ||
        document.querySelector('form[data-register="form"]') ||
        document.querySelector("form");

    if (!form || form.dataset.wired === "true") return;
    form.dataset.wired = "true";

    form.addEventListener("submit", handleRegister);
}

function readField(form, keys = []) {
    for (const k of keys) {
        const el =
            form.querySelector(`#${k}`) ||
            form.querySelector(`[name="${k}"]`) ||
            form.querySelector(`[data-field="${k}"]`);
        if (el?.value != null) return el.value.trim();
    }
    return "";
}

function isValidNoroffEmail(email) {
    return /^[^\s@]+@stud\.noroff\.no$/i.test(email);
}

function isValidName(name) {
    return /^[A-Za-z0-9_]+$/.test(name);
}

async function handleRegister(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const name = readField(form, ["name", "username", "registerName"]);
        const email = readField(form, ["email", "registerEmail"]);
        const password = readField(form, ["password", "registerPassword"]);
        const avatarUrl = readField(form, ["avatar", "avatarUrl", "registerAvatarUrl"]);

        if (!name || !email || !password) {
            throw new Error("Name, email and password are required.");
        }

        if (!isValidName(name)) {
            throw new Error("Name can only contain letters, numbers and underscore (_).");
        }

        if (!isValidNoroffEmail(email)) {
            throw new Error("Email must be a valid @stud.noroff.no address.");
        }

        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        /* ================= REGISTER ================= */

        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                password,
                ...(avatarUrl
                    ? { avatar: { url: avatarUrl, alt: `${name} avatar` } }
                    : {}),
            }),
        });

        const regJson = await regRes.json();
        if (!regRes.ok) throw new Error(regJson?.errors?.[0]?.message);

        /* ================= LOGIN ================= */

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const loginJson = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginJson?.errors?.[0]?.message);

        const accessToken = loginJson?.data?.accessToken;
        const userName = loginJson?.data?.name || name;
        if (!accessToken) throw new Error("No access token returned.");

        /* ================= API KEY ================= */

        const keyRes = await fetch(`${BASE_URL}/auth/create-api-key`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: `FortisAuction-${userName}` }),
        });

        const keyJson = await keyRes.json();
        if (!keyRes.ok) throw new Error(keyJson?.errors?.[0]?.message);

        const apiKey = keyJson?.data?.key;
        if (!apiKey) throw new Error("API key missing.");

        /* ================= PROFILE ================= */

        const profRes = await fetch(`${BASE_URL}/auction/profiles/${userName}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Noroff-API-Key": apiKey,
            },
        });

        const profJson = await profRes.json();
        if (!profRes.ok) throw new Error(profJson?.errors?.[0]?.message);

        const profile = profJson.data;

        setUser({
            name: profile.name,
            email: profile.email,
            credits: profile.credits ?? 0,
            avatar: profile.avatar ?? null,
            banner: profile.banner ?? null,
            bio: profile.bio ?? "",
            accessToken,
            apiKey,
        });

        showToast("Account created! Redirecting…", "success");
        setTimeout(() => {
            window.location.href = "/FortisAuction/profile.html";
        }, 700);
    } catch (err) {
        console.error(err);
        showToast(err.message || "Something went wrong.", "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}