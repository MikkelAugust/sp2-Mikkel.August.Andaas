export function loadFooter() {
  const footer = document.querySelector("#footer");
  if (!footer) return;

  const path = window.location.pathname.toLowerCase();
  if (path.includes("login") || path.includes("register")) {
    footer.remove();
    return;
  }

  footer.classList.add("welcome-footer");

  footer.innerHTML = `
    <div class="welcome-footer-inner">

      <!-- BRAND -->
      <section class="footer-col footer-brand">
        <h3 class="footer-title">Fortis Auction</h3>
        <p class="footer-desc">
          A modern auction platform focused on secure bidding, transparent listings,
          and a smooth experience for both buyers and sellers.
        </p>
        <p class="footer-sub">
          Built for learning. Designed like a real product.
        </p>
      </section>

      <!-- ACTIONS -->
      <section class="footer-col footer-actions">
        <h4 class="footer-heading">Explore</h4>
        <ul class="footer-list">
          <li><a href="/FortisAuction/index.html">Browse listings</a></li>
          <li><a href="/FortisAuction/create.html">Create a listing</a></li>
          <li><a href="/FortisAuction/profile.html">Your profile</a></li>
          <li><a href="/FortisAuction/login.html">Sign in</a></li>
        </ul>
      </section>

      <!-- INFO -->
      <section class="footer-col footer-info">
        <h4 class="footer-heading">Platform</h4>

        <ul class="footer-meta">
          <li>
            <span class="meta-label">Credits</span>
            <span>Live balance & refunds</span>
          </li>
          <li>
            <span class="meta-label">Status</span>
            <span class="status-pill">Active</span>
          </li>
        </ul>

        <div class="footer-socials">
          <a href="#" aria-label="Facebook" class="social-link">
            <img src="/FortisAuction/assets/logos/SVG FACEBOOK.svg" alt="Facebook" />
          </a>
          <a href="#" aria-label="Instagram" class="social-link">
            <img src="/FortisAuction/assets/logos/SVG INSTAGRAM.svg" alt="Instagram" />
          </a>
          <a href="#" aria-label="Twitter" class="social-link">
            <img src="/FortisAuction/assets/logos/SVG TWITTER.svg" alt="Twitter" />
          </a>
          <a href="#" aria-label="GitHub" class="social-link">
            <img src="/FortisAuction/assets/logos/SVG GITHUB.svg" alt="GitHub" />
          </a>
        </div>
      </section>

      <!-- BOTTOM -->
      <div class="footer-bottom">
        <span>© 2025 Fortis Auction</span>
        <span class="footer-tech">
          FED · HTML · CSS · JavaScript
        </span>
      </div>

    </div>
  `;
}