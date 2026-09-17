const AUTH_KEY = "cdn_admin_session_auth_v1";

// Senha padrão administrativa (pode ser "admin123" ou "cantinho2026")
const SENHAS_VALIDAS = ["admin123", "cantinho2026", "admin"];

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const token = sessionStorage.getItem(AUTH_KEY);
    return token === "authenticated";
  } catch (e) {
    console.error("Erro ao verificar autenticação:", e);
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

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
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
