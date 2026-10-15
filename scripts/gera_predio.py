# Gera predio.glb: torre de 6 pavimentos com modulos instanciados, fitas de
# LED emissivas e vidro PBR. Nomes: unidade_<id> para picking no R3F.
# Uso: blender --background --python scripts/gera_predio.py
import bpy
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "public/modelos/predio.glb"

LARGURA = 9.0
PE_DIREITO = 1.5
PROF_F = 5.2
PROF_T = 4.2
PAVIMENTOS = 6
ALTURA_TERREO = 0.4

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(nome, cor, metallic=0.0, rough=0.8, emissao=None, forca=0.0, alpha=1.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*cor, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    if emissao:
        b.inputs["Emission Color"].default_value = (*emissao, 1.0)
        b.inputs["Emission Strength"].default_value = forca
    return m


VIDRO = mat("vidro", (0.62, 0.72, 0.79), metallic=0.35, rough=0.12, alpha=0.92)
LAJE = mat("laje", (0.91, 0.89, 0.86))
LED = mat("led", (0.06, 0.06, 0.06), emissao=(1.0, 0.9, 0.7), forca=4.0)
NUCLEO = mat("nucleo", (0.81, 0.78, 0.73))
TERREO = mat("terreo", (0.85, 0.82, 0.78))
GUARDA = mat("guarda", (0.96, 0.95, 0.92), metallic=0.2, rough=0.6)


def caixa(nome, dims, pos, material, linked_de=None):
    if linked_de is not None:
        obj = linked_de.copy()  # linked duplicate: mesma mesh, instanciada
        obj.name = nome
    else:
        mesh = bpy.data.meshes.new(nome)
        bpy.ops.object.select_all(action="DESELECT")
        import bmesh
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(nome, mesh)
    obj.scale = dims
    obj.location = pos
    obj.data.materials.clear()
    obj.data.materials.append(material)
    scene.collection.objects.link(obj)
    return obj


# --- modulos de andar: frente (final 01) e fundos (final 02) ---
tipos = {
    "frente": (PROF_F, -2.6, "01"),
    "fundos": (PROF_T, 2.1, "02"),
}

for p in range(1, PAVIMENTOS + 1):
    base = ALTURA_TERREO + (p - 1) * PE_DIREITO
    for lado, (prof, zc, final) in tipos.items():
        pid = f"{p}{final}"
        yj = PE_DIREITO / 2
        # volume de vidro da unidade
        caixa(
            f"unidade_{pid}",
            (LARGURA / 2 - 0.3, PE_DIREITO - 0.25, prof - 0.4),
            (0.0, zc, base + yj),
            VIDRO,
            linked_de=bpy.data.objects.get("unidade_101"),
        )
        # laje do pavimento
        caixa(
            f"laje_{pid}",
            (LARGURA / 2, 0.12, prof),
            (0.0, zc, base + 0.06),
            LAJE,
            linked_de=bpy.data.objects.get("laje_101"),
        )
        # fita de LED na borda externa da laje
        zled = zc + prof / 2 if lado == "frente" else zc - prof / 2
        caixa(
            f"led_{pid}",
            (LARGURA / 2 + 0.04, 0.035, 0.035),
            (0.0, zled, base + 0.12),
            LED,
            linked_de=bpy.data.objects.get("led_101"),
        )
        # guarda-corpo na borda externa
        caixa(
            f"guarda_{pid}",
            (LARGURA / 2, 0.35, 0.08),
            (0.0, zled, base + yj - PE_DIREITO / 2 + 0.3),
            GUARDA,
            linked_de=bpy.data.objects.get("guarda_101"),
        )

# --- nucleo / casa de maquinas ---
caixa("nucleo", (4.0, 1.4, 3.0),
      (0.0, 1.0, ALTURA_TERREO + PAVIMENTOS * PE_DIREITO + 0.7), NUCLEO)

# --- terreo ---
caixa("terreo", (LARGURA, 0.4, PROF_F + PROF_T),
      (0.0, 0.0, 0.2), TERREO)
caixa("piscina", (2.2, 0.1, 1.4),
      (2.6, 3.2, 0.12), mat("agua", (0.18, 0.66, 0.79), rough=0.15, metallic=0.4))

# --- export GLB ---
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_yup=True,
    export_materials="EXPORT",
)
print(f"OK: {OUT}")
