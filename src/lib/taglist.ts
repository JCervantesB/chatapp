// Listas de tags por categoría (clave en inglés → etiqueta mostrada en español)
export type TagEntry = { tag: string; label: string }

// Utilidades
const sortEntriesEs = (entries: TagEntry[]): TagEntry[] =>
  [...entries].sort((a, b) => a.label.localeCompare(b.label, 'es'))

const uniqueEntries = (...lists: TagEntry[][]): TagEntry[] => {
  const map = new Map<string, TagEntry>()
  for (const list of lists) {
    for (const e of list) {
      if (!map.has(e.tag)) map.set(e.tag, e)
    }
  }
  return sortEntriesEs(Array.from(map.values()))
}

// Sujeto / conteo / encuadre general
export const TAGS_SUJETO_CONTEO: TagEntry[] = sortEntriesEs([
  { tag: '1girl', label: '1 chica' },
  { tag: '1boy', label: '1 chico' },
  { tag: '1other', label: '1 otro' },
  { tag: 'solo', label: 'solo' },
  { tag: '1girl solo', label: '1 chica sola' },
  { tag: 'close-up', label: 'primer plano' },
  { tag: 'portrait', label: 'retrato' },
  { tag: 'full body', label: 'cuerpo completo' },
  { tag: 'upper body', label: 'medio cuerpo' },
  { tag: 'bust', label: 'busto' },
  { tag: 'duo', label: 'dúo' },
  { tag: '2girls', label: '2 chicas' },
  { tag: '2boys', label: '2 chicos' },
  { tag: 'group', label: 'grupo' },
  { tag: 'multiple girls', label: 'múltiples chicas' },
])

// Apariencia (cabello, ojos, rasgos y partes corporales)
export const TAGS_APARIENCIA: TagEntry[] = sortEntriesEs([
  { tag: 'short hair', label: 'pelo corto' },
  { tag: 'long hair', label: 'pelo largo' },
  { tag: 'blonde hair', label: 'pelo rubio' },
  { tag: 'short blonde hair', label: 'pelo rubio corto' },
  { tag: 'brown hair', label: 'pelo castaño' },
  { tag: 'black hair', label: 'pelo negro' },
  { tag: 'pink hair', label: 'pelo rosa' },
  { tag: 'blue hair', label: 'pelo azul' },
  { tag: 'purple hair', label: 'pelo morado' },
  { tag: 'green hair', label: 'pelo verde' },
  { tag: 'ponytail', label: 'coleta' },
  { tag: 'twin tails', label: 'coletas dobles' },
  { tag: 'braid', label: 'trenza' },
  { tag: 'bangs', label: 'flequillo' },
  { tag: 'ahoge', label: 'ahoge' },
  { tag: 'orange hair', label: 'pelo naranja' },
  { tag: 'white hair', label: 'pelo blanco' },
  { tag: 'undercut', label: 'rapado inferior' },
  { tag: 'hair over one eye', label: 'pelo cubriendo un ojo' },
  { tag: 'hair between eyes', label: 'pelo entre los ojos' },
  { tag: 'disheveled hair', label: 'pelo despeinado' },
  { tag: 'dynamic hair', label: 'pelo dinámico' },
  { tag: 'blue eyes', label: 'ojos azules' },
  { tag: 'green eyes', label: 'ojos verdes' },
  { tag: 'brown eyes', label: 'ojos marrones' },
  { tag: 'red eyes', label: 'ojos rojos' },
  { tag: 'purple eyes', label: 'ojos morados' },
  { tag: 'aqua eyes', label: 'ojos aguamarina' },
  { tag: 'mole under eye', label: 'lunar bajo el ojo' },
  { tag: 'teeth', label: 'dientes' },
  { tag: 'mouth', label: 'boca' },
  { tag: 'navel', label: 'ombligo' },
  { tag: 'small breasts', label: 'pechos pequeños' },
  { tag: 'medium breasts', label: 'pechos medianos' },
  { tag: 'large breasts', label: 'pechos grandes' },
  { tag: 'nipples', label: 'pezones' },
  { tag: 'shiny skin', label: 'piel brillante' },
  { tag: 'mature female', label: 'mujer madura' },
  { tag: '21 yo', label: '21 años' },
  { tag: 'beautiful body', label: 'cuerpo hermoso' },
  { tag: 'hands', label: 'manos' },
])

