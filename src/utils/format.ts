const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateLong = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export const fmtTime = (iso: string) => time.format(new Date(iso));
export const fmtDateTime = (iso: string) => dateTime.format(new Date(iso));
export const fmtDate = (iso: string) => dateLong.format(new Date(iso));

export function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  return `${d} d atrás`;
}
