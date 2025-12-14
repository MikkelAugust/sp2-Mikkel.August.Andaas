export function wireProfileFilters(onChange) {
  const buttons = document.querySelectorAll(".profile-filter-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      await onChange(btn.dataset.filter);
    });
  });
}