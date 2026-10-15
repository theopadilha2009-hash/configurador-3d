"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  Html,
  OrbitControls,
  Sky,
  Stars,
  useProgress,
} from "@react-three/drei"
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import Cena, { PE_DIREITO } from "@/components/Cena"
import { brl, LABEL_STATUS, POR_ID, UNIDADES, WHATSAPP } from "@/data/unidades"

type Vista = "frente" | "lateral" | "fundos" | "cobertura"

const VISTAS: Record<Vista, { pos: [number, number, number]; target: [number, number, number] }> = {
  frente: { pos: [16, 9, 26], target: [0, 6, 0] },
  lateral: { pos: [30, 9, 0], target: [0, 6, 0] },
  fundos: { pos: [-14, 9, -26], target: [0, 6, 0] },
  cobertura: { pos: [6, 42, 14], target: [0, 4, 0] },
}

function CameraRig({
  vista,
  controls,
}: {
  vista: Vista
  controls: React.RefObject<OrbitControlsImpl | null>
}) {
  const goal = useRef({
    pos: new THREE.Vector3(...VISTAS.frente.pos),
    target: new THREE.Vector3(...VISTAS.frente.target),
  })

  useEffect(() => {
    goal.current.pos.set(...VISTAS[vista].pos)
    goal.current.target.set(...VISTAS[vista].target)
  }, [vista])

  useFrame(({ camera }) => {
    camera.position.lerp(goal.current.pos, 0.05)
    const c = controls.current
    if (c) {
      c.target.lerp(goal.current.target, 0.05)
      c.update()
    }
  })
  return null
}

function Hotspot({ id }: { id: string }) {
  const u = POR_ID.get(id)
  if (!u) return null
  const z = u.lado === "frente" ? 3.2 : -3.2
  return (
    <Html
      position={[-3.2, 0.4 + (u.pavimento - 0.5) * PE_DIREITO + 1.2, z]}
      center
      distanceFactor={22}
      zIndexRange={[50, 0]}
    >
      <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs text-white backdrop-blur">
        <span className="font-semibold">{u.id}</span>
        <span className="mx-1.5 opacity-50">·</span>
        {u.tipologia.split("·")[0]}
        <span className="mx-1.5 opacity-50">·</span>
        <span
          className={
            u.status === "disponivel"
              ? "text-emerald-400"
              : u.status === "reservada"
                ? "text-amber-400"
                : "text-red-400"
          }
        >
          {LABEL_STATUS[u.status]}
        </span>
      </div>
    </Html>
  )
}

function Carregando() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center bg-black">
      <p className="text-sm text-white/60">carregando modelo… {Math.round(progress)}%</p>
    </div>
  )
}

