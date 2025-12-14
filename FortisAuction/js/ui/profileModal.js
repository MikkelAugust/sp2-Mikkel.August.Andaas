import { getUser } from "../utils/storage.js";

export function wireProfileModal({ onSave } = {}) {
  const overlay = document.querySelector("#profileModalOverlay");
  const openBtn = document.querySelector("#editProfileBtn");
  const closeBtn = document.querySelector("#profileModalClose");
  const form = document.querySelector("#profileEditForm");

  if (!overlay || !openBtn || !closeBtn || !form) return;

  if (overlay.dataset.wired === "true") return;
  overlay.dataset.wired = "true";

  const bioInput = document.querySelector("#bioInput");
  const avatarInput = document.querySelector("#avatarUrlInput");
  const bannerInput = document.querySelector("#bannerUrlInput");

  let lastFocusedEl = null;

  const open = () => {
    lastFocusedEl = document.activeElement;

    const user = getUser();
    if (bioInput) bioInput.value = user?.bio || "";
    if (avatarInput) avatarInput.value = user?.avatar?.url || "";
    if (bannerInput) bannerInput.value = user?.banner?.url || "";

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    (bioInput || avatarInput || bannerInput || closeBtn)?.focus?.();
  };

  const close = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    lastFocusedEl?.focus?.();
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await onSave?.(close);
  });
}