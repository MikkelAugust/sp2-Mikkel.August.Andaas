import { getUser, clearUser } from "../utils/storage.js";

export function loadHeader() {
  const header = document.querySelector("#header");
  if (!header) return;

  const user = getUser();

  const avatarUrl =
    (user && (user.avatar?.url || user.avatar)) ||
    "/FortisAuction/assets/images/avatar-placeholder.png";

  header.innerHTML = `
    <div class="fa-header">
      <div class="fa-header-inner">
        <!-- Logo -->
        <a href="/FortisAuction/index.html" class="fa-logo">
          <img
            src="/FortisAuction/assets/logos/hammer.png"
            alt="Fortis Auction Logo"
            class="fa-logo-img"
          />
          <span class="fa-logo-text">Fortis Auction</span>
        </a>

        <!-- Right side -->
        ${user
      ? `
          <div class="fa-header-right">
            <div class="green-pill">
              <span class="fa-credits-pill-desktop">
                Credits: ${user.credits ?? 0}
              </span>
            </div>

            <a
              href="#"
              class="fa-header-avatar"
              role="button"
              aria-label="Open profile menu"
            >
              <img
                src="${avatarUrl}"
                alt="${user.name || "User"} avatar"
              />
            </a>
          </div>
        `
      : `
          <div class="fa-header-right">
            <a href="/FortisAuction/login.html" class="fa-header-link">Login</a>
            <a href="/FortisAuction/register.html" class="fa-header-link">Register</a>
          </div>
        `
    }
      </div>
    </div>

    ${user
      ? `
      <!-- Overlay menu -->
      <div class="fa-menu-overlay" id="faMobileMenu" aria-hidden="true">
        <div class="fa-menu-inner">
          <button class="fa-menu-close" aria-label="Close menu">×</button>

          <div class="fa-menu-avatar">
            <img
              src="${avatarUrl}"
              alt="${user.name || "User"} avatar"
            />
          </div>

          <button type="button" class="fa-menu-credits-pill">
            Credits: ${user.credits ?? 0}
          </button>

          <button
            type="button"
            class="fa-menu-pill fa-menu-pill-profile"
            data-menu="profile">
            Profile
          </button>

          <button
            type="button"
            class="fa-menu-pill fa-menu-pill-logout"
            data-menu="logout">
            Log out
          </button>
        </div>
      </div>
    `
      : ""
    }
  `;
}

export function activateHeaderEvents() {
  const menuOverlay = document.querySelector("#faMobileMenu");
  const closeBtn = menuOverlay?.querySelector(".fa-menu-close");
  const profileBtn = menuOverlay?.querySelector('[data-menu="profile"]');
  const logoutBtn = menuOverlay?.querySelector('[data-menu="logout"]');
  const avatarBtn = document.querySelector(".fa-header-avatar");

  if (avatarBtn && menuOverlay) {
    const openMenu = (e) => {
      e.preventDefault();
      menuOverlay.classList.add("is-open");
      menuOverlay.setAttribute("aria-hidden", "false");
    };

    avatarBtn.addEventListener("click", openMenu);

    avatarBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu(e);
      }
    });
  }

  if (closeBtn && menuOverlay) {
    closeBtn.addEventListener("click", () => {
      menuOverlay.classList.remove("is-open");
      menuOverlay.setAttribute("aria-hidden", "true");
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "/FortisAuction/profile.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearUser();
      window.location.href = "/FortisAuction/welcome.html";
    });
  }
}