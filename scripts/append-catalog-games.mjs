import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gamesPath = path.join(root, "artifacts/gamereviews/src/data/games.json");

const existing = JSON.parse(readFileSync(gamesPath, "utf-8"));
const existingSteam = new Set(existing.map((g) => g.steamId).filter(Boolean));
const existingSlugs = new Set(existing.map((g) => g.slug));

function g(
  nombre,
  slug,
  steamId,
  categoria,
  generos,
  plataformas,
  desarrollador,
  publicador,
  fecha,
  rating,
  metacritic,
  precio,
  descripcion,
  descripcionCorta,
  video = "dQw4w9WgXcQ",
) {
  if (existingSlugs.has(slug) || (steamId && existingSteam.has(steamId))) return null;
  const imagen = steamId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_600x900.jpg`
    : "";
  const imagenBanner = steamId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`
    : "";
  return {
    nombre,
    slug,
    steamId,
    categoria,
    generos,
    precio,
    precioOriginal: precio,
    descuento: 0,
    imagen,
    imagenBanner,
    descripcion,
    descripcionCorta,
    plataforma: plataformas[0],
    plataformas,
    desarrollador,
    publicador,
    fechaLanzamiento: fecha,
    rating,
    ratingMetacritic: metacritic,
    ratingUsuariosMetacritic: Math.round((metacritic / 10) * 10) / 10,
    video: `https://www.youtube.com/embed/${video}`,
    tags: [...generos, "multijugador"].slice(0, 4),
    skins: [],
    packs: [],
    enlacesCompra: steamId
      ? { steam: `https://store.steampowered.com/app/${steamId}/` }
      : {},
  };
}