export default function Configurador() {
  const [noite, setNoite] = useState(false)
  const [girar, setGirar] = useState(true)
  const [contornar, setContornar] = useState(true)
  const [vista, setVista] = useState<Vista>("frente")
  const [selecionada, setSelecionada] = useState<string | null>("101")
  const [hover, setHover] = useState<string | null>(null)
  const controls = useRef<OrbitControlsImpl | null>(null)

  const disponiveis = UNIDADES.filter((u) => u.status === "disponivel")
  const un = selecionada ? POR_ID.get(selecionada) : null

  const navegar = (dir: 1 | -1) => {
    if (!un) return
    const lista =
      un.status === "disponivel" ? disponiveis : UNIDADES
    const i = lista.findIndex((x) => x.id === un.id)
    const proxima = lista[(i + dir + lista.length) % lista.length]
    setSelecionada(proxima.id)
  }

  const chave = (n: number) => `${n}`.replace(".", ",")

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: VISTAS.frente.pos, fov: 42 }}
        onPointerMissed={() => setSelecionada(null)}
      >
        <color attach="background" args={[noite ? "#070b14" : "#88b3d6"]} />
        <fog attach="fog" args={[noite ? "#070b14" : "#a5c4dc", 45, 120]} />

        {noite ? (
          <Stars radius={80} depth={30} count={1800} factor={3} fade />
        ) : (
          <Sky sunPosition={[30, 12, -18]} turbidity={6} rayleigh={1.4} />
        )}

        <ambientLight intensity={noite ? 0.12 : 0.55} />
        <directionalLight
          position={[18, 22, -10]}
          intensity={noite ? 0.15 : 2.2}
          color={noite ? "#5a70a8" : "#fff2dc"}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* luar / fill */}
        <directionalLight position={[-14, 10, 8]} intensity={noite ? 0.25 : 0.3} color={noite ? "#7d90c9" : "#cfe3ff"} />

        <Cena
          noite={noite}
          contornarDisponiveis={contornar}
          selecionada={selecionada}
          hover={hover}
          onSelect={setSelecionada}
          onHover={setHover}
        />
        {selecionada && <Hotspot id={selecionada} />}

        <CameraRig vista={vista} controls={controls} />
        <OrbitControls
          ref={controls}
          makeDefault
          target={[0, 6, 0]}
          autoRotate={girar}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.08}
          minDistance={10}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2.05}
        />

        {noite && (
          <EffectComposer>
            <Bloom
              intensity={1.1}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.2}
              mipmapBlur
              radius={0.65}
            />
            <Vignette eskil={false} offset={0.25} darkness={0.65} />
          </EffectComposer>
        )}
      </Canvas>

      {/* barra de controles (topo) */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
          <div className="flex rounded-full bg-white/10 p-0.5">
            {(["Dia", "Noite"] as const).map((m) => {
              const ativo = (m === "Noite") === noite
              return (
                <button
                  key={m}
                  onClick={() => setNoite(m === "Noite")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    ativo ? "bg-white/90 text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
          <span className="mx-1 h-4 w-px bg-white/15" />
          {(Object.keys(VISTAS) as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                vista === v ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/15" />
          <button
            onClick={() => setContornar((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/80 hover:text-white"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${contornar ? "bg-emerald-400" : "bg-white/30"}`} />
            Contornar disponíveis
          </button>
          <button
            onClick={() => setGirar((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/80 hover:text-white"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${girar ? "bg-sky-400" : "bg-white/30"}`} />
            Girar
          </button>
        </div>
      </div>

      {/* lista de unidades (esquerda) */}
      <aside className="absolute left-4 top-20 z-10 w-44 overflow-hidden rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md">
        <p className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-widest text-white/40">
          Unidades
        </p>
        <ul className="max-h-[60vh] overflow-y-auto p-1.5">
          {UNIDADES.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => setSelecionada(u.id)}
                onMouseEnter={() => setHover(u.id)}
                onMouseLeave={() => setHover(null)}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                  selecionada === u.id ? "bg-white/90 text-black" : "hover:bg-white/10"
                }`}
              >
                <span className="font-semibold">{u.id}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    u.status === "disponivel"
                      ? "bg-emerald-400"
                      : u.status === "reservada"
                        ? "bg-amber-400"
                        : "bg-red-400/70"
                  }`}
                  title={LABEL_STATUS[u.status]}
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ficha da unidade (direita) */}
      {un && (
        <aside className="absolute right-4 top-20 z-10 w-80 overflow-hidden rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md">
          <div className="border-b border-white/10 px-4 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40">
              Giardino · Final {un.lado === "frente" ? "01" : "02"}
            </p>
            <div className="flex items-baseline gap-2 py-1">
              <span className="text-4xl font-semibold">{un.id}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  un.status === "disponivel"
                    ? "bg-emerald-400/15 text-emerald-300"
                    : un.status === "reservada"
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-red-400/15 text-red-300"
                }`}
              >
                {LABEL_STATUS[un.status]}
              </span>
            </div>
            <p className="pb-2 text-xs italic text-white/60">{un.tipologia}</p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/10 text-center text-xs">
            <div className="bg-black/40 px-2 py-2">
              <p className="text-[9px] uppercase text-white/40">Área priv.</p>
              <p className="font-semibold">{chave(un.areaPrivativa)} m²</p>
            </div>
            <div className="bg-black/40 px-2 py-2">
              <p className="text-[9px] uppercase text-white/40">Pavimento</p>
              <p className="font-semibold">{un.pavimento}º</p>
            </div>
            <div className="bg-black/40 px-2 py-2">
              <p className="text-[9px] uppercase text-white/40">Vaga</p>
              <p className="font-semibold">{un.vaga}</p>
            </div>
          </div>

          <div className="px-4 py-3">
            <p className="text-[9px] uppercase tracking-widest text-white/40">
              Valor de tabela
            </p>
            <p className="text-2xl font-semibold text-white">{brl(un.valorTabela)}</p>
            <p className="text-[10px] text-white/50">
              {brl(un.valorTabela / un.areaPrivativa).replace("R$", "R$")} por m² privativo
            </p>

            <div className="mt-3 space-y-1 text-xs text-white/70">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Entrada</span>
                <span>
                  15% · {brl(un.valorTabela * 0.15)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Durante a obra</span>
                <span>35% · {brl(un.valorTabela * 0.35)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo (chaves)</span>
                <span>50% · {brl(un.valorTabela * 0.5)}</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/40">
              Parcelas durante a obra corrigidas pelo INCC. Saldo financiável
              (SFH) sujeito a aprovação de crédito.
            </p>

            {/* planta esquemática */}
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-2">
              <svg viewBox="0 0 100 62" className="w-full">
                <rect x="4" y="4" width="40" height="54" fill="none" stroke="#ffffff55" />
                <rect x="48" y="4" width="48" height="30" fill="none" stroke="#ffffff55" />
                <rect x="48" y="38" width="48" height="20" fill="none" stroke="#ffffff55" />
                <rect x="8" y="8" width="14" height="18" fill="#ffffff18" />
                <rect x="26" y="8" width="14" height="26" fill="#ffffff18" />
                <text x="24" y="60" fontSize="5" fill="#ffffff66" textAnchor="middle">
                  planta ilustrativa
                </text>
              </svg>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navegar(-1)}
                className="flex-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                ← Disponível anterior
              </button>
              <button
                onClick={() => navegar(1)}
                className="flex-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Próxima disponível →
              </button>
            </div>

            {un.status === "disponivel" && (
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  `Olá! Tenho interesse na unidade ${un.id} (${un.tipologia}, ${chave(un.areaPrivativa)} m²) do Giardino — ${brl(un.valorTabela)}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-full bg-emerald-500 px-4 py-2 text-center text-xs font-semibold text-black hover:bg-emerald-400"
              >
                Tenho interesse — falar no WhatsApp
              </a>
            )}

            <p className="mt-3 text-[9px] leading-relaxed text-white/35">
              Imagens meramente ilustrativas. Mobiliário, acabamentos e
              vegetação não fazem parte do contrato. Valores sujeitos a
              alteração sem aviso prévio.
            </p>
          </div>
        </aside>
      )}

      {/* marca */}
      <p className="absolute bottom-3 right-4 z-10 text-[10px] uppercase tracking-widest text-white/30">
        protótipo · configurador 3D
      </p>
      <Carregando />
    </div>
  )
}
