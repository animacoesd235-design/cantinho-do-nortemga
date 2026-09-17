export interface DaySchedule {
  dia: string;
  aberto: boolean;
  inicio: string;
  fim: string;
}

export interface StoreSettings {
  pausadoManualmente: boolean;
  motivoPausa: string;
  mensagemPausaPersonalizada: string;
  previsaoRetorno: string;
  horariosSemanais: DaySchedule[];
}

const STORAGE_KEY = "cdn_store_settings_v1";

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const DEFAULT_SETTINGS: StoreSettings = {
  pausadoManualmente: false,
  motivoPausa: "Pausa Momentânea",
  mensagemPausaPersonalizada:
    "Estamos fazendo uma breve pausa nos atendimentos no momento. Você pode navegar pelo nosso cardápio à vontade e programar seu pedido!",
  previsaoRetorno: "Hoje às 18:00",
  horariosSemanais: [
    { dia: "Domingo", aberto: true, inicio: "13:00", fim: "22:30" },
    { dia: "Segunda-feira", aberto: true, inicio: "13:00", fim: "22:00" },
    { dia: "Terça-feira", aberto: true, inicio: "13:00", fim: "22:00" },
    { dia: "Quarta-feira", aberto: true, inicio: "13:00", fim: "22:00" },
    { dia: "Quinta-feira", aberto: true, inicio: "13:00", fim: "22:00" },
    { dia: "Sexta-feira", aberto: true, inicio: "13:00", fim: "23:00" },
    { dia: "Sábado", aberto: true, inicio: "13:00", fim: "23:00" },
  ],
};

export function getStoreSettings(): StoreSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Erro ao carregar store settings:", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("cdn:settings_updated"));
  } catch (e) {
    console.error("Erro ao salvar store settings:", e);
  }
}

export function toggleEmergencyPause(
  pausado: boolean,
  motivo = "Pausa Momentânea",
  mensagem = "",
  previsao = ""
): void {
  const current = getStoreSettings();
  current.pausadoManualmente = pausado;
  current.motivoPausa = motivo;
  if (mensagem) current.mensagemPausaPersonalizada = mensagem;
  if (previsao) current.previsaoRetorno = previsao;
  saveStoreSettings(current);
}

export interface StoreStatusResult {
  isOpen: boolean;
  reason: "open" | "manual_pause" | "closed_schedule";
  badgeText: string;
  bannerTitle: string;
  bannerMessage: string;
  nextSchedule?: string;
}

export function checkStoreOpenStatus(): StoreStatusResult {
  const settings = getStoreSettings();

  if (settings.pausadoManualmente) {
    return {
      isOpen: false,
      reason: "manual_pause",
      badgeText: "Pausa Momentânea",
      bannerTitle: "🌿 Atendimento Temporariamente Pausado",
      bannerMessage:
        settings.mensagemPausaPersonalizada ||
        "Estamos em uma breve pausa na cozinha para reposição de lotes artesanais. Sinta-se à vontade para explorar nosso cardápio!",
      nextSchedule: settings.previsaoRetorno || "Em breve",
    };
  }

  const now = new Date();
  const dayIndex = now.getDay();
  const schedule = settings.horariosSemanais[dayIndex];

  if (!schedule || !schedule.aberto) {
    return {
      isOpen: false,
      reason: "closed_schedule",
      badgeText: "Fechado Hoje",
      bannerTitle: `🌿 Estamos fechados hoje (${DIAS_SEMANA[dayIndex]})`,
      bannerMessage:
        "Nosso espaço físico de preparo está descansando, mas o cardápio está aberto para você conhecer todas as delícias amazônicas!",
      nextSchedule: "Abriremos no próximo dia útil",
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = schedule.inicio.split(":").map(Number);
  const [endH, endM] = schedule.fim.split(":").map(Number);
  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  if (currentMinutes < startTotalMinutes) {
    return {
      isOpen: false,
      reason: "closed_schedule",
      badgeText: `Abre às ${schedule.inicio}`,
      bannerTitle: "🌿 Fora do Horário de Atendimento",
      bannerMessage: `Estamos preparando os potes e garrafas artesanais. Nosso delivery começará a atender hoje às ${schedule.inicio}!`,
      nextSchedule: `Hoje das ${schedule.inicio} às ${schedule.fim}`,
    };
  }

  if (currentMinutes >= endTotalMinutes) {
    return {
      isOpen: false,
      reason: "closed_schedule",
      badgeText: "Fechado por hoje",
      bannerTitle: "🌿 Atendimento Encerrado por Hoje",
      bannerMessage:
        "Obrigado pelo carinho! Nossas entregas de hoje se encerraram, mas sinta-se à vontade para navegar pelo cardápio e agendar para amanhã.",
      nextSchedule: "Amanhã a partir das 13:00",
    };
  }

  return {
    isOpen: true,
    reason: "open",
    badgeText: "Aberto Agora",
    bannerTitle: "🌿 Delivery Aberto",
    bannerMessage: `Atendendo hoje até às ${schedule.fim} em toda Maringá!`,
    nextSchedule: `Até ${schedule.fim}`,
  };
}

export function onStoreSettingsUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("cdn:settings_updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cdn:settings_updated", handler);
    window.removeEventListener("storage", handler);
  };
}
