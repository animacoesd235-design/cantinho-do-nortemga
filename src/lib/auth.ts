const AUTH_KEY = "cdn_admin_session_auth_v1";
const KITCHEN_AUTH_KEY = "cdn_kitchen_session_auth_v1";

// Senhas padrão administrativas (pode ser "admin123" ou "cantinho2026")
const SENHAS_VALIDAS = ["admin123", "cantinho2026", "admin"];

// Senhas aceitas na cozinha (aceita as credenciais de admin e credenciais operacionais)
const SENHAS_COZINHA = ["admin123", "cantinho2026", "admin", "cozinha123", "cozinha"];

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const token = sessionStorage.getItem(AUTH_KEY);
    return token === "authenticated";
  } catch (e) {
    console.error("Erro ao verificar autenticação do admin:", e);
    return false;
  }
}

export function isKitchenAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const adminToken = sessionStorage.getItem(AUTH_KEY);
    const kitchenToken = sessionStorage.getItem(KITCHEN_AUTH_KEY);
    return adminToken === "authenticated" || kitchenToken === "authenticated";
  } catch (e) {
    console.error("Erro ao verificar autenticação da cozinha:", e);
    return false;
  }
}

export function loginAdmin(password: string): boolean {
  if (typeof window === "undefined") return false;
  const cleanPass = password.trim();

  if (SENHAS_VALIDAS.includes(cleanPass)) {
    sessionStorage.setItem(AUTH_KEY, "authenticated");
    window.dispatchEvent(new CustomEvent("cdn:auth_changed"));
    return true;
  }
  return false;
}

export function loginKitchen(password: string): boolean {
  if (typeof window === "undefined") return false;
  const cleanPass = password.trim();

  if (SENHAS_VALIDAS.includes(cleanPass) || SENHAS_COZINHA.includes(cleanPass)) {
    sessionStorage.setItem(KITCHEN_AUTH_KEY, "authenticated");
    window.dispatchEvent(new CustomEvent("cdn:auth_changed"));
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent("cdn:auth_changed"));
}

export function logoutKitchen(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KITCHEN_AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent("cdn:auth_changed"));
}

export function onAuthChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("cdn:auth_changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cdn:auth_changed", handler);
    window.removeEventListener("storage", handler);
  };
}
