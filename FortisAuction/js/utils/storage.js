export function getUser() {
  const value = localStorage.getItem("user");
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("user");
}