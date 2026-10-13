"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { Outlines } from "@react-three/drei"
import { UNIDADES, type Unidade } from "@/data/unidades"

// dimensões do módulo de andar (1 pavimento)
const LARGURA = 9
const PROFUNDIDADE_FRENTE = 5.2
const PROFUNDIDADE_FUNDOS = 4.2
export const PE_DIREITO = 1.5 // altura do módulo (com laje)
const PAVIMENTOS = 6

const COR_VIDRO_DIA = "#9db8c9"
const COR_VIDRO_NOITE = "#0d1420"
const COR_EMISSIVO_NOITE = "#ffd9a0"

const STATUS_COR_CONTORNO: Record<string, string> = {
  disponivel: "#38e08a",
  reservada: "#ffb347",
  vendida: "#ff5c5c",
}

interface Props {
  noite: boolean
  contornarDisponiveis: boolean
  selecionada: string | null
  hover: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

// um módulo de andar = caixa de vidro + laje + sacada + "mobília" (2 blocos)
function ModuloAndar({
  unidade,
  y,
  noite,
  contornar,
  selecionada,
  hover,
  onSelect,
  onHover,
}: {
  unidade: Unidade
  y: number
  noite: boolean
  contornar: boolean
  selecionada: string | null
  hover: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const profundidade =
    unidade.lado === "frente" ? PROFUNDIDADE_FRENTE : PROFUNDIDADE_FUNDOS
  const z = unidade.lado === "frente" ? profundidade / 2 : -profundidade / 2

  const corVidro = noite ? COR_VIDRO_NOITE : COR_VIDRO_DIA
  const aceso = noite && unidade.status !== "vendida"

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: corVidro,
      metalness: 0.35,
      roughness: 0.12,
      envMapIntensity: noite ? 0.4 : 1.2,
    })
    if (aceso) {
      m.emissive = new THREE.Color(COR_EMISSIVO_NOITE)
      m.emissiveIntensity = unidade.status === "disponivel" ? 0.9 : 0.45
    }
    return m
  }, [corVidro, aceso, unidade.status, noite])

  const destacada = selecionada === unidade.id || hover === unidade.id
  const contornoAtivo =
    (contornar && unidade.status === "disponivel") || destacada

  return (
    <group position={[0, y, z]}>
      {/* volume da unidade (vidro) */}
      <mesh
        userData={{ unitId: unidade.id }}
        material={material}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(unidade.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(unidade.id)
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[LARGURA / 2 - 0.3, PE_DIREITO - 0.25, profundidade - 0.4]} />
        {contornoAtivo && (
          <Outlines
            thickness={0.02}
            color={destacada ? "#ffffff" : STATUS_COR_CONTORNO[unidade.status]}
            screenspace
          />
        )}
      </mesh>

      {/* laje */}
      <mesh position={[0, -PE_DIREITO / 2 + 0.06, 0]}>
        <boxGeometry args={[LARGURA / 2, 0.12, profundidade]} />
        <meshStandardMaterial
          color={noite ? "#1a1d22" : "#e8e4dc"}
          roughness={0.9}
        />
      </mesh>

      {/* guarda-corpo da sacada (borda externa da laje) */}
      <mesh
        position={[
          0,
          -PE_DIREITO / 2 + 0.3,
          unidade.lado === "frente" ? profundidade / 2 : -profundidade / 2,
        ]}
      >
        <boxGeometry args={[LARGURA / 2, 0.35, 0.08]} />
        <meshStandardMaterial
          color={noite ? "#22262c" : "#f4f1ea"}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* fita de LED na borda da laje — o efeito que "vende" */}
      <mesh
        position={[
          0,
          -PE_DIREITO / 2 + 0.12,
          unidade.lado === "frente" ? profundidade / 2 : -profundidade / 2,
        ]}
      >
        <boxGeometry args={[LARGURA / 2 + 0.04, 0.035, 0.035]} />
        <meshStandardMaterial
          color="#111"
          emissive={noite ? "#ffe6b3" : "#5c6470"}
          emissiveIntensity={noite ? 6 : 0.8}
          toneMapped={false}
        />
      </mesh>

      {/* mobília "instanciada": vaso + cadeiras (igual em todo andar) */}
      <VasoMobilia noite={noite} />
    </group>
  )
}

