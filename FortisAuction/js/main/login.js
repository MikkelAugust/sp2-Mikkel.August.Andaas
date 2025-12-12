import { loginUser, createApiKey, getProfile } from "../api/auth.js";
import { setUser } from "../utils/storage.js";
import { loadHeader, activateHeaderEvents } from "../ui/header.js";
import { showToast } from "../ui/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  activateHeaderEvents();

  const form = document.querySelector("#loginForm");
  if (!form) return;

  form.addEventListener("submit", handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.querySelector("#email")?.value.trim();
  const password = document.querySelector("#password")?.value.trim();

  if (!email || !password) {
    showToast("Please fill in both fields.", "error");
    return;
  }

  try {
    // 1) LOGIN
    const login = await loginUser(email, password);
    console.log("LOGIN:", login);

    if (login.errors) {
      showToast(login.errors[0].message, "error");
      return;
    }

    const { accessToken, name } = login.data || {};
    if (!accessToken) {
      showToast("Login failed (no accessToken).", "error");
      return;
    }

    // 2) API KEY
    const keyRes = await createApiKey(accessToken);
    console.log("API KEY:", keyRes);

    if (keyRes.errors) {
      showToast(keyRes.errors[0].message, "error");
      return;
    }

    const apiKey = keyRes.data?.key;
    if (!apiKey) {
      showToast("Could not create API key.", "error");
      return;
    }

    // 3) PROFILE
    const profile = await getProfile(name, accessToken, apiKey);
    console.log("PROFILE:", profile);

    if (profile.errors) {
      showToast(profile.errors[0].message, "error");
      return;
    }

    const userData = profile.data;

    // 4) LAGRE BRUKER I LOCALSTORAGE
    setUser({
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar?.url || userData.avatar,
      credits: userData.credits,
      accessToken, // <- viktig navn
      apiKey,      // <- streng med nøkkel
    });

    // 5) Velkomst-info (sessionStorage, valgfritt)
    sessionStorage.setItem(
      "fa_welcome",
      JSON.stringify({
        name: userData.name,
        isNew: false,
      })
    );

    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/FortisAuction/index.html";
    }, 800);
  } catch (error) {
    console.error(error);
    showToast("Something went wrong during login.", "error");
  }
}