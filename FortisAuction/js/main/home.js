import { loadHeader, activateHeaderEvents } from "../ui/header.js";

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  activateHeaderEvents();
});