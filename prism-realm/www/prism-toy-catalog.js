// prism-toy-catalog.js — Catálogo oficial de 500 niveles + figuras esculpidas por piezas (Nv. 2, 3 y 4).
// Nivel 1 (pingüino) vive en prism-level1-penguin.js; el nivel 5 usa el pingüino del modelo anterior.
import * as THREE from 'three';
import { createFlushToyScrew, snapScrewsToSurface, L1_SCREW_RADIUS } from './prism-level1-penguin.js';

export const LEVEL_NAMES_500 = [
  "Pingüino Polar", // Nivel 1
  // Zona 1: Fauna y Criaturas Iniciales (2 - 50)
  "Unicornio Prismático", "Zorro Origami", "Tortuga Marina de Caparazón Segmentado", "Camaleón Geométrico",
  "Elefante Acrílico", "Búho Guardián", "Colibrí Esmeralda", "Pulpo Mecánico", "Jirafa Articulada",
  "Cangrejo Pinza-Tornillo", "Oso Polar", "Rinoceronte Blindado", "Tiburón Martillo", "Mantarraya Voladora",
  "Lobo Feroz", "Ciervo con Cornamenta de Cobre", "Erizo de Púas Clavadas", "Koala en Rama", "Rana Flecha Venenosa",
  "Tucán Pico Arcoíris", "Caballo Salvaje", "Medusa Flotante de Cristal", "Tigre de Bengala", "León con Crin de Jade",
  "Panda de Bambú", "Flamenco Rosa", "Canguro Saltador", "Perezoso Prensil", "Castor de Presa",
  "Nutria de Río", "Escarabajo Rinoceronte", "Mantis Religiosa", "Libélula de Vidrio", "Murciélago Nocturno",
  "Gorila Espalda Plateada", "Halcón Peregrino", "Pingüino Real Emperador", "Foca Monje", "Caracol en Espiral Áurea",
  "Cisne Negro", "Flamenco Cristalino", "Lémur de Cola Anillada", "Narval con Cuerno Roscado", "Camello del Desierto",
  "Jaguar Manchado", "Guacamayo Escarlata", "Gecko Translúcido", "Pulpo de Arrecife", "Gran Ballena Azul",
  // Zona 2: Taller Básico y Herramientas (51 - 100)
  "Llave Inglesa Clásica", "Martillo de Forja", "Destornillador Reversible", "Pinza de Presión", "Engranaje Planetario Simple",
  "Polea Tensora de Correa", "Candado de Acero Macizo", "Yunque de Herrero", "Gato Hidráulico Portátil", "Prensa de Banco Giratoria",
  "Remachadora Manual", "Llave Allen Múltiple", "Tornillo de Arquímedes", "Micrómetro Digital", "Calibre Vernier",
  "Nivel de Burbuja Articulado", "Sierra Circular Dentada", "Broca Helicoidal de Tres Cortes", "Rodamiento de Bolas (Rulemán)", "Pistola de Calor Industrial",
  "Soporte Articulado de Motor", "Válvula de Mariposa", "Resorte Helicoidal Comprimido", "Trinquete Reversible", "Grillete de Carga con Pasador",
  "Manija de Presurización", "Manómetro de Aguja", "Candado de Combinación Rotativo", "Llave Stilson para Tuberías", "Bisagra Oculta Blindada",
  "Sistema Piñón y Cremallera", "Eje Cardán Básico", "Abrazadera de Tubo Pesada", "Boquilla Aspersora de Alta Presión", "Pistón Simple de Rebote",
  "Polea Doble de Elevación", "Sensor de Presión Mecánico", "Conector Trifásico Reforzado", "Cortador de Pernos", "Rueda Dentada Doble Escalonada",
  "Cadena de Eslabones Gruesos", "Válvula de Esfera de Paso Total", "Balanza de Resortes Dinamométrica", "Llave Dinamométrica Torquímetro", "Regulador de Flujo Neumático",
  "Polea Cónica Escalonada", "Acoplamiento Flexible de Ejes", "Disco de Freno Ventilado", "Caja de Fusibles de Cuchilla", "Llave de Carraca Mecánica",
  // Zona 3: Motores, Turbinas y Mecánica Pesada (101 - 150)
  "Turbina Pelton Hidráulica", "Turbina Eólica de Tres Aspas", "Turbocompresor de Admisión", "Motor Monocilíndrico de Dos Tiempos", "Motor V-Twin Custom",
  "Motor Bóxer de 4 Cilindros", "Bloque de Motor V6", "Cigüeñal Forjado con Bielas", "Culata de Cilindros Multiválvula", "Árbol de Levas Doble (DOHC)",
  "Turbina Aeronáutica Turbofan", "Compresor de Doble Pistón", "Carburador de Doble Boca", "Intercooler de Láminas", "Colector de Escape Deportivo",
  "Diferencial Autoblocante", "Caja de Cambios Secuencial", "Turbina Francis de Presa", "Rotor de Turbina a Gas", "Bomba Centrífuga de Agua",
  "Bomba de Inyección Diésel", "Generador Eléctrico Portátil", "Motor Radial Aeronáutico de 9 Cilindros", "Alternador de Alta Capacidad", "Motor Wankel Rotativo",
  "Turbocompresor Twin-Scroll", "Volante de Inercia Dentado", "Corona de Transmisión Final", "Conjunto de Embrague Cerámico", "Motor Eléctrico Brushless",
  "Servomotor Industrial de Posición", "Bomba Hidráulica de Paletas", "Actuador Lineal Neumático", "Turbina Kaplan de Paso Variable", "Hélice Marina Cuatripala",
  "Motor V8 Supercargado", "Soplador Roots Tipo Blower", "Enfriador de Aceite Tubular", "Distribuidor de Encendido Mecánico", "Válvula Wastegate de Descarga",
  "Válvula Blow-Off Atmosférica", "Amortiguador Coilover de Competición", "Barra Estabilizadora Rígida", "Pinza de Freno Monobloque de 6 Pistones", "Plato Magnético de Encendido",
  "Bomba Peristáltica de Laboratorio", "Turbina Tesla de Discos Paralelos", "Reductor Planetario Epicicloidal", "Motor Stirling Térmico", "Bloque Motor V12 Monolítico",
  // Zona 4: Vehículos, Transporte y Navegación (151 - 200)
  "Bicicleta Urbana Fixie", "Monopatín Urbano Clásico", "Vespa Clásica Italiana", "Cuatrimoto Todo Terreno (ATV)", "Buggy Arenero Tubular",
  "Karting de Competición", "Camión Monstruo (Monster Truck)", "Tractor Agrícola con Orugas", "Excavadora Hidráulica de Brazo Articulado", "Grúa Torre de Construcción",
  "Aplanadora de Asfalto", "Montacargas Eléctrico de Almacén", "Camión Cisterna Blindado", "Camión Volquete Minero Gigante", "Locomotora de Vapor Clásica",
  "Vagón Carbonero Remachado", "Tren Bala Aerodinámico", "Tranvía Histórico de Cable", "Barco Pesquero de Arrastre", "Velero Bergantín con Mástiles",
  "Yate de Recreo Rápido", "Lancha Hidroala (Hydrofoil)", "Remolcador de Puerto", "Rompehielos Ártico", "Submarino de Exploración Abisal",
  "Batiscafo de Esferas Conectadas", "Globo Aerostático con Canastilla", "Dirigible Zeppelin Rígido", "Biplano Histórico Wright Flyer", "Caza Spitfire de la Segunda Guerra",
  "Avión Comercial Bimotor", "Helicóptero de Rescate con Rotor Coaxial", "Dron Cuadricóptero de Carreras", "Ala Delta Ultraliviana", "Aerodeslizador Hovercraft",
  "Cohete Espacial de Fases Desechables", "Transbordador Espacial Alado", "Módulo de Alunizaje Lunar", "Rover Marciano de Seis Ruedas", "Sonda Espacial con Paneles Desplegables",
  "Ciclomotor Cafe Racer", "Sidecar Militar Clásico", "Tanque de Asalto Blindado", "Vehículo Anfibio Todo Terreno", "Limusina Presidencial Reforzada",
  "Automóvil Clásico Muscle Car", "Monoplaza de F1 con Efecto Suelo", "Quitanieves de Rotor Giratorio", "Teleférico de Montaña Suspendido", "Portaaviones Nuclear en Miniatura",
  // Zona 5: Fantasía Mística y Criaturas Legendarias (201 - 250)
  "Pegaso de Alas Plateadas", "Dragón de Fuego Escamoso", "Wyvern con Colmillos de Cristal", "Fénix de Plumas de Ámbar", "Grifo Guardián de Nido",
  "Hipogrifo de Pecho Blindado", "Basilisco con Ojos Petrificantes", "Quimera de Tres Cabezas", "Cerbero Guardián del Inframundo", "Hidra Venenosa de Cinco Cuellos",
  "Golem de Piedra y Musgo", "Golem de Cristal Rúnico", "Ent Árbol Anciano Guardián", "Minotauro con Hacha Labrys", "Centauro Arquero",
  "Sátiro con Flauta de Pan", "Esfinge Alada de Giza", "Kraken de Tentáculos Enroscados", "Leviatán de las Profundidades", "Sirena con Cola Escamada",
  "Tritón con Tridente de Coral", "Serpiente Alada Quetzalcóatl", "Thunderbird Pájaro del Trueno", "Wendigo con Astas Heladas", "Mantícora con Cola de Escorpión",
  "Djinn de la Lámpara Mágica", "Gárgola Alada de Catedral", "Unicornio Oscuro de Obsidiana", "Valkiria Alada con Escudo", "Cuervo Rúnico de Odín",
  "Zorro Kitsune de Nueve Colas", "Kirin Ciervo Celestial", "Dragón Oriental Long de Jade", "Genbu (Tortuga y Serpiente Negra)", "Byakko (Tigre Blanco Protector)",
  "Zhuque (Ave Bermellón de Fuego)", "Seiryu (Dragón Azul del Viento)", "Chupacabras de Espinas Dorsales", "Yeti Abominable de las Nieves", "Mapinguari de la Selva",
  "Mothman (Hombre Polilla)", "Sleipnir Caballo de Ocho Patas", "Serpiente Ouroboros Infinita", "Bégimo Bestia Terrenal", "Anubis Chacal de Oro",
  "Horus Halcón Solar", "Garuda Ave Mística", "Asura de Seis Brazos y Armas", "Rey Mono Sun Wukong", "Fénix Renacido de Prisma Espejado",
  // Zona 6: Relojería, Autómatas y Steampunk (251 - 300)
  "Reloj de Bolsillo Antiguo con Tapa Grabada", "Reloj Cucú de la Selva Negra", "Péndulo de Torsión Atmosférico", "Escape de Áncora de Precisión", "Mecanismo Tourbillon Giratorio",
  "Barómetro Aneroide de Fuelle", "Astrolabio Esférico de Navegante", "Esfera Armilar Geocéntrica", "Telégrafo Morse de Cobre", "Fonógrafo de Manivela y Bocina Cónica",
  "Gramófono de Disco de Cera", "Proyector de Cine Manual de Manivela", "Caja Musical de Cilindro con Púas", "Autómata Pájaro Cantor en Jaula Dorada", "Autómata Jugador de Ajedrez",
  "Escritor Mecánico de Autómata", "Caleidoscopio de Prismas Ópticos", "Sextante Náutico de Latón", "Compás Magnético en Suspensión Cardán", "Máquina Enigma con Rotores Cifradores",
  "Linterna Mágica de Proyección", "Teodolito Topográfico de Precisión", "Tubo de Rayos Catódicos de Crookes", "Bobina de Tesla con Descargador de Arco", "Máquina Electrostática de Wimshurst",
  "Telar Jacquard con Tarjetas Perforadas", "Calculadora Mecánica Curta", "Monóculo Mecánico con Lentes Abatibles", "Brazo Mecánico Steampunk con Pistones", "Sombrero de Copa con Gafas Mecánicas",
  "Pistola de Chispa Flintlock Remachada", "Rifle de Palanca de Alimentación Tubular", "Cañón Giratorio Gatling de Manivela", "Máquina Diferencial de Babbage", "Giroscopio de Precisión Suspendido",
  "Caja Fuerte con Combinación Triple", "Escafandra de Buceo Clásica de Cobre", "Mascarilla Antigás Victoriana", "Araña Mecánica de Latón y Pernos", "Pájaro Autómata de Cuerda",
  "Mariposa Metálica de Alas Filigrana", "Escarabajo Dorado de Ruedas Dentadas", "Globo Terráqueo Mecánico Desplegable", "Máquina de Tatuar Mecánica de Bobinas", "Horno de Fundición Miniatura",
  "Caldera Vertical con Válvula de Alivio", "Rueda Hidráulica de Cangilones", "Molino de Viento con Aspas Articuladas", "Prensa de Imprenta de Tipos Móviles", "Péndulo Caótico Doble de Acero",
  // Zona 7: Armamento Histórico, Reliquias y Escudos (301 - 350)
  "Casco Espartano Corintio", "Escudo Aspis Griego", "Espada Gladius Romana", "Yelmo de Cruzado con Ranura en Cruz", "Escudo Templario Triangular",
  "Mandoble Teutónico de Dos Manos", "Cota de Malla Remachada", "Peto de Acero de Justa Medieval", "Guantelete Articulado de Dedos de Chapa", "Grebas de Espinilla Decoradas",
  "Yelmo Caballero Negro con Visera Puntiaguda", "Alabarda Suiza con Gancho de Derribo", "Lucero del Alba (Maza de Púas)", "Mangual de Bola y Cadena", "Martillo de Guerra con Pico de Cuervo",
  "Espada Ropera (Rapier) con Cazoleta Barroca", "Katana Japonesa con Tsuba Roscada", "Kabuto Samurái con Cuernos Crestados", "Máscara Menpo Demoníaca", "Shuriken Estrella Ninja Dentada",
  "Kusarigama (Hoz con Cadena y Lastre)", "Arco Recurvo con Poleas Asimétricas", "Ballesta de Repetición Chu-ko-nu", "Ballesta Medieval con Estribo de Carga", "Catapulta Onagro de Torsión",
  "Trabuquete de Contrapeso Basculante", "Ariete de Asedio con Cabeza de Hierro", "Torre de Asedio con Pasarela Abatible", "Balista Gigante Lanzaperno", "Escudo Vikingo Redondo con Umbo Central",
  "Hacha Danesa de Doble Filo", "Yelmo Nórdico con Antifaz", "Daga Estilete de Misericordia", "Cimitarra Persa de Hoja Curva", "Khopesh Espada Hoz Egipcia",
  "Máscara Funeraria Faraónica", "Ojo de Horus Mecánico de Oro", "Corona Imperial de Filigrana y Joyas", "Cetro Real con Orbe Cruzado", "Trono de Espadas Entrelazadas",
  "Cáliz de la Última Cena Enchapado", "Cofre del Tesoro con Cerrojo Secreto", "Sarcófago Faraónico de Tres Capas", "Cruz Templaria con Gemas Talladas", "Campana de Catedral con Badajo",
  "Anillo de Sello Dinástico Roscado", "Códice Medieval con Broches de Bronce", "Atril de Biblioteca Monástica", "Incensario Botafumeiro Suspendido", "Portal de Castillo con Rastrillo Levadizo",
  // Zona 8: Cyberpunk, Robótica y Androides (351 - 400)
  "Cabeza de Androide Sintético con Sensores Ópticos", "Brazo Biónico con Dedos Neumáticos", "Mano Robótica de Fibra de Carbono", "Pierna Ortopédica Deportiva Hidráulica", "Implante Ocular Cyberpunk con Zoom Óptico",
  "Exoesqueleto de Columna Vertebral Lumbar", "Casco Táctico Holográfico", "Máscara Cibernética Respiradora Neón", "Dron de Reconocimiento Hexacóptero", "Perro Robot Cuadrúpedo de Patrulla",
  "Araña Exploradora Hexápoda de Ductos", "Torretas Automatizadas de Disparo Rápido", "Cañón Electromagnético Railgun", "Rifle Láser con Enfriamiento Líquido", "Espada de Plasma con Guarda Magnética",
  "Pistola Smartgun con Rastreador Digital", "Guante de Realidad Virtual Háptico", "Cyberdeck Consola Portátil de Hackeo", "Unidad de Almacenamiento Neural Cuántica", "Procesador Biocibernético Cuántico",
  "Placa Madre Futurista con Zócalos Iluminados", "Cristal de Memoria Holográfica", "Enrutador de Fibra Óptica Cuántica", "Batería de Grafeno de Celda Rígida", "Reactor de Fusión Fría Compacto",
  "Chip Subcutáneo de Acceso Cifrado", "Válvula de Contención de Nanoenjambre", "Corazón Artificial con Válvulas Magnéticas", "Pulmón Sintético de Nanofiltración", "Exoesqueleto de Piernas Titán",
  "Mecha Bípedo Ligero de Reconocimiento", "Mecha Blindado de Asalto Pesado", "Cabina de Mecha con Pantallas Envolventes", "Jetpack Propulsor Dorsal Doble", "Motocicleta Cyberpunk sin Buje Central",
  "Patineta Flotante Hoverboard de Inducción", "Automóvil Volador con Cuatro Turbinas Inclinables", "Dron de Aletas Plegables", "Satélite Orbital Espía Desplegable", "Antena Parabólica de Enlace Satelital",
  "Cámara de Seguridad de Tres Ejes Robotizada", "Terminal Criptográfico Blindado", "Puerta de Seguridad Neumática Presurizada", "Contenedor Criogénico Portátil", "Cápsula de Hibernación Humana",
  "Traje Espacial EVA de Alta Movilidad", "Casco Espacial con Visor Dorado Antirradiación", "Cañón de Iones de Haz Pulsado", "Escudo Deflector Cinético Hexagonal", "Droide Mayordomo Vintage Refactorizado",
  // Zona 9: Instrumentos, Arquitectura y Artefactos (401 - 450)
  "Guitarra Eléctrica Flying V", "Guitarra Acústica de Maderas Nobles", "Violín Stradivarius con Alma y Puente", "Violonchelo con Pica Ajustable", "Contrabajo Acústico de 4 Cuerdas",
  "Piano de Cola con Teclado Desmontable", "Arpa Celta de 36 Cuerdas", "Batería Acústica con Bombos y Platillos", "Saxofón Alto de Llaves Doradas", "Trompeta de Tres Pistones Giratorios",
  "Trombón de Varas Telescópicas", "Tuba de Pabellón Ancho", "Clarinete de Ébano y Llaves Plateadas", "Flauta Traversa Metálica", "Acordeón de Botones y Fuelle Plegable",
  "Sintetizador Modular Analógico de Cables Patch", "Mesa de DJ con Giradiscos y Crossfader", "Micrófono de Cinta Clásico de Estudio", "Amplificador de Tubos de Vacío (Válvulas)", "Altavoz de Bocina Exponencial",
  "Partenón Griego de Columnas Dóricas", "Coliseo Romano de Arcos Superpuestos", "Pirámide Escalonada de Chichén Itzá", "Pagoda Japonesa de Cinco Niveles", "Torre Eiffel con Entramado de Remaches",
  "Big Ben con Esfera de Reloj Desmontable", "Puente de la Torre de Londres Levadizo", "Puente Golden Gate con Cables Tensores", "Molino de Agua con Compuerta Deslizante", "Faro Marítimo con Lente Fresnel",
  "Catedral Gótica con Rosetón de Vitrales", "Arco del Triunfo con Relieves Esculpidos", "Taj Mahal con Cúpula y Minaretes", "Puerta de Brandeburgo con Cuadriga Superior", "Reloj Astronómico de Praga con Figuras Móviles",
  "Telescopio Refractor Astronómico con Trípode", "Microscopio Óptico Compuesto de Revólver", "Giroscopio Láser de Anillo Óptico", "Balanza Analítica de Dos Platillos", "Tubo de Torricelli Barométrico de Vidrio",
  "Destilador Alambique de Cobre", "Molécula de Buckyball (Fullereno C60)", "Cadena de ADN en Doble Hélice Mecanizada", "Cristal de Bismuto de Estructura Escalonada", "Geoda de Amatista Partida en Dos",
  "Prisma Triangular Dispersor de Luz de Newton", "Calavera de Cristal Precolombina", "Busto de Mármol del Emperador Romano", "Cabeza Moái de la Isla de Pascua", "Disco Celeste de Nebra con Oro Incrustado",
  // Zona 10: Monumentos Cósmicos y Reliquias Supremas del Prisma (451 - 500)
  "Estación Orbital Esférica con Superláser", "Estación Espacial Internacional con Paneles Modulares", "Telescopio Espacial James Webb con Espejos Hexagonales", "Sonda Voyager con Disco de Oro Roscado", "Generador Termoeléctrico de Radioisótopos (RTG)",
  "Anillo Orbital Planetario en Secciones", "Enjambre de Dyson Parcialmente Ensamblado", "Motor Warp de Curvatura Espacio-Temporal", "Portal Estelar (Stargate) con Anillo Giratorio de Glifos", "Monolito Negro Marciano",
  "Obelisco Rúnico con Inscripciones Luminosas", "Cubo de Metatrón Tridimensional", "Merkaba Poliedro Sagrado de Ocho Vértices", "Icosaedro Roscado de 20 Caras Convexas", "Dodecaedro Pentagonal Ensamblado",
  "Hipercubo Teseracto Cuatridimensional Desplegado", "Toroide de Revolución con Enrejado Helicoidal", "Cilindro Espacial de O'Neill", "Ascensor Espacial con Contrapeso de Asteroide", "Mina Espacial Flotante de Picos Magnéticos",
  "Generador de Gravedad Artificial", "Lente Gravitacional de Anillo Lumínico", "Cámara de Confinamiento Magnético Tokamak", "Cámara de Ignición por Láseres NIF", "Generador Antimateria con Trampa de Penning",
  "Púlsar Magnetar con Radiación Bipolar", "Agujero Negro con Disco de Acreción Segmentado", "Quásar Energético con Chorros Relativistas", "Reloj Atómico de Iones Atrapados", "Brújula del Multiverso de Anillos Concéntricos",
  "Corona Cósmica con Gemas de Taquiones", "Guantelete Rúnico con Engastes Gemelos", "Espada Legendaria Excalibur en la Roca de Obsidiana", "Martillo Mjolnir con Nudos Nórdicos Remachados", "Lanza de Longinos de Puntas Entrelazadas",
  "Arco de Luz de Artemisa", "Tridente de Poseidón Ondulado con Espirales", "Yelmo de Hades de la Oscuridad", "Huevo Cósmico de la Creación (Brahmanda)", "Árbol Yggdrasil con los Nueve Reinos",
  "Llave del Vacío con Dientes Dimensionales", "Reloj del Juicio Final (Doomsday Clock)", "Crisol Criogénico de Cero Absoluto", "Fénix Primordial de Luz Pura", "Dragón Ouroboros Cósmico del Tiempo",
  "Titán de Hierro Colosal en Reposo", "Deidad Autómata de Cien Brazos", "Corona del Monarca Prismático", "Trono Cósmico del Vacío", "El Núcleo de la Singularidad Prismática (Prism Realm Core)"
];

