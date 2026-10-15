"use client"

import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useGLTF } from "@react-three/drei"
import { UNIDADES, type Unidade } from "@/data/unidades"

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const COR_EMISSIVO_NOITE = "#ffd9a0"

const COR_CONTORNO: Record<string, string> = {
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

// Carrega o GLB gerado pelo Blender (scripts/gera_predio.py) e liga picking,
// destaque e dia/noite aos objetos nomeados unidade_<id> / led_<id>.
export default function TorreGLB({
  noite,
  contornarDisponiveis,
  selecionada,
  hover,
  onSelect,
  onHover,
}: Props) {
  const { scene } = useGLTF(`${BASE}/modelos/predio.glb`, false)
  const original = useRef<Map<string, { emissive: THREE.Color; intensity: number }>>(new Map())

  // clona materiais por unidade e pelo seu LED (os objetos do GLB compartilham
  // materiais; destaque precisa ser por unidade)
  const { unidades, leds } = useMemo(() => {
    const unidades = new Map<string, THREE.Mesh>()
    const leds = new Map<string, THREE.Mesh>()
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const u = /^unidade_(\d{3})$/.exec(o.name)
      const l = /^led_(\d{3})$/.exec(o.name)
      if (u) {
        o.material = (o.material as THREE.MeshStandardMaterial).clone()
        unidades.set(u[1], o)
      } else if (l) {
        o.material = (o.material as THREE.MeshStandardMaterial).clone()
        leds.set(l[1], o)
      }
    })
    return { unidades, leds }
  }, [scene])

  useEffect(() => {
    return () => {
      const descartar = (mesh: THREE.Mesh) =>
        (mesh.material as THREE.MeshStandardMaterial).dispose()
      unidades.forEach(descartar)
      leds.forEach(descartar)
    }
  }, [unidades, leds])

  useEffect(() => {
    const aplicarVidro = (mesh: THREE.Mesh, id: string) => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!original.current.has(id)) {
        original.current.set(id, {
          emissive: mat.emissive.clone(),
          intensity: mat.emissiveIntensity,
        })
      }
      const u = UNIDADES.find((x) => x.id === id) as Unidade
      const destaque = selecionada === id || hover === id

      if (destaque) {
        mat.emissive.set("#ffffff")
        mat.emissiveIntensity = 0.35
      } else if (noite && u.status !== "vendida") {
        mat.emissive.set(COR_EMISSIVO_NOITE)
        mat.emissiveIntensity = u.status === "disponivel" ? 0.9 : 0.45
      } else {
        const orig = original.current.get(id)!
        mat.emissive.copy(orig.emissive)
        mat.emissiveIntensity = orig.intensity
      }
    }

    const aplicarLed = (mesh: THREE.Mesh, id: string) => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      const u = UNIDADES.find((x) => x.id === id) as Unidade
      const destaque = selecionada === id

      if (destaque) {
        mat.emissive.set("#ffffff")
        mat.emissiveIntensity = 8
      } else if (contornarDisponiveis) {
        mat.emissive.set(COR_CONTORNO[u.status])
        mat.emissiveIntensity = u.status === "vendida" ? 0.8 : 5
      } else {
        mat.emissive.set(COR_EMISSIVO_NOITE)
        mat.emissiveIntensity = noite ? 4 : 0.6
      }
    }

    unidades.forEach(aplicarVidro)
    leds.forEach(aplicarLed)
  }, [unidades, leds, noite, contornarDisponiveis, selecionada, hover])

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        const m = /^unidade_(\d{3})$/.exec(e.object.name)
        if (m) onSelect(m[1])
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        const m = /^unidade_(\d{3})$/.exec(e.object.name)
        if (m) onHover(m[1])
      }}
      onPointerOut={() => onHover(null)}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/modelos/predio.glb`, false)
