"use client"

import { Suspense, useMemo } from "react"
import TorreGLB from "@/components/TorreGLB"

// altura do módulo de andar — usada pelo hotspot em Configurador.tsx
export const PE_DIREITO = 1.5

interface Props {
  noite: boolean
  contornarDisponiveis: boolean
  selecionada: string | null
  hover: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
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
      <Suspense fallback={null}>
        <TorreGLB
          noite={noite}
          contornarDisponiveis={contornarDisponiveis}
          selecionada={selecionada}
          hover={hover}
          onSelect={onSelect}
          onHover={onHover}
        />
      </Suspense>
      <Entorno noite={noite} />
    </group>
  )
}