// mobília simples que se repete — como no original
function VasoMobilia({ noite }: { noite: boolean }) {
  return (
    <group>
      <mesh position={[-1.4, -PE_DIREITO / 2 + 0.55, 1.6]}>
        <cylinderGeometry args={[0.12, 0.09, 0.3, 12]} />
        <meshStandardMaterial color="#b05c2a" roughness={0.8} />
      </mesh>
      <mesh position={[0.8, -PE_DIREITO / 2 + 0.35, 1.6]}>
        <boxGeometry args={[0.4, 0.35, 0.4]} />
        <meshStandardMaterial color={noite ? "#3a2e22" : "#7a4a2e"} roughness={0.9} />
      </mesh>
    </group>
  )
}

// wrapper para não arrastar import do drei para dentro do memo


function Torre({
  noite,
  contornarDisponiveis: contornar,
  selecionada,
  hover,
  onSelect,
  onHover,
}: Props) {
  const grupos = useMemo(() => {
    const frente = UNIDADES.filter((u) => u.lado === "frente")
    const fundos = UNIDADES.filter((u) => u.lado === "fundos")
    return { frente, fundos }
  }, [])

  const alturaBase = 0.4 // térreo

  return (
    <group>
      {/* núcleo/casa de máquinas no topo */}
      <mesh position={[0, alturaBase + PAVIMENTOS * PE_DIREITO + 0.7, -1]}>
        <boxGeometry args={[4, 1.4, 3]} />
        <meshStandardMaterial
          color={noite ? "#15171b" : "#cfc8ba"}
          roughness={0.9}
        />
      </mesh>

      {grupos.frente.map((u) => (
        <ModuloAndar
          key={u.id}
          unidade={u}
          y={alturaBase + (u.pavimento - 0.5) * PE_DIREITO}
          noite={noite}
          contornar={contornar}
          selecionada={selecionada}
          hover={hover}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      {grupos.fundos.map((u) => (
        <ModuloAndar
          key={u.id}
          unidade={u}
          y={alturaBase + (u.pavimento - 0.5) * PE_DIREITO}
          noite={noite}
          contornar={contornar}
          selecionada={selecionada}
          hover={hover}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}

      {/* térreo: pilotis + lobby + piscina */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[LARGURA, 0.4, PROFUNDIDADE_FRENTE + PROFUNDIDADE_FUNDOS]} />
        <meshStandardMaterial
          color={noite ? "#14161a" : "#d8d2c6"}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[2.6, 0.12, -3.2]}>
        <boxGeometry args={[2.2, 0.1, 1.4]} />
        <meshStandardMaterial
          color="#2fa8c9"
          roughness={0.15}
          metalness={0.4}
          emissive={noite ? "#0d5568" : "#000"}
          emissiveIntensity={noite ? 0.6 : 0}
        />
      </mesh>
    </group>
  )
}

// entorno genérico (asset-pack style): quadras brancas + árvores
function Entorno({ noite }: { noite: boolean }) {
  const casas = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number }[] = []
    let seed = 7
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 34; i++) {
      const ang = rnd() * Math.PI * 2
      const dist = 16 + rnd() * 26
      arr.push({
        pos: [Math.cos(ang) * dist, 0.1, Math.sin(ang) * dist],
        s: 0.7 + rnd() * 0.9,
      })
    }
    return arr
  }, [])

  const corCasa = noite ? "#3d4148" : "#f2efe8"
  const corArvore = noite ? "#16241a" : "#3e6b3a"
  const corChao = noite ? "#0e1310" : "#6f8f56"

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color={corChao} roughness={1} />
      </mesh>
      {casas.map((c, i) => (
        <mesh key={i} position={[c.pos[0], c.pos[1] + c.s * 0.9, c.pos[2]]}>
          <boxGeometry args={[3 * c.s, 1.8 * c.s, 2.4 * c.s]} />
          <meshStandardMaterial color={corCasa} roughness={0.95} />
        </mesh>
      ))}
      {casas.slice(0, 16).map((c, i) => (
        <mesh key={`t${i}`} position={[c.pos[0] + 1.4, 1.1, c.pos[2] + 1.2]}>
          <sphereGeometry args={[0.75, 8, 8]} />
          <meshStandardMaterial color={corArvore} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function Cena({
  noite,
  contornarDisponiveis,
  selecionada,
  hover,
  onSelect,
  onHover,
}: Props) {
  return (
    <group>
      <Torre
        noite={noite}
        contornarDisponiveis={contornarDisponiveis}
        selecionada={selecionada}
        hover={hover}
        onSelect={onSelect}
        onHover={onHover}
      />
      <Entorno noite={noite} />
    </group>
  )
}
