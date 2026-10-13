// Smoke test do configurador: carrega a página, testa os ramos principais
// (dia/noite, vistas, seleção de unidade, contornos) e tira screenshots.
// Uso: npx tsx scripts/smoke.ts  (server precisa estar em :3000)
import { chromium } from "playwright"
import { mkdirSync } from "fs"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = "screenshots"
mkdirSync(OUT, { recursive: true })

const erros: string[] = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on("console", (m) => {
  if (m.type() === "error") erros.push(m.text())
})
page.on("pageerror", (e) => erros.push(String(e)))

await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 })

// espera a UI hidratar (lista de unidades) e a cena montar o WebGL
await page.getByText("UNIDADES").waitFor({ timeout: 45_000 })
await page.waitForSelector("canvas", { timeout: 45_000 })
const canvasInfo = await page.locator("canvas").first().evaluate((el) => ({
  w: el.clientWidth,
  h: el.clientHeight,
}))

// espera a cena estabilizar (primeiros frames do WebGL)
await page.waitForTimeout(4000)
await page.screenshot({ path: `${OUT}/01-dia.png` })

// ramo 1: alternar Noite (bloom + janelas acesas + stars)
await page.getByRole("button", { name: "Noite", exact: true }).click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/02-noite.png` })

// ramo 2: voltar para Dia
await page.getByRole("button", { name: "Dia", exact: true }).click()
await page.waitForTimeout(1500)

// ramo 3: vista cobertura (câmera sobe)
await page.getByRole("button", { name: "cobertura" }).click()
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/03-cobertura.png` })

// ramo 4: clicar numa unidade na lista → painel abre com dados
await page.locator("aside").first().getByRole("button", { name: "402" }).click()
await page.waitForTimeout(800)
const painel = await page.locator("text=Valor de tabela").isVisible()
const valor = await page.getByText(/R\$\s*1[.,]/).first().textContent()

// ramo 5: navegar "próxima disponível"
await page.getByRole("button", { name: /Próxima disponível/ }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/04-unidade.png` })

// ramo 6: desligar "Contornar disponíveis" (toggle de estado)
await page.getByRole("button", { name: /Contornar disponíveis/ }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/05-sem-contorno.png` })

// canvas continua vivo (não crasheou o WebGL)?
const canvasVivo = await page.locator("canvas").first().isVisible()

console.log("=== SMOKE ===")
console.log("canvas:", JSON.stringify(canvasInfo), "| vivo no fim:", canvasVivo)
console.log("painel abriu:", painel, "| valor visível:", valor?.slice(0, 24))
console.log("erros de console:", erros.length ? erros.slice(0, 5) : "nenhum")

await browser.close()
if (!canvasVivo || !painel || erros.length > 0) process.exit(1)
