export type Status = "disponivel" | "reservada" | "vendida"

// atalho: número de demo; trocar pelo corretor real quando integrar CRM
export const WHATSAPP = "5511999999999"

export interface Unidade {
  id: string // "101", "102", ...
  tipologia: string
  areaPrivativa: number // m²
  pavimento: number
  vaga: string
  valorTabela: number
  status: Status
  // posição do módulo no prédio (x lateral, z frente/fundos)
  lado: "frente" | "fundos"
}

const TIPOLOGIAS = {
  frente: {
    tipologia: "3 suítes · frente, sacada gourmet",
    area: 108.13,
    base: 1_747_689.33,
  },
  fundos: {
    tipologia: "2 suítes · fundos, jardim técnico",
    area: 86.5,
    base: 1_418_900.0,
  },
} as const

const VENDIDAS = new Set(["201", "402", "601"])
const RESERVADAS = new Set(["102", "301"])

// preço sobe ~2,2% por pavimento (vista/andar)
export const UNIDADES: Unidade[] = Array.from({ length: 6 }, (_, p) =>
  (["frente", "fundos"] as const).map((lado) => {
    const t = TIPOLOGIAS[lado]
    const pavimento = p + 1
    const id = `${pavimento}${lado === "frente" ? "01" : "02"}`
    const status: Status = VENDIDAS.has(id)
      ? "vendida"
      : RESERVADAS.has(id)
        ? "reservada"
        : "disponivel"
    return {
      id,
      tipologia: t.tipologia,
      areaPrivativa: t.area,
      pavimento,
      vaga: `0${p * 2 + (lado === "frente" ? 1 : 2)}`,
      valorTabela: Math.round(t.base * Math.pow(1.022, p) * 100) / 100,
      status,
      lado,
    }
  }),
).flat()

export const POR_ID = new Map(UNIDADES.map((u) => [u.id, u]))

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export const LABEL_STATUS: Record<Status, string> = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
}
