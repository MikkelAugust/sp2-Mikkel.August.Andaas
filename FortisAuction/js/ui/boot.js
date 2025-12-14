import { loadHeader, activateHeaderEvents } from "./header.js";
import { loadFooter } from "./footer.js";

export async function boot(init) {
  loadHeader();
  activateHeaderEvents();
  loadFooter();
  await init?.();
}