// Ropa y accesorios (incluye calzado)
export const TAGS_ROPA_Y_ACCESORIOS: TagEntry[] = sortEntriesEs([
  { tag: 'dress', label: 'vestido' },
  { tag: 'skirt', label: 'falda' },
  { tag: 'shirt', label: 'camisa' },
  { tag: 't-shirt', label: 'camiseta' },
  { tag: 'jacket', label: 'chaqueta' },
  { tag: 'hoodie', label: 'sudadera con capucha' },
  { tag: 'sweater', label: 'suéter' },
  { tag: 'stockings', label: 'medias' },
  { tag: 'thighhighs', label: 'medias altas' },
  { tag: 'garter belt', label: 'liguero' },
  { tag: 'gloves', label: 'guantes' },
  { tag: 'scarf', label: 'bufanda' },
  { tag: 'hat', label: 'sombrero' },
  { tag: 'sunglasses', label: 'gafas de sol' },
  { tag: 'earrings', label: 'pendientes' },
  { tag: 'bracelet', label: 'pulsera' },
  { tag: 'ring', label: 'anillo' },
  { tag: 'bow', label: 'lazo' },
  { tag: 'ribbon', label: 'cinta' },
  { tag: 'hairband', label: 'diadema' },
  { tag: 'belt', label: 'cinturón' },
  { tag: 'backpack', label: 'mochila' },
  { tag: 'boots', label: 'botas' },
  { tag: 'high heels', label: 'tacones altos' },
  { tag: 'sneakers', label: 'zapatillas' },
  { tag: 'barefoot', label: 'descalza' },
  { tag: 'cap', label: 'gorra' },
  { tag: 'hood', label: 'capucha' },
  { tag: 'hair ornament', label: 'adorno del cabello' },
  { tag: 'wimple', label: 'toca monacal' },
  { tag: 'wedding veil', label: 'velo de novia' },
  { tag: 'cowboy hat', label: 'sombrero vaquero' },
  { tag: 'brown gloves', label: 'guantes marrones' },
  { tag: 'white panties', label: 'bragas blancas' },
  { tag: 'tassel cowboy boots', label: 'botas vaqueras con borlas' },
  { tag: 'holster', label: 'cartuchera' },
  { tag: 'elbow gloves', label: 'guantes hasta el codo' },
  { tag: 'choker', label: 'collar ajustado' },
  { tag: 'diadem', label: 'diadema' },
  { tag: 'garter straps', label: 'tirantes de liguero' },
  { tag: 'shoes', label: 'zapatos' },
  { tag: 'short red flannel', label: 'camisa de franela roja corta' },
  { tag: 'open flannel', label: 'camisa de franela abierta' },
  { tag: 'adventurer armor', label: 'armadura de aventurera' },
  { tag: 'dissolving clothes', label: 'ropa disolviéndose' },
  { tag: 'no panties', label: 'sin bragas' },
  { tag: 'pelvic curtain', label: 'cortina pélvica' },
  { tag: 'puffy sleeves', label: 'mangas abullonadas' },
  { tag: 'revealing clothes', label: 'ropa reveladora' },
  { tag: 'thigh strap', label: 'correa en el muslo' },
  { tag: 'golden thighlet', label: 'muslera dorada' },
  { tag: 'slingshot dress', label: 'vestido tirachinas' },
  { tag: 'jewelry necklace', label: 'collar de joyería' },
  { tag: 'red long sleeves', label: 'mangas largas rojas' },
  { tag: 'short sleeves', label: 'mangas cortas' },
  { tag: 'mouth mask', label: 'mascarilla' },
  { tag: 'red mouth veil', label: 'velo bucal rojo' },
  { tag: 'suit jacket', label: 'chaqueta de traje' },
  { tag: 'black jacket', label: 'chaqueta negra' },
  { tag: 'white shirt', label: 'camisa blanca' },
  { tag: 'dress shirt', label: 'camisa de vestir' },
  { tag: 'cleavage', label: 'escote' },
  { tag: 'open collar', label: 'cuello abierto' },
  { tag: 'yellow-framed eyewear', label: 'gafas con montura amarilla' },
  { tag: 'rectangular eyewear', label: 'gafas rectangulares' },
])