const defs = [
  g("Counter-Strike 2", "counter-strike-2", 730, "disparos", ["disparos", "competitivo"], ["PC"], "Valve", "Valve", "2023-09-27", 4.5, 85, 0, "El shooter táctico competitivo más jugado del mundo.", "CS2 — precisión y estrategia."),
  g("Dota 2", "dota-2", 570, "estrategia", ["estrategia", "moba"], ["PC"], "Valve", "Valve", "2013-07-09", 4.4, 90, 0, "MOBA free-to-play con profundidad competitiva legendaria.", "La batalla de los antiguos continúa."),
  g("PUBG: Battlegrounds", "pubg", 578080, "disparos", ["disparos", "battle-royale"], ["PC", "PS5", "Xbox Series X", "Mobile"], "KRAFTON", "KRAFTON", "2017-12-21", 4.0, 86, 0, "El battle royale que definió el género.", "100 jugadores, una sola victoria."),
  g("Apex Legends", "apex-legends", 1172470, "disparos", ["disparos", "battle-royale"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Respawn", "EA", "2020-11-04", 4.3, 88, 0, "Battle royale hero shooter frenético y gratuito.", "Escuadras, habilidades, acción."),
  g("Destiny 2", "destiny-2", 1085660, "disparos", ["disparos", "mmo"], ["PC", "PS5", "Xbox Series X"], "Bungie", "Bungie", "2019-10-01", 4.2, 85, 0, "Shooter MMO con raids épicas y loot infinito.", "Guardianes, uníos."),
  g("Warframe", "warframe", 230410, "accion", ["accion", "cooperativo"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Digital Extremes", "Digital Extremes", "2013-03-25", 4.4, 69, 0, "Acción sci-fi cooperativa free-to-play.", "Ninjas espaciales gratuitos."),
  g("Rocket League", "rocket-league", 252950, "deportes", ["deportes", "carreras"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Psyonix", "Epic Games", "2015-07-07", 4.5, 86, 0, "Fútbol con coches: caos vehicular multijugador.", "Goles aéreos garantizados."),
  g("Terraria", "terraria", 105600, "aventura", ["aventura", "sandbox"], ["PC", "Mobile", "Nintendo Switch"], "Re-Logic", "Re-Logic", "2011-05-16", 4.8, 83, 9.99, "Sandbox 2D con exploración, crafteo y jefes.", "Cava, construye, conquista."),
  g("Rust", "rust", 252490, "supervivencia", ["supervivencia", "multijugador"], ["PC", "PS5", "Xbox Series X"], "Facepunch", "Facepunch", "2018-02-08", 4.0, 69, 39.99, "Supervivencia brutal donde todos son enemigos.", "Confía en nadie."),
  g("Fallout 4", "fallout-4", 377160, "rpg", ["rpg", "accion"], ["PC", "PS4", "Xbox One"], "Bethesda", "Bethesda", "2015-11-10", 4.3, 87, 19.99, "RPG postapocalíptico en la Commonwealth.", "War never changes."),
  g("The Elder Scrolls V: Skyrim", "skyrim-se", 489830, "rpg", ["rpg", "aventura"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Bethesda", "Bethesda", "2016-10-28", 4.7, 94, 39.99, "Aventura épica en Tamriel.", "Fus ro dah."),
  g("Dark Souls III", "dark-souls-3", 374320, "rpg", ["rpg", "accion"], ["PC", "PS4", "Xbox One"], "FromSoftware", "Bandai Namco", "2016-04-12", 4.6, 89, 59.99, "Desafío legendario y diseño de niveles magistral.", "Prepare to die."),
  g("Horizon Zero Dawn", "horizon-zero-dawn", 1151640, "accion", ["accion", "aventura"], ["PC", "PS4", "PS5"], "Guerrilla", "Sony", "2020-08-07", 4.5, 86, 49.99, "Caza máquinas en un mundo postapocalíptico.", "Aloy contra el mundo."),
  g("Death Stranding", "death-stranding", 1190460, "aventura", ["aventura", "narrativa"], ["PC", "PS4", "PS5"], "Kojima Productions", "505 Games", "2020-07-14", 4.2, 82, 39.99, "Conecta un mundo roto entregando esperanza.", "Keep on keeping on."),
  g("Monster Hunter Rise", "monster-hunter-rise", 1446780, "accion", ["accion", "rpg"], ["PC", "Nintendo Switch"], "Capcom", "Capcom", "2022-01-12", 4.5, 88, 39.99, "Caza monstruos épicos con movilidad vertical.", "Elige tu arma."),
  g("Resident Evil 2", "resident-evil-2", 883710, "terror", ["terror", "accion"], ["PC", "PS4", "Xbox One"], "Capcom", "Capcom", "2019-01-25", 4.8, 93, 39.99, "Remake de terror claustrofóbico en Raccoon City.", "Survival horror definitivo."),
  g("Divinity: Original Sin 2", "divinity-os2", 435150, "rpg", ["rpg", "estrategia"], ["PC", "PS4", "Xbox One", "Nintendo Switch"], "Larian", "Larian", "2017-09-14", 4.8, 93, 44.99, "RPG táctico cooperativo con libertad total.", "Tu historia, tus reglas."),
  g("RimWorld", "rimworld", 294100, "estrategia", ["estrategia", "simulacion"], ["PC", "Xbox Series X", "PS4"], "Ludeon", "Ludeon", "2018-10-17", 4.7, 87, 34.99, "Colonia sci-fi con historias emergentes.", "Cada colonia es única."),
  g("Cities: Skylines II", "cities-skylines-2", 949230, "simulacion", ["simulacion", "construccion"], ["PC", "PS5", "Xbox Series X"], "Colossal Order", "Paradox", "2023-10-24", 3.8, 75, 49.99, "Construye la metrópolis de tus sueños.", "Alcalde supremo."),
  g("Total War: WARHAMMER III", "total-war-warhammer-3", 1142710, "estrategia", ["estrategia", "accion"], ["PC"], "Creative Assembly", "SEGA", "2022-02-17", 4.2, 86, 59.99, "Estrategia épica en el mundo de Warhammer.", "Domina el Caos."),
  g("F1 24", "f1-24", 2488620, "carreras", ["carreras", "deportes"], ["PC", "PS5", "Xbox Series X"], "Codemasters", "EA", "2024-05-30", 4.0, 78, 69.99, "Simulador oficial de Fórmula 1.", "Lights out."),
  g("NBA 2K25", "nba-2k25", 2878980, "deportes", ["deportes", "simulacion"], ["PC", "PS5", "Xbox Series X"], "Visual Concepts", "2K", "2024-09-06", 3.5, 78, 69.99, "Baloncesto americano con modo carrera.", "From the park to the league."),
  g("The Last of Us Part I", "the-last-of-us-part-1", 1888930, "aventura", ["aventura", "accion"], ["PC", "PS5"], "Naughty Dog", "Sony", "2023-03-28", 4.6, 88, 59.99, "Supervivencia emocional en un mundo infectado.", "When you're lost in the dark."),
  g("Uncharted: Legacy of Thieves", "uncharted-legacy", 1659420, "aventura", ["aventura", "accion"], ["PC", "PS5"], "Naughty Dog", "Sony", "2022-10-19", 4.5, 87, 49.99, "Aventuras cinematográficas de Nathan Drake.", "Fortune favors the bold."),
  g("Ghost of Tsushima", "ghost-of-tsushima", 2215430, "accion", ["accion", "aventura"], ["PC", "PS5"], "Sucker Punch", "Sony", "2024-05-16", 4.7, 83, 59.99, "Samurái en la isla de Tsushima.", "Honor del fantasma."),
  g("Ratchet & Clank: Rift Apart", "ratchet-clank-rift-apart", 1895880, "accion", ["accion", "plataformas"], ["PC", "PS5"], "Insomniac", "Sony", "2023-07-26", 4.6, 87, 59.99, "Plataformas dimensionales espectaculares.", "El dúo más divertido."),
  g("Yakuza: Like a Dragon", "yakuza-like-a-dragon", 1235140, "rpg", ["rpg", "accion"], ["PC", "PS5", "Xbox Series X"], "Ryu Ga Gotoku", "SEGA", "2020-11-10", 4.5, 84, 39.99, "RPG urbano japonés con humor y corazón.", "Ichiban, héroe inesperado."),
  g("Tekken 8", "tekken-8", 1778820, "lucha", ["lucha", "competitivo"], ["PC", "PS5", "Xbox Series X"], "Bandai Namco", "Bandai Namco", "2024-01-26", 4.4, 90, 69.99, "El rey de los fighters 3D regresa.", "Get ready for the next battle."),
  g("Palworld", "palworld", 1623730, "aventura", ["aventura", "supervivencia"], ["PC", "Xbox Series X"], "Pocketpair", "Pocketpair", "2024-01-19", 4.0, 72, 29.99, "Criaturas, crafteo y combate con amigos.", "Pokémon con armas."),
  g("Lethal Company", "lethal-company", 1966720, "terror", ["terror", "cooperativo"], ["PC"], "Zeekerss", "Zeekerss", "2023-10-24", 4.6, 82, 9.99, "Horror cooperativo de recolección espacial.", "No olvides el porcentaje."),
  g("Valheim", "valheim", 892970, "supervivencia", ["supervivencia", "cooperativo"], ["PC", "Xbox Series X"], "Iron Gate", "Coffee Stain", "2021-02-02", 4.7, 86, 19.99, "Vikingos, crafteo y jefes nórdicos.", "Valhalla te espera."),
  g("Sons of the Forest", "sons-of-the-forest", 1326470, "supervivencia", ["supervivencia", "terror"], ["PC"], "Endnight", "Newnight", "2024-03-06", 4.2, 80, 29.99, "Secuela de supervivencia en isla caníbal.", "Construye, caza, sobrevive."),
  g("Subnautica", "subnautica", 264710, "aventura", ["aventura", "supervivencia"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Unknown Worlds", "Unknown Worlds", "2018-01-23", 4.8, 87, 29.99, "Explora océanos alienígenas.", "Bajo el agua todo cambia."),
  g("No Man's Sky", "no-mans-sky", 275850, "aventura", ["aventura", "exploracion"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Hello Games", "Hello Games", "2016-08-12", 4.3, 78, 59.99, "Exploración procedural infinita.", "El universo entero."),
  g("Sea of Thieves", "sea-of-thieves", 1172620, "aventura", ["aventura", "multijugador"], ["PC", "Xbox Series X"], "Rare", "Xbox Game Studios", "2020-06-02", 4.2, 81, 39.99, "Piratas cooperativos en alta mar.", "Yarr, matey."),
  g("Halo: The Master Chief Collection", "halo-mcc", 976730, "disparos", ["disparos", "ciencia-ficcion"], ["PC", "Xbox Series X"], "343 Industries", "Xbox Game Studios", "2019-12-03", 4.6, 85, 39.99, "La saga Halo completa en PC.", "Finish the fight."),
  g("Gears 5", "gears-5", 1097840, "disparos", ["disparos", "accion"], ["PC", "Xbox Series X"], "The Coalition", "Xbox Game Studios", "2019-09-10", 4.1, 84, 39.99, "Cover shooter brutal contra el Enjambre.", "Chainsaw time."),
  g("Starfield", "starfield", 1716740, "rpg", ["rpg", "exploracion"], ["PC", "Xbox Series X"], "Bethesda", "Xbox Game Studios", "2023-09-06", 3.8, 83, 69.99, "RPG espacial de exploración Bethesda.", "Ad astra."),
  g("Diablo IV", "diablo-4", 2344520, "rpg", ["rpg", "accion"], ["PC", "PS5", "Xbox Series X"], "Blizzard", "Blizzard", "2023-06-06", 4.0, 88, 69.99, "Hack and slash oscuro de mundo abierto.", "Lilith ha regresado."),
  g("Overwatch 2", "overwatch-2", 2357570, "disparos", ["disparos", "hero-shooter"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "Blizzard", "Blizzard", "2022-10-04", 3.9, 79, 0, "Hero shooter por equipos free-to-play.", "Heroes never die."),
  g("World of Warcraft", "world-of-warcraft", null, "rpg", ["rpg", "mmo"], ["PC"], "Blizzard", "Blizzard", "2004-11-23", 4.5, 93, 14.99, "El MMORPG que definió una generación.", "Por la Alianza o la Horda."),
  g("Final Fantasy XIV", "final-fantasy-xiv", 39210, "rpg", ["rpg", "mmo"], ["PC", "PS5", "Xbox Series X"], "Square Enix", "Square Enix", "2013-08-27", 4.7, 89, 19.99, "MMORPG narrativo de fantasía épica.", "Hydaelyn te llama."),
  g("Genshin Impact", "genshin-impact", null, "rpg", ["rpg", "accion"], ["PC", "PS5", "Mobile"], "miHoYo", "miHoYo", "2020-09-28", 4.4, 87, 0, "Action RPG gacha de mundo abierto.", "Explora Teyvat gratis."),
  g("Honkai: Star Rail", "honkai-star-rail", null, "rpg", ["rpg", "turnos"], ["PC", "PS5", "Mobile"], "miHoYo", "miHoYo", "2023-04-26", 4.5, 86, 0, "RPG por turnos sci-fi con estilo anime.", "Expreso Astral."),
  g("League of Legends", "league-of-legends", null, "estrategia", ["estrategia", "moba"], ["PC"], "Riot Games", "Riot Games", "2009-10-27", 4.3, 78, 0, "MOBA competitivo más popular del planeta.", "Summoner's Rift."),
  g("Fortnite", "fortnite", null, "accion", ["accion", "battle-royale"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch", "Mobile"], "Epic Games", "Epic Games", "2017-07-25", 4.2, 81, 0, "Battle royale con construcción y eventos en vivo.", "Victory Royale."),
  g("Minecraft", "minecraft", null, "aventura", ["aventura", "sandbox"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch", "Mobile"], "Mojang", "Microsoft", "2011-11-18", 4.8, 93, 26.95, "Sandbox creativo sin límites.", "Crea tu mundo."),
  g("Roblox", "roblox", null, "aventura", ["aventura", "social"], ["PC", "Mobile", "Xbox Series X"], "Roblox Corp", "Roblox Corp", "2006-09-01", 4.1, 70, 0, "Plataforma de experiencias creadas por usuarios.", "Millones de mundos."),
  g("Clash Royale", "clash-royale", null, "estrategia", ["estrategia", "mobile"], ["Mobile"], "Supercell", "Supercell", "2016-03-02", 4.3, 80, 0, "Duelos tácticos en tiempo real en móvil.", "Cartas y corona."),
  g("Brawl Stars", "brawl-stars", null, "accion", ["accion", "mobile"], ["Mobile"], "Supercell", "Supercell", "2018-12-12", 4.4, 76, 0, "Multijugador rápido para móvil.", "Brawlers en acción."),
  g("The Witcher 3: Wild Hunt", "witcher-3", 292030, "rpg", ["rpg", "aventura"], ["PC", "PS5", "Xbox Series X", "Nintendo Switch"], "CD Projekt Red", "CD Projekt", "2015-05-19", 4.9, 93, 39.99, "RPG narrativo de monstruos y decisiones.", "Toss a coin."),
  g("Red Dead Redemption 2", "red-dead-redemption-2", 1174180, "aventura", ["aventura", "accion"], ["PC", "PS4", "Xbox One"], "Rockstar", "Rockstar", "2019-12-05", 4.9, 97, 59.99, "Western épico de banda forajida.", "Outlaws for life."),
  g("Grand Theft Auto V", "gta-v", 271590, "accion", ["accion", "mundo-abierto"], ["PC", "PS5", "Xbox Series X"], "Rockstar", "Rockstar", "2015-04-14", 4.7, 96, 29.99, "Crimen y sátira en Los Santos.", "Welcome to San Andreas."),
  g("Portal 2", "portal-2", 620, "puzzle", ["puzzle", "aventura"], ["PC", "PS3", "Xbox 360"], "Valve", "Valve", "2011-04-19", 4.9, 95, 9.99, "Puzzles con portales y humor negro.", "The cake is a lie."),
  g("Half-Life: Alyx", "half-life-alyx", 546560, "accion", ["accion", "vr"], ["PC"], "Valve", "Valve", "2020-03-23", 4.8, 93, 59.99, "VR narrativo revolucionario.", "Rise and shine."),
  g("Left 4 Dead 2", "left-4-dead-2", 550, "disparos", ["disparos", "cooperativo"], ["PC", "Xbox 360"], "Valve", "Valve", "2009-11-17", 4.8, 89, 9.99, "Cooperativo zombie clásico.", "Pills here!"),
  g("Payday 3", "payday-3", 1272080, "accion", ["accion", "cooperativo"], ["PC", "PS5", "Xbox Series X"], "Starbreeze", "Deep Silver", "2023-09-21", 3.5, 68, 39.99, "Atracos cooperativos en primera persona.", "Get the money."),
  g("Borderlands 3", "borderlands-3", 397540, "disparos", ["disparos", "rpg"], ["PC", "PS5", "Xbox Series X"], "Gearbox", "2K", "2019-09-13", 4.2, 81, 59.99, "Looter shooter caótico y divertido.", "Billions of guns."),
  g("Mass Effect Legendary Edition", "mass-effect-le", 1328670, "rpg", ["rpg", "ciencia-ficcion"], ["PC", "PS4", "Xbox One"], "BioWare", "EA", "2021-05-14", 4.7, 87, 59.99, "Trilogía sci-fi remasterizada.", "Commander Shepard."),
  g("Dragon's Dogma 2", "dragons-dogma-2", 2054970, "rpg", ["rpg", "accion"], ["PC", "PS5", "Xbox Series X"], "Capcom", "Capcom", "2024-03-22", 4.4, 84, 69.99, "RPG de acción con pawns y dragones.", "Arisen despierta."),
  g("Street Fighter 6", "street-fighter-6", 1364780, "lucha", ["lucha", "competitivo"], ["PC", "PS5", "Xbox Series X"], "Capcom", "Capcom", "2023-06-02", 4.6, 92, 59.99, "Fighting game con World Tour.", "Hadouken!"),
].filter(Boolean);

let nextId = Math.max(...existing.map((x) => x.id), 0) + 1;
const added = defs.map((entry) => ({ id: nextId++, ...entry }));

const merged = [...existing, ...added];
writeFileSync(gamesPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
console.log(`Added ${added.length} games. Total: ${merged.length}`);
