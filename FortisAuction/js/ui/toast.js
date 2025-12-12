let toastTimeout;

export function showToast(message, type = "info") {
  let container = document.querySelector(".fa-toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "fa-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `fa-toast fa-toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// For console testing
window.showToast = showToast;