// Poses y encuadre
export const TAGS_POSES_Y_ENCUADRE: TagEntry[] = sortEntriesEs([
  { tag: 'standing', label: 'de pie' },
  { tag: 'sitting', label: 'sentada' },
  { tag: 'lying', label: 'acostada' },
  { tag: 'kneeling', label: 'arrodillada' },
  { tag: 'leaning forward', label: 'inclinada hacia adelante' },
  { tag: 'arms up', label: 'brazos en alto' },
  { tag: 'hands on hips', label: 'manos en las caderas' },
  { tag: 'crossed arms', label: 'brazos cruzados' },
  { tag: 'from side', label: 'de perfil' },
  { tag: 'from above', label: 'desde arriba' },
  { tag: 'lying on stomach', label: 'boca abajo' },
  { tag: 'lying on side', label: 'de lado' },
  { tag: 'action pose', label: 'pose de acción' },
  { tag: 'sitting on chair', label: 'sentada en una silla' },
])

// Expresiones
export const TAGS_EXPRESIONES: TagEntry[] = sortEntriesEs([
  { tag: 'smile', label: 'sonrisa' },
  { tag: 'blush', label: 'rubor' },
  { tag: 'winking', label: 'guiñando' },
  { tag: 'closed eyes', label: 'ojos cerrados' },
  { tag: 'open mouth', label: 'boca abierta' },
  { tag: 'crying', label: 'llorando' },
  { tag: 'shocked', label: 'sorprendida' },
  { tag: 'moaning', label: 'gimiendo' },
  { tag: 'seductive', label: 'seductora' },
  { tag: 'expression', label: 'expresión' },
])

// Entorno / escenario
export const TAGS_ENTORNO_ESCENARIO: TagEntry[] = sortEntriesEs([
  { tag: 'white background', label: 'fondo blanco' },
  { tag: 'simple background', label: 'fondo simple' },
  { tag: 'gradient background', label: 'fondo degradado' },
  { tag: 'detailed background', label: 'fondo detallado' },
  { tag: 'outdoors', label: 'exterior' },
  { tag: 'indoors', label: 'interior' },
  { tag: 'city', label: 'ciudad' },
  { tag: 'forest', label: 'bosque' },
  { tag: 'beach', label: 'playa' },
  { tag: 'classroom', label: 'aula' },
  { tag: 'bedroom', label: 'dormitorio' },
  { tag: 'office', label: 'oficina' },
  { tag: 'blurry background', label: 'fondo borroso' },
  { tag: 'hay bale', label: 'paca de heno' },
  { tag: 'palace interior', label: 'interior de palacio' },
  { tag: 'purple halo', label: 'aureola morada' },
  { tag: 'submerged', label: 'sumergida' },
  { tag: 'inside gelatinous cube(d&d)', label: 'dentro de cubo gelatinoso (D&D)' },
  { tag: 'slime_(substance)', label: 'baba (sustancia)' },
  { tag: 'dungeon', label: 'mazmorra' },
])

// Iluminación / cámara
export const TAGS_ILUMINACION_CAMARA: TagEntry[] = sortEntriesEs([
  { tag: 'soft lighting', label: 'iluminación suave' },
  { tag: 'hard lighting', label: 'iluminación dura' },
  { tag: 'backlighting', label: 'contraluz' },
  { tag: 'rim lighting', label: 'luz de contorno' },
  { tag: 'warm lighting', label: 'iluminación cálida' },
  { tag: 'cool lighting', label: 'iluminación fría' },
  { tag: 'dramatic lighting', label: 'iluminación dramática' },
  { tag: 'spotlight', label: 'foco' },
  { tag: 'underlighting', label: 'iluminación desde abajo' },
  { tag: 'sunlight', label: 'luz solar' },
  { tag: 'beautiful detailed light', label: 'luz detallada y bonita' },
  { tag: 'cinematic light', label: 'luz cinematográfica' },
  { tag: 'low angle', label: 'ángulo bajo' },
  { tag: 'high angle', label: 'ángulo alto' },
  { tag: 'dutch angle', label: 'ángulo holandés' },
  { tag: 'fisheye', label: 'ojo de pez' },
  { tag: 'pov', label: 'punto de vista' },
  { tag: 'over the shoulder', label: 'sobre el hombro' },
])

// Composición
export const TAGS_COMPOSICION: TagEntry[] = sortEntriesEs([
  { tag: 'centered', label: 'centrado' },
  { tag: 'rule of thirds', label: 'regla de tercios' },
  { tag: 'symmetry', label: 'simetría' },
  { tag: 'bokeh', label: 'bokeh' },
  { tag: 'depth of field', label: 'profundidad de campo' },
  { tag: 'shallow depth of field', label: 'poca profundidad de campo' },
  { tag: 'stunning shot', label: 'toma impresionante' },
])

