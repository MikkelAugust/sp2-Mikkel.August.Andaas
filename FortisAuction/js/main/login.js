import { loginUser, createApiKey, getProfile } from "../api/auth.js";
import { setUser } from "../utils/storage.js";
import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { loadFooter } from "../ui/footer.js";
import { showToast } from "../ui/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  activateHeaderEvents();
  loadFooter();

  const form = document.querySelector("#loginForm");
  if (!form) return;

  form.addEventListener("submit", handleLogin);
});

function normalizeMedia(media, fallbackUrl) {
  if (!media) return { url: fallbackUrl, alt: "" };
  if (typeof media === "string") return { url: media, alt: "" };
  return { url: media.url || fallbackUrl, alt: media.alt || "" };
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.querySelector("#email")?.value.trim();
  const password = document.querySelector("#password")?.value.trim();

  if (!email || !password) {
    showToast("Please fill in both fields.", "error");
    return;
  }

  const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const login = await loginUser(email, password);
    if (login?.errors?.length) {
      showToast(login.errors[0].message, "error");
      return;
    }

    const { accessToken, name } = login?.data || {};
    if (!accessToken || !name) {
      showToast("Login failed (missing token/name).", "error");
      return;
    }

    const keyRes = await createApiKey(accessToken);
    if (keyRes?.errors?.length) {
      showToast(keyRes.errors[0].message, "error");
      return;
    }

    const apiKey = keyRes?.data?.key;
    if (!apiKey) {
      showToast("Could not create API key.", "error");
      return;
    }

    const profile = await getProfile(name, accessToken, apiKey);
    if (profile?.errors?.length) {
      showToast(profile.errors[0].message, "error");
      return;
    }

    const userData = profile?.data || {};

    const avatar = normalizeMedia(
      userData.avatar,
      "/FortisAuction/assets/images/avatar-placeholder.png"
    );
    const banner = normalizeMedia(
      userData.banner,
      "/FortisAuction/assets/images/banner-placeholder.jpg"
    );

    setUser({
      name: userData.name || name,
      email: userData.email || email,
      bio: userData.bio || "",
      credits: userData.credits ?? 0,
      avatar,
      banner,
      accessToken,
      apiKey,
    });

    sessionStorage.setItem(
      "fa_welcome",
      JSON.stringify({ name: userData.name || name, isNew: false })
    );

    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/FortisAuction/index.html";
    }, 800);
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Something went wrong during login.", "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}