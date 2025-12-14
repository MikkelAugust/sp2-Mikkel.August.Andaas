import { getUser } from "../utils/storage.js";
import { showToast } from "./toast.js";

export function requireAuth({
  redirectTo = "/FortisAuction/login.html",
  message = "Please log in to continue.",
} = {}) {
  const user = getUser();
  if (!user?.accessToken || !user?.apiKey || !user?.name) {
    showToast(message, "error");
    setTimeout(() => (window.location.href = redirectTo), 700);
    return null;
  }
  return user;
}