// Tiempo / clima
export const TAGS_TIEMPO_CLIMA: TagEntry[] = sortEntriesEs([
  { tag: 'day', label: 'día' },
  { tag: 'night', label: 'noche' },
  { tag: 'sunset', label: 'atardecer' },
  { tag: 'sunrise', label: 'amanecer' },
  { tag: 'cloudy', label: 'nublado' },
  { tag: 'rain', label: 'lluvioso' },
  { tag: 'snow', label: 'nevado' },
  { tag: 'wind', label: 'ventoso' },
])

// Estilo / calidad
export const TAGS_ESTILO_CALIDAD: TagEntry[] = sortEntriesEs([
  { tag: 'anime style', label: 'estilo anime' },
  { tag: 'realistic', label: 'estilo realista' },
  { tag: 'watercolor', label: 'acuarela' },
  { tag: 'painterly', label: 'pictórico' },
  { tag: 'sketch', label: 'boceto' },
  { tag: 'lineart', label: 'líneas' },
  { tag: 'monochrome', label: 'monocromo' },
  { tag: 'grayscale', label: 'escala de grises' },
  { tag: 'vibrant colors', label: 'colores vibrantes' },
  { tag: 'pastel colors', label: 'colores pastel' },
  { tag: 'masterpiece', label: 'obra maestra' },
  { tag: 'best quality', label: 'mejor calidad' },
  { tag: 'newest', label: 'lo más nuevo' },
  { tag: 'absurdres', label: 'resolución absurda' },
  { tag: 'highres', label: 'alta resolución' },
  { tag: 'official art style', label: 'estilo arte oficial' },
  { tag: 'hiten style', label: 'estilo hiten' },
])

// Acciones
export const TAGS_ACCIONES: TagEntry[] = sortEntriesEs([
  { tag: 'walking', label: 'caminando' },
  { tag: 'running', label: 'corriendo' },
  { tag: 'jumping', label: 'saltando' },
  { tag: 'dancing', label: 'bailando' },
  { tag: 'reading', label: 'leyendo' },
  { tag: 'holding book', label: 'sosteniendo un libro' },
  { tag: 'drinking', label: 'bebiendo' },
  { tag: 'eating', label: 'comiendo' },
  { tag: 'posing', label: 'posando' },
  { tag: 'waving', label: 'saludando' },
  { tag: 'mounting', label: 'montando' },
  { tag: 'sheet grab', label: 'agarrando la sábana' },
])

// Objetos / ubicación
export const TAGS_OBJETOS_UBICACION: TagEntry[] = sortEntriesEs([
  { tag: 'on desk', label: 'sobre el escritorio' },
  { tag: 'school desk', label: 'pupitre' },
  { tag: 'desk', label: 'escritorio' },
  { tag: 'school chair', label: 'silla escolar' },
  { tag: 'chair', label: 'silla' },
  { tag: 'on sofa', label: 'en el sofá' },
  { tag: 'pillow', label: 'almohada' },
  { tag: 'window', label: 'ventana' },
  { tag: 'windows', label: 'ventanas' },
  { tag: 'curtains', label: 'cortinas' },
  { tag: 'bookshelf', label: 'estantería' },
  { tag: 'vase', label: 'jarrón' },
  { tag: 'flowers', label: 'flores' },
])

// Orientación / mirada
export const TAGS_ORIENTACION_MIRADA: TagEntry[] = sortEntriesEs([
  { tag: 'looking at viewer', label: 'mirando al espectador' },
  { tag: 'looking away', label: 'mirando hacia otro lado' },
  { tag: 'looking up', label: 'mirando hacia arriba' },
  { tag: 'looking down', label: 'mirando hacia abajo' },
  { tag: 'looking ahead', label: 'mirando al frente' },
])

// Efectos / técnicas
export const TAGS_EFECTOS_TECNICAS: TagEntry[] = sortEntriesEs([
  { tag: 'line effects', label: 'efectos de líneas' },
  { tag: 'glow black particles', label: 'brillo de partículas negras' },
  { tag: 'wet', label: 'mojada' },
  { tag: 'sweat', label: 'sudor' },
  { tag: 'soaked', label: 'empapada' },
  { tag: 'soggy', label: 'encharcada' },
  { tag: 'shadow', label: 'sombra' },
])