export function getLevelOfficialTitle(levelNumber) {
  return LEVEL_NAMES_500[(levelNumber - 1) % LEVEL_NAMES_500.length] || `Reliquia Prismática #${levelNumber}`;
}

const matCache = new Map();

export function getToyMaterial(hex, roughness = 0.46, metalness = 0.03) {
  const key = `${hex}_${roughness}_${metalness}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color: hex,
      roughness: roughness,
      metalness: metalness
    }));
  }
  return matCache.get(key);
}

export function createBeveledBlock(pts, depth, hex, bevel = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i][0], pts[i][1]);
  }
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel
  });
  geom.center();
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, getToyMaterial(hex));
}

export function createSolidHalfOvoid(rx, ry, rz, sideSign, frontSign, hex) {
  const geom = new THREE.SphereGeometry(1, 26, 20);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (sideSign !== 0) {
      if (Math.sign(v.x) !== sideSign) v.x *= 0.06;
      else v.x = sideSign * (0.02 + Math.abs(v.x) * 0.98);
    }
    if (frontSign !== 0) {
      if (Math.sign(v.z) !== frontSign) v.z *= 0.08;
      else v.z = frontSign * (0.02 + Math.abs(v.z) * 0.98);
    }
    v.set(v.x * rx, v.y * ry, v.z * rz);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, getToyMaterial(hex));
}

export function createCuteEyesGroup(eyeDistX, yOff, zOff, irisHex = 0x0284c7) {
  const g = new THREE.Group();
  [-eyeDistX, eyeDistX].forEach(xPos => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), getToyMaterial(0xffffff, 0.2));
    sclera.scale.set(0.95, 1.12, 0.42);
    sclera.position.set(xPos, yOff, zOff);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), getToyMaterial(irisHex, 0.2));
    iris.scale.set(1, 1.08, 0.42);
    iris.position.set(xPos * 0.94, yOff - 0.01, zOff + 0.05);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), getToyMaterial(0x0f172a, 0.1));
    pupil.scale.set(1, 1.08, 0.42);
    pupil.position.set(xPos * 0.94, yOff - 0.01, zOff + 0.08);

    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(xPos * 0.94 - 0.03, yOff + 0.04, zOff + 0.11);

    g.add(sclera, iris, pupil, shine);
  });
  return g;
}

// ============================================================================
// NIVEL 2: UNICORNIO PRISMÁTICO (63 Tornillos / 21 Piezas Macizas)
// ============================================================================
export function getUnicornToyBlueprint() {
  const rect = (w, h) => [[-w, -h], [w, -h], [w, h], [-w, h]];
  return [
    {
      id: 'uni_horn', name: 'Cuerno Dorado Roscado', blockedBy: [],
      buildMesh: () => new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.95, 20), getToyMaterial(0xfacc15, 0.25, 0.2)),
      pos: [0, 1.72, 0.72], rot: [0.42, 0, 0],
      mounts: [
        { pos: [0, 1.85, 0.88], normal: [0, 0.45, 0.89] },
        { pos: [-0.18, 1.55, 0.68], normal: [-0.85, 0.2, 0.45] },
        { pos: [0.18, 1.55, 0.68], normal: [0.85, 0.2, 0.45] }
      ]
    },
    {
      id: 'uni_snout', name: 'Hocico Rosado', blockedBy: [],
      buildMesh: () => createSolidHalfOvoid(0.54, 0.42, 0.48, 0, 1, 0xff85a1),
      pos: [0, 0.78, 1.12], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.22, 0.82, 1.52], normal: [-0.3, 0.15, 0.94] },
        { pos: [0.22, 0.82, 1.52], normal: [0.3, 0.15, 0.94] },
        { pos: [0, 0.62, 1.48], normal: [0, -0.35, 0.93] }
      ]
    },
    {
      id: 'uni_head', name: 'Cabeza de Unicornio', blockedBy: ['uni_snout', 'uni_horn'],
      buildMesh: () => {
        const g = new THREE.Group();
        g.add(createSolidHalfOvoid(0.76, 0.72, 0.82, 0, 0, 0xf8fafc));
        g.add(createCuteEyesGroup(0.32, 0.12, 0.72, 0x9333ea));
        return g;
      },
      pos: [0, 0.98, 0.48], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.68, 1.05, 0.65], normal: [-0.88, 0.2, 0.42] },
        { pos: [0.68, 1.05, 0.65], normal: [0.88, 0.2, 0.42] },
        { pos: [0, 1.38, 0.88], normal: [0, 0.65, 0.75] }
      ]
    },
    {
      id: 'uni_mane_top', name: 'Crin Arcoíris Rosa', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.18, -0.35], [0.18, -0.35], [0.24, 0.35], [-0.24, 0.35]], 0.45, 0xff2a85, 0.09),
      pos: [0, 1.42, -0.12], rot: [-0.3, 0, 0],
      mounts: [
        { pos: [-0.26, 1.48, -0.05], normal: [-1, 0, 0] },
        { pos: [0.26, 1.48, -0.05], normal: [1, 0, 0] },
        { pos: [0, 1.68, -0.25], normal: [0, 0.7, -0.7] }
      ]
    },
    {
      id: 'uni_mane_mid', name: 'Crin Arcoíris Celeste', blockedBy: ['uni_mane_top'],
      buildMesh: () => createBeveledBlock([[-0.18, -0.38], [0.18, -0.38], [0.24, 0.38], [-0.24, 0.38]], 0.45, 0x00b4d8, 0.09),
      pos: [0, 0.82, -0.36], rot: [-0.15, 0, 0],
      mounts: [
        { pos: [-0.26, 0.85, -0.32], normal: [-1, 0, 0] },
        { pos: [0.26, 0.85, -0.32], normal: [1, 0, 0] },
        { pos: [0, 0.85, -0.68], normal: [0, 0.1, -0.99] }
      ]
    },
    {
      id: 'uni_body_left', name: 'Torso Blanco Izq', blockedBy: [],
      buildMesh: () => createSolidHalfOvoid(0.88, 0.82, 1.25, -1, 0, 0xffffff),
      pos: [-0.02, -0.18, 0], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.82, -0.05, 0.45], normal: [-0.92, 0.1, 0.38] },
        { pos: [-0.82, -0.25, -0.45], normal: [-0.92, -0.1, -0.38] },
        { pos: [-0.38, 0.12, 1.05], normal: [-0.35, 0.2, 0.91] }
      ]
    },
    {
      id: 'uni_body_right', name: 'Torso Blanco Der', blockedBy: [],
      buildMesh: () => createSolidHalfOvoid(0.88, 0.82, 1.25, 1, 0, 0xffffff),
      pos: [0.02, -0.18, 0], rot: [0, 0, 0],
      mounts: [
        { pos: [0.82, -0.05, 0.45], normal: [0.92, 0.1, 0.38] },
        { pos: [0.82, -0.25, -0.45], normal: [0.92, -0.1, -0.38] },
        { pos: [0.38, 0.12, 1.05], normal: [0.35, 0.2, 0.91] }
      ]
    },
    {
      id: 'uni_wing_left', name: 'Ala Celestial Izq', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.15, -0.45], [0.15, -0.45], [0.28, 0.45], [-0.22, 0.45]], 0.55, 0xc084fc, 0.08),
      pos: [-1.02, 0.12, -0.05], rot: [0.2, 0, 0.35],
      mounts: [
        { pos: [-1.22, 0.28, 0.12], normal: [-0.9, 0.35, 0.2] },
        { pos: [-1.22, -0.08, -0.18], normal: [-0.9, -0.2, -0.3] },
        { pos: [-1.05, 0.45, -0.05], normal: [-0.5, 0.85, 0] }
      ]
    },
    {
      id: 'uni_wing_right', name: 'Ala Celestial Der', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.15, -0.45], [0.15, -0.45], [0.22, 0.45], [-0.28, 0.45]], 0.55, 0xc084fc, 0.08),
      pos: [1.02, 0.12, -0.05], rot: [0.2, 0, -0.35],
      mounts: [
        { pos: [1.22, 0.28, 0.12], normal: [0.9, 0.35, 0.2] },
        { pos: [1.22, -0.08, -0.18], normal: [0.9, -0.2, -0.3] },
        { pos: [1.05, 0.45, -0.05], normal: [0.5, 0.85, 0] }
      ]
    },
    {
      id: 'uni_tail', name: 'Cola Arcoíris', blockedBy: ['uni_body_left', 'uni_body_right'],
      buildMesh: () => new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.65, 14, 18), getToyMaterial(0xff2a85)),
      pos: [0, -0.22, -1.35], rot: [-0.55, 0, 0],
      mounts: [
        { pos: [0, -0.05, -1.68], normal: [0, 0.3, -0.95] },
        { pos: [-0.28, -0.28, -1.52], normal: [-0.8, -0.2, -0.5] },
        { pos: [0.28, -0.28, -1.52], normal: [0.8, -0.2, -0.5] }
      ]
    },
    {
      id: 'uni_leg_fl', name: 'Pata Delantera Izq', blockedBy: ['uni_body_left'],
      buildMesh: () => new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.82, 18), getToyMaterial(0xfacc15)),
      pos: [-0.46, -1.05, 0.58], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.46, -1.05, 0.86], normal: [0, 0, 1] },
        { pos: [-0.74, -1.05, 0.58], normal: [-1, 0, 0] },
        { pos: [-0.46, -1.32, 0.82], normal: [0, -0.3, 0.95] }
      ]
    },
    {
      id: 'uni_leg_fr', name: 'Pata Delantera Der', blockedBy: ['uni_body_right'],
      buildMesh: () => new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.82, 18), getToyMaterial(0xfacc15)),
      pos: [0.46, -1.05, 0.58], rot: [0, 0, 0],
      mounts: [
        { pos: [0.46, -1.05, 0.86], normal: [0, 0, 1] },
        { pos: [0.74, -1.05, 0.58], normal: [1, 0, 0] },
        { pos: [0.46, -1.32, 0.82], normal: [0, -0.3, 0.95] }
      ]
    },
    {
      id: 'uni_leg_bl', name: 'Pata Trasera Izq', blockedBy: ['uni_body_left'],
      buildMesh: () => new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.82, 18), getToyMaterial(0xfacc15)),
      pos: [-0.46, -1.05, -0.58], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.74, -1.05, -0.58], normal: [-1, 0, 0] },
        { pos: [-0.46, -1.05, -0.86], normal: [0, 0, -1] },
        { pos: [-0.46, -1.32, -0.82], normal: [0, -0.3, -0.95] }
      ]
    },
    {
      id: 'uni_leg_br', name: 'Pata Trasera Der', blockedBy: ['uni_body_right'],
      buildMesh: () => new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.82, 18), getToyMaterial(0xfacc15)),
      pos: [0.46, -1.05, -0.58], rot: [0, 0, 0],
      mounts: [
        { pos: [0.74, -1.05, -0.58], normal: [1, 0, 0] },
        { pos: [0.46, -1.05, -0.86], normal: [0, 0, -1] },
        { pos: [0.46, -1.32, -0.82], normal: [0, -0.3, -0.95] }
      ]
    },
    ...[-1.15, 0, 1.15].map((xVal, idx) => ({
      id: `uni_cloud_front_${idx}`, name: `Nube Frontal ${idx + 1}`, blockedBy: idx === 1 ? ['uni_leg_fl', 'uni_leg_fr'] : [],
      buildMesh: () => createBeveledBlock(rect(0.45, 0.38), 0.34, idx === 1 ? 0x38bdf8 : 0x7dd3fc, 0.10),
      pos: [xVal, -1.62, 0.85], rot: [Math.PI / 2, 0, 0],
      mounts: [
        { pos: [xVal - 0.22, -1.34, 0.85], normal: [0, 1, 0] },
        { pos: [xVal + 0.22, -1.34, 0.85], normal: [0, 1, 0] },
        { pos: [xVal, -1.62, 1.32], normal: [0, 0, 1] }
      ]
    })),
    ...[-1.15, 0, 1.15].map((xVal, idx) => ({
      id: `uni_cloud_back_${idx}`, name: `Nube Trasera ${idx + 1}`, blockedBy: idx === 1 ? ['uni_leg_bl', 'uni_leg_br'] : [],
      buildMesh: () => createBeveledBlock(rect(0.45, 0.38), 0.34, idx === 1 ? 0x38bdf8 : 0x7dd3fc, 0.10),
      pos: [xVal, -1.62, -0.85], rot: [Math.PI / 2, 0, 0],
      mounts: [
        { pos: [xVal - 0.22, -1.34, -0.85], normal: [0, 1, 0] },
        { pos: [xVal + 0.22, -1.34, -0.85], normal: [0, 1, 0] },
        { pos: [xVal, -1.62, -1.32], normal: [0, 0, -1] }
      ]
    })),
    {
      id: 'uni_cloud_core', name: 'Corazón de la Nube', blockedBy: ['uni_cloud_front_1', 'uni_cloud_back_1'],
      buildMesh: () => createBeveledBlock(rect(0.65, 0.55), 0.38, 0xf472b6, 0.10),
      pos: [0, -1.65, 0], rot: [Math.PI / 2, 0, 0],
      mounts: [
        { pos: [-0.32, -1.35, 0], normal: [0, 1, 0] },
        { pos: [0.32, -1.35, 0], normal: [0, 1, 0] },
        { pos: [0, -1.35, 0.28], normal: [0, 1, 0] }
      ]
    }
  ];
}

// ============================================================================
// NIVEL 3: ZORRO ORIGAMI TOY (66 Tornillos / 22 Piezas Macizas)
// ============================================================================
export function getFoxOrigamiBlueprint() {
  const foxOrange = 0xf97316;
  const foxWhite  = 0xf8fafc;
  const foxDark   = 0x1e293b;
  const forestGrn = 0x22c55e;
  const rect = (w, h) => [[-w, -h], [w, -h], [w, h], [-w, h]];

  return [
    {
      id: 'fox_snout', name: 'Hocico de Zorro', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.32, -0.25], [0.32, -0.25], [0.18, 0.35], [-0.18, 0.35]], 0.42, foxWhite, 0.08),
      pos: [0, 0.65, 1.15], rot: [0.25, 0, 0],
      mounts: [
        { pos: [0, 0.78, 1.44], normal: [0, 0.5, 0.86] },
        { pos: [-0.28, 0.62, 1.38], normal: [-0.6, 0, 0.8] },
        { pos: [0.28, 0.62, 1.38], normal: [0.6, 0, 0.8] }
      ]
    },
    {
      id: 'fox_ear_l', name: 'Oreja Izquierda', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.28, -0.32], [0.28, -0.32], [0, 0.42]], 0.22, foxOrange, 0.06),
      pos: [-0.58, 1.52, 0.28], rot: [0, 0, 0.18],
      mounts: [
        { pos: [-0.58, 1.56, 0.46], normal: [0, 0.1, 0.99] },
        { pos: [-0.58, 1.56, 0.08], normal: [0, 0.1, -0.99] },
        { pos: [-0.82, 1.48, 0.28], normal: [-0.9, 0.4, 0] }
      ]
    },
    {
      id: 'fox_ear_r', name: 'Oreja Derecha', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.28, -0.32], [0.28, -0.32], [0, 0.42]], 0.22, foxOrange, 0.06),
      pos: [0.58, 1.52, 0.28], rot: [0, 0, -0.18],
      mounts: [
        { pos: [0.58, 1.56, 0.46], normal: [0, 0.1, 0.99] },
        { pos: [0.58, 1.56, 0.08], normal: [0, 0.1, -0.99] },
        { pos: [0.82, 1.48, 0.28], normal: [0.9, 0.4, 0] }
      ]
    },
    {
      id: 'fox_head', name: 'Cabeza Origami', blockedBy: ['fox_snout', 'fox_ear_l', 'fox_ear_r'],
      buildMesh: () => {
        const g = new THREE.Group();
        g.add(createSolidHalfOvoid(0.92, 0.76, 0.84, 0, 0, foxOrange));
        g.add(createCuteEyesGroup(0.35, 0.10, 0.74, 0xd97706));
        return g;
      },
      pos: [0, 0.86, 0.32], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.78, 0.92, 0.55], normal: [-0.85, 0.2, 0.48] },
        { pos: [0.78, 0.92, 0.55], normal: [0.85, 0.2, 0.48] },
        { pos: [0, 1.38, 0.58], normal: [0, 0.75, 0.65] }
      ]
    },
    {
      id: 'fox_chest_l', name: 'Pecho Blanco Izq', blockedBy: [],
      buildMesh: () => createSolidHalfOvoid(0.84, 0.95, 0.88, -1, 1, foxWhite),
      pos: [-0.02, -0.22, 0.12], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.36, 0.02, 0.88], normal: [-0.35, 0.1, 0.93] },
        { pos: [-0.38, -0.45, 0.82], normal: [-0.38, -0.3, 0.87] },
        { pos: [-0.72, -0.18, 0.58], normal: [-0.78, 0, 0.62] }
      ]
    },
    {
      id: 'fox_chest_r', name: 'Pecho Blanco Der', blockedBy: [],
      buildMesh: () => createSolidHalfOvoid(0.84, 0.95, 0.88, 1, 1, foxWhite),
      pos: [0.02, -0.22, 0.12], rot: [0, 0, 0],
      mounts: [
        { pos: [0.36, 0.02, 0.88], normal: [0.35, 0.1, 0.93] },
        { pos: [0.38, -0.45, 0.82], normal: [0.38, -0.3, 0.87] },
        { pos: [0.72, -0.18, 0.58], normal: [0.78, 0, 0.62] }
      ]
    },
    {
      id: 'fox_back_l', name: 'Lomo Naranja Izq', blockedBy: ['fox_chest_l'],
      buildMesh: () => createSolidHalfOvoid(0.92, 1.02, 0.92, -1, -1, foxOrange),
      pos: [-0.02, -0.22, -0.05], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.45, 0.05, -0.86], normal: [-0.45, 0.1, -0.88] },
        { pos: [-0.48, -0.48, -0.82], normal: [-0.48, -0.25, -0.84] },
        { pos: [-0.85, -0.22, -0.48], normal: [-0.88, 0, -0.47] }
      ]
    },
    {
      id: 'fox_back_r', name: 'Lomo Naranja Der', blockedBy: ['fox_chest_r'],
      buildMesh: () => createSolidHalfOvoid(0.92, 1.02, 0.92, 1, -1, foxOrange),
      pos: [0.02, -0.22, -0.05], rot: [0, 0, 0],
      mounts: [
        { pos: [0.45, 0.05, -0.86], normal: [0.45, 0.1, -0.88] },
        { pos: [0.48, -0.48, -0.82], normal: [0.48, -0.25, -0.84] },
        { pos: [0.85, -0.22, -0.48], normal: [0.88, 0, -0.47] }
      ]
    },
    {
      id: 'fox_tail_tip', name: 'Punta Blanca de Cola', blockedBy: [],
      buildMesh: () => new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 20), getToyMaterial(foxWhite)),
      pos: [0.65, 0.15, -1.45], rot: [-0.6, 0, -0.45],
      mounts: [
        { pos: [0.82, 0.25, -1.65], normal: [0.5, 0.4, -0.76] },
        { pos: [0.48, 0.25, -1.65], normal: [-0.4, 0.4, -0.82] },
        { pos: [0.88, -0.05, -1.42], normal: [0.85, -0.2, -0.48] }
      ]
    },
    {
      id: 'fox_tail_base', name: 'Cola Esponjosa Naranja', blockedBy: ['fox_tail_tip', 'fox_back_r'],
      buildMesh: () => new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.65, 14, 18), getToyMaterial(foxOrange)),
      pos: [0.28, -0.42, -1.08], rot: [-0.5, 0, -0.35],
      mounts: [
        { pos: [0.58, -0.42, -1.25], normal: [0.8, 0, -0.6] },
        { pos: [0.02, -0.42, -1.35], normal: [-0.4, 0, -0.9] },
        { pos: [0.28, -0.75, -1.25], normal: [0, -0.7, -0.7] }
      ]
    },
    ...[-0.48, 0.48].map((xVal, i) => ({
      id: `fox_paw_f_${i}`, name: `Pata Frontal ${i + 1}`, blockedBy: [i === 0 ? 'fox_chest_l' : 'fox_chest_r'],
      buildMesh: () => createBeveledBlock(rect(0.26, 0.28), 0.38, foxDark, 0.07),
      pos: [xVal, -1.18, 0.55], rot: [0, 0, 0],
      mounts: [
        { pos: [xVal, -1.12, 0.82], normal: [0, 0.2, 0.98] },
        { pos: [xVal + (i === 0 ? -0.32 : 0.32), -1.18, 0.55], normal: [i === 0 ? -1 : 1, 0, 0] },
        { pos: [xVal, -1.35, 0.78], normal: [0, -0.4, 0.91] }
      ]
    })),
    ...Array.from({ length: 10 }, (_, idx) => {
      const ang = (idx / 10) * Math.PI * 2;
      const r = idx < 8 ? 1.15 : 0.35;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      return {
        id: `fox_forest_base_${idx}`, name: `Pradera Bosque ${idx + 1}`,
        blockedBy: idx < 2 ? ['fox_paw_f_0', 'fox_paw_f_1'] : [],
        buildMesh: () => createBeveledBlock(rect(0.42, 0.36), 0.32, idx % 2 === 0 ? forestGrn : 0x4ade80, 0.08),
        pos: [x, -1.62, z], rot: [Math.PI / 2, -ang, 0],
        mounts: [
          { pos: [x - 0.18, -1.36, z], normal: [0, 1, 0] },
          { pos: [x + 0.18, -1.36, z], normal: [0, 1, 0] },
          { pos: [x + Math.cos(ang) * 0.38, -1.62, z + Math.sin(ang) * 0.38], normal: [Math.cos(ang), 0, Math.sin(ang)] }
        ]
      };
    })
  ];
} // <-- FIN VERIFICADO DEL BLOQUE 1

export function getSeaTurtleBlueprint() {
  const shellEmerald = 0x10b981;
  const shellGold    = 0xf59e0b;
  const skinTeal     = 0x2dd4bf;
  const coralPink    = 0xf43f5e;
  const reefBlue     = 0x38bdf8;
  const rect = (w, h) => [[-w, -h], [w, -h], [w, h], [-w, h]];

  return [
    // Cabeza Marina con Ojos Grandes
    {
      id: 'tur_head', name: 'Cabeza de Tortuga', blockedBy: [],
      buildMesh: () => {
        const g = new THREE.Group();
        g.add(createSolidHalfOvoid(0.62, 0.54, 0.72, 0, 0, skinTeal));
        g.add(createCuteEyesGroup(0.28, 0.08, 0.62, 0x0284c7));
        return g;
      },
      pos: [0, 0.12, 1.38], rot: [0, 0, 0],
      mounts: [
        { pos: [0, 0.55, 1.55], normal: [0, 0.7, 0.7] },
        { pos: [-0.52, 0.15, 1.48], normal: [-0.85, 0.1, 0.5] },
        { pos: [0.52, 0.15, 1.48], normal: [0.85, 0.1, 0.5] }
      ]
    },
    // Caparazón Superior Central + 4 Escudos Laterales (Costuras hexagonales)
    {
      id: 'tur_shell_top', name: 'Escudo Dorsal Central', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.48, -0.58], [0.48, -0.58], [0.58, 0], [0.48, 0.58], [-0.48, 0.58], [-0.58, 0]], 0.36, shellGold, 0.09),
      pos: [0, 0.65, 0], rot: [Math.PI / 2, 0, 0],
      mounts: [
        { pos: [0, 0.92, 0.28], normal: [0, 1, 0] },
        { pos: [-0.32, 0.92, -0.22], normal: [0, 1, 0] },
        { pos: [0.32, 0.92, -0.22], normal: [0, 1, 0] }
      ]
    },
    {
      id: 'tur_shell_fl', name: 'Caparazón Frontal Izq', blockedBy: ['tur_shell_top'],
      buildMesh: () => createSolidHalfOvoid(1.12, 0.72, 1.15, -1, 1, shellEmerald),
      pos: [-0.02, 0.18, 0.02], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.68, 0.48, 0.68], normal: [-0.6, 0.5, 0.6] },
        { pos: [-0.95, 0.22, 0.35], normal: [-0.9, 0.2, 0.38] },
        { pos: [-0.38, 0.35, 0.98], normal: [-0.35, 0.3, 0.88] }
      ]
    },
    {
      id: 'tur_shell_fr', name: 'Caparazón Frontal Der', blockedBy: ['tur_shell_top'],
      buildMesh: () => createSolidHalfOvoid(1.12, 0.72, 1.15, 1, 1, shellEmerald),
      pos: [0.02, 0.18, 0.02], rot: [0, 0, 0],
      mounts: [
        { pos: [0.68, 0.48, 0.68], normal: [0.6, 0.5, 0.6] },
        { pos: [0.95, 0.22, 0.35], normal: [0.9, 0.2, 0.38] },
        { pos: [0.38, 0.35, 0.98], normal: [0.35, 0.3, 0.88] }
      ]
    },
    {
      id: 'tur_shell_bl', name: 'Caparazón Trasero Izq', blockedBy: ['tur_shell_top'],
      buildMesh: () => createSolidHalfOvoid(1.12, 0.72, 1.15, -1, -1, shellEmerald),
      pos: [-0.02, 0.18, -0.02], rot: [0, 0, 0],
      mounts: [
        { pos: [-0.68, 0.48, -0.68], normal: [-0.6, 0.5, -0.6] },
        { pos: [-0.95, 0.22, -0.35], normal: [-0.9, 0.2, -0.38] },
        { pos: [-0.38, 0.35, -0.98], normal: [-0.35, 0.3, -0.88] }
      ]
    },
    {
      id: 'tur_shell_br', name: 'Caparazón Trasero Der', blockedBy: ['tur_shell_top'],
      buildMesh: () => createSolidHalfOvoid(1.12, 0.72, 1.15, 1, -1, shellEmerald),
      pos: [0.02, 0.18, -0.02], rot: [0, 0, 0],
      mounts: [
        { pos: [0.68, 0.48, -0.68], normal: [0.6, 0.5, -0.6] },
        { pos: [0.95, 0.22, -0.35], normal: [0.9, 0.2, -0.38] },
        { pos: [0.38, 0.35, -0.98], normal: [0.35, 0.3, -0.88] }
      ]
    },
    // 4 Aletas Nadadoras Hidrodinámicas
    {
      id: 'tur_flipper_fl', name: 'Aleta Marina Delantera Izq', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.55, -0.22], [0.55, -0.22], [0.35, 0.25], [-0.45, 0.25]], 0.20, skinTeal, 0.07),
      pos: [-1.28, -0.15, 0.55], rot: [Math.PI / 2, 0.35, -0.2],
      mounts: [
        { pos: [-1.45, 0.04, 0.62], normal: [0, 1, 0] },
        { pos: [-1.05, 0.04, 0.48], normal: [0, 1, 0] },
        { pos: [-1.28, -0.15, 0.85], normal: [0, 0, 1] }
      ]
    },
    {
      id: 'tur_flipper_fr', name: 'Aleta Marina Delantera Der', blockedBy: [],
      buildMesh: () => createBeveledBlock([[-0.55, -0.22], [0.55, -0.22], [0.45, 0.25], [-0.35, 0.25]], 0.20, skinTeal, 0.07),
      pos: [1.28, -0.15, 0.55], rot: [Math.PI / 2, -0.35, 0.2],
      mounts: [
        { pos: [1.45, 0.04, 0.62], normal: [0, 1, 0] },
        { pos: [1.05, 0.04, 0.48], normal: [0, 1, 0] },
        { pos: [1.28, -0.15, 0.85], normal: [0, 0, 1] }
      ]
    },
    {
      id: 'tur_flipper_bl', name: 'Aleta Trasera Izq', blockedBy: ['tur_shell_bl'],
      buildMesh: () => createBeveledBlock(rect(0.36, 0.22), 0.18, skinTeal, 0.06),
      pos: [-0.95, -0.22, -0.88], rot: [Math.PI / 2, -0.4, 0],
      mounts: [
        { pos: [-1.08, -0.05, -0.88], normal: [0, 1, 0] },
        { pos: [-0.82, -0.05, -0.88], normal: [0, 1, 0] },
        { pos: [-0.95, -0.22, -1.18], normal: [0, 0, -1] }
      ]
    },
    {
      id: 'tur_flipper_br', name: 'Aleta Trasera Der', blockedBy: ['tur_shell_br'],
      buildMesh: () => createBeveledBlock(rect(0.36, 0.22), 0.18, skinTeal, 0.06),
      pos: [0.95, -0.22, -0.88], rot: [Math.PI / 2, 0.4, 0],
      mounts: [
        { pos: [1.08, -0.05, -0.88], normal: [0, 1, 0] },
        { pos: [0.82, -0.05, -0.88], normal: [0, 1, 0] },
        { pos: [0.95, -0.22, -1.18], normal: [0, 0, -1] }
      ]
    },
    // Plastrón Ventral + Arrecife de Coral (13 bloques x 3 = 39 + 30 arriba = 69 tornillos exactos)
    ...Array.from({ length: 13 }, (_, idx) => {
      const isCenter = idx === 12;
      const ang = (idx / 12) * Math.PI * 2;
      const r = isCenter ? 0 : 1.05 + (idx % 2) * 0.28;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      return {
        id: `tur_reef_${idx}`, name: `Arrecife Coral ${idx + 1}`,
        blockedBy: isCenter ? ['tur_shell_fl', 'tur_shell_fr', 'tur_shell_bl', 'tur_shell_br'] : [],
        buildMesh: () => createBeveledBlock(rect(0.40, 0.35), 0.34, idx % 3 === 0 ? coralPink : reefBlue, 0.08),
        pos: [x, -1.15 - (idx % 2) * 0.22, z], rot: [Math.PI / 2, -ang, 0],
        mounts: [
          { pos: [x - 0.16, -0.88 - (idx % 2) * 0.22, z], normal: [0, 1, 0] },
          { pos: [x + 0.16, -0.88 - (idx % 2) * 0.22, z], normal: [0, 1, 0] },
          { pos: [x + Math.cos(ang) * 0.35, -1.15 - (idx % 2) * 0.22, z + Math.sin(ang) * 0.35], normal: [Math.cos(ang), 0.2, Math.sin(ang)] }
        ]
      };
    })
  ];
}

// ============================================================================
// NIVELES CON FIGURA ESCULPIDA (2 = Unicornio, 3 = Zorro, 4 = Tortuga)
// ============================================================================
export const BLUEPRINT_LEVELS = { 2: getUnicornToyBlueprint, 3: getFoxOrigamiBlueprint, 4: getSeaTurtleBlueprint };
export const BLUEPRINT_SCREWS = { 2: 63, 3: 66, 4: 69 };

/** Plano del nivel (solo 2–4); null = el nivel usa otro generador. */
export function getBlueprintForLevel(levelNumber) {
  const fn = BLUEPRINT_LEVELS[levelNumber];
  return fn ? fn() : null;
}

const BP_TARGET_EXTENT = 4.6;
const BP_CENTER_Y = -0.2;

/**
 * Convierte un plano (piezas + puntos de montaje) al modelo que consume penguinModelToLevel:
 * { pieces, screws, innerCore, screwScale, layers }. Capas = profundidad de bloqueo: las piezas que
 * tapan a otras (blockedBy) quedan en capas superiores, así que siempre hay un tornillo libre y el nivel se resuelve.
 */
export function buildBlueprintScene(blueprint) {
  const rootGroup = new THREE.Group();
  const byId = new Map(blueprint.map(b => [b.id, b]));

  const depth = new Map();
  const depthOf = (id, stack = new Set()) => {
    if (depth.has(id)) return depth.get(id);
    if (stack.has(id)) return 0;
    stack.add(id);
    let d = 0;
    for (const q of byId.get(id).blockedBy || []) if (byId.has(q)) d = Math.max(d, 1 + depthOf(q, stack));
    stack.delete(id);
    depth.set(id, d);
    return d;
  };
  let maxDepth = 0;
  for (const b of blueprint) maxDepth = Math.max(maxDepth, depthOf(b.id));
  const layers = {};
  for (const b of blueprint) layers[b.id] = maxDepth - depthOf(b.id);

  const pieces = [];
  for (const b of blueprint) {
    const mesh = b.buildMesh();
    mesh.position.fromArray(b.pos);
    if (b.rot) mesh.rotation.fromArray(b.rot);
    const pieceObj = { id: b.id, name: b.name, mesh, blockedBy: b.blockedBy || [], remainingScrews: [], isFalling: false };
    mesh.userData = { isPiece: true, pieceId: b.id, pieceRef: pieceObj };
    rootGroup.add(mesh);
    pieces.push(pieceObj);
  }

  rootGroup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rootGroup);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = Math.min(1.6, Math.max(1.0, BP_TARGET_EXTENT / Math.max(size.x, size.y * 0.9, size.z * 0.9)));
  const place = v => v.sub(center).multiplyScalar(scale).add(new THREE.Vector3(0, BP_CENTER_Y, 0));

  for (const p of pieces) {
    place(p.mesh.position);
    p.mesh.scale.multiplyScalar(scale);
  }

  const screws = [];
  blueprint.forEach((b, bi) => {
    const pieceObj = pieces[bi];
    (b.mounts || []).forEach((m, i) => {
      const s = createFlushToyScrew('orange', m.pos, m.normal);
      place(s.position);
      s.userData.screwId = `${b.id}_s_${i}`;
      s.userData.parentPiece = pieceObj;
      pieceObj.remainingScrews.push(s);
      screws.push(s);
      rootGroup.add(s);
    });
  });

  const snapInfo = snapScrewsToSurface(rootGroup, screws);
  return {
    rootGroup, pieces, screws, layers, snapInfo,
    innerCore: null,
    totalScrews: screws.length,
    scale,
    screwScale: (L1_SCREW_RADIUS * scale * 1.1) / 0.24
  };
}