// NSFW / contenido explícito
export const TAGS_NSFW: TagEntry[] = sortEntriesEs([
  { tag: 'penetration', label: 'penetración' },
  { tag: 'pussy', label: 'vagina' },
  { tag: 'pussy juice', label: 'fluido vaginal' },
  { tag: 'anal beads', label: 'bolas anales' },
  { tag: 'vaginal', label: 'vaginal' },
  { tag: 'vaginal intercourse', label: 'coito vaginal' },
  { tag: 'sex', label: 'sexo' },
  { tag: 'penis', label: 'pene' },
  { tag: 'balls', label: 'testículos' },
  { tag: 'ass focus', label: 'enfoque en trasero' },
  { tag: 'penis in pussy', label: 'pene en vagina' },
  { tag: 'nipple slip', label: 'pezón asomado' },
  { tag: 'nipple', label: 'pezón' },
  { tag: 'bottomless', label: 'sin ropa inferior' },
  { tag: 'adult', label: 'adulto' },
  { tag: 'nude', label: 'desnuda' },
  { tag: 'artistic nude', label: 'desnudo artístico' },
  { tag: 'hand on ass', label: 'mano en el trasero' },
  { tag: 'hands on ass', label: 'manos en el trasero' },
  { tag: 'hand on pussy', label: 'mano en la vagina' },
  { tag: 'hands on pussy', label: 'manos en la vagina' },
  { tag: 'spread ass', label: 'culo abierto' },
  { tag: 'spread pussy', label: 'vagina abierta' },
  { tag: 'cameltoe', label: 'pata de camello' },
  { tag: 'legs together', label: 'piernas juntas' },
  { tag: 'legs separated', label: 'piernas separadas' },
  { tag: 'doggystyle', label: 'estilo perro' },
])

// Alias (variantes con guiones bajos / compatibilidad)
export const TAGS_ALIASES: TagEntry[] = sortEntriesEs([
  { tag: 'light_face', label: 'rostro iluminado' },
  { tag: 'medium_medium_breasts', label: 'pechos medianos' },
  { tag: 'mature_female', label: 'mujer madura' },
  { tag: 'black_jacket', label: 'chaqueta negra' },
  { tag: 'white_shirt', label: 'camisa blanca' },
  { tag: 'dress_shirt', label: 'camisa de vestir' },
  { tag: 'open_collar', label: 'cuello abierto' },
  { tag: 'yellow-framed_eyewear', label: 'gafas con montura amarilla' },
  { tag: 'rectangular_eyewear', label: 'gafas rectangulares' },
  { tag: 'on_desk', label: 'sobre el escritorio' },
  { tag: 'official_art_style', label: 'estilo arte oficial' },
  { tag: 'glow_black_particles', label: 'brillo de partículas negras' },
  { tag: 'cinematic_light', label: 'luz cinematográfica' },
  { tag: 'beautiful_detailed_light', label: 'luz detallada y bonita' },
  { tag: 'open_mouth', label: 'boca abierta' },
  { tag: 'red_eyes', label: 'ojos rojos' },
  { tag: 'hair_between_eyes', label: 'pelo entre los ojos' },
  { tag: 'ass_focus', label: 'enfoque en trasero' },
  { tag: 'penis_in_pussy', label: 'pene en vagina' },
  { tag: 'vaginal_intercourse', label: 'coito vaginal' },
  { tag: 'line_effects', label: 'efectos de líneas' },
  { tag: 'looking_ahead', label: 'mirando al frente' },
  { tag: 'from_behind', label: 'desde atrás' },
  { tag: 'mole_under_eye', label: 'lunar bajo el ojo' },
  { tag: 'suit_jacket', label: 'chaqueta de traje' },
  { tag: 'soaked_pussy_juice', label: 'vagina empapada' },
])

// Listas globales (únicas y ordenadas por etiqueta en español)
export const TAG_ENTRIES: TagEntry[] = uniqueEntries(
  TAGS_SUJETO_CONTEO,
  TAGS_APARIENCIA,
  TAGS_ROPA_Y_ACCESORIOS,
  TAGS_POSES_Y_ENCUADRE,
  TAGS_EXPRESIONES,
  TAGS_ENTORNO_ESCENARIO,
  TAGS_ILUMINACION_CAMARA,
  TAGS_COMPOSICION,
  TAGS_TIEMPO_CLIMA,
  TAGS_ESTILO_CALIDAD,
  TAGS_ACCIONES,
  TAGS_OBJETOS_UBICACION,
  TAGS_ORIENTACION_MIRADA,
  TAGS_EFECTOS_TECNICAS,
  TAGS_NSFW,
  TAGS_ALIASES,
)

export const TAG_LIST: string[] = TAG_ENTRIES.map((e) => e.tag)