/**
 * Retro FC Slots — Backend
 * Node.js + Express | Estado en memoria
 */

const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Estado en memoria ───────────────────────────────────────────────────────
let balance      = 100;
let history      = [];
let dailyClaimed = false;

// ── Config ──────────────────────────────────────────────────────────────────
const SPIN_COST = 0; // Cambia a > 0 cuando quieras cobrar monedas

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Genera un código único con prefijo */
function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Decide el resultado de la tirada con probabilidades */
function rollResult() {
  const r = Math.random();
  if (r < 0.50)  return "nothing";
  if (r < 0.75)  return "discount";
  if (r < 0.90)  return "free_ship";
  if (r < 0.97)  return "vip";
  if (r < 0.995) return "shirt";
  return "jackpot";
}

/** Símbolos que muestran los rodillos según resultado */
const SYMBOL_MAP = {
  nothing:   ["balon",    "moneda",   "estrella"],
  discount:  ["moneda",   "moneda",   "moneda"],
  free_ship: ["estrella", "estrella", "estrella"],
  vip:       ["corona",   "corona",   "corona"],
  shirt:     ["camiseta", "camiseta", "camiseta"],
  jackpot:   ["trofeo",   "trofeo",   "trofeo"],
};

/** Mensajes por resultado */
const MESSAGES = {
  nothing:   "Sin premio esta vez. ¡Suerte en la próxima!",
  discount:  "¡Has ganado un descuento del 15%!",
  free_ship: "¡Envío gratis en tu próximo pedido!",
  vip:       "¡Has conseguido acceso VIP!",
  shirt:     "¡Increíble! Has ganado una camiseta retro.",
  jackpot:   "🏆 ¡JACKPOT! Premio máximo conseguido.",
};

/** Construye el objeto prize según el tipo (código SIEMPRE único) */
function buildPrize(type) {
  switch (type) {
    case "discount":
      return {
        code:        uid("SLOT15"),
        description: "Descuento 15%",
      };

    case "free_ship":
      return {
        code:        uid("ENVIO"),
        description: "Envío gratis en tu próximo pedido",
      };

    case "vip":
      return {
        code:        uid("VIP"),
        description: "Acceso VIP",
      };

    case "shirt":
      return {
        code:          uid("SHIRT"),
        description:   "Camiseta Retro Gratis",
        product_name:  "Camiseta Retro Sorpresa",
        product_image: "", // ← Sustituye con URL real de Shopify CDN
        product_url:   "/collections/all",
      };

    case "jackpot":
      return {
        code:          uid("JACKPOT"),
        description:   "¡JACKPOT! Premio máximo",
        product_name:  "Camiseta Jackpot Edition",
        product_image: "", // ← Sustituye con URL real de Shopify CDN
        product_url:   "/collections/all",
      };

    default:
      return null; // "nothing" → sin prize
  }
}

// ── Rutas ────────────────────────────────────────────────────────────────────

// Health check
app.get("/", (_req, res) => {
  res.send("Retro FC Slots — OK ✅");
});

// GET /balance
app.get("/balance", (_req, res) => {
  res.json({ balance });
});

// GET /history
app.get("/history", (_req, res) => {
  res.json({ history });
});

// POST /daily-bonus
app.post("/daily-bonus", (_req, res) => {
  if (dailyClaimed) {
    return res.status(409).json({ error: "Bonus ya reclamado hoy." });
  }

  dailyClaimed = true;
  balance += 5;

  res.json({
    balance,
    coins_awarded: 5,
  });
});

// POST /spin
app.post("/spin", (_req, res) => {
  if (balance < SPIN_COST) {
    return res.status(402).json({ error: "Saldo insuficiente." });
  }

  balance -= SPIN_COST;

  const result_type = rollResult();
  const result      = SYMBOL_MAP[result_type];   // ["sym","sym","sym"]
  const prize       = buildPrize(result_type);    // objeto prize o null
  const message     = MESSAGES[result_type];

  // Guardar en historial (máx. 20)
  history.unshift({
    result_type,
    description: message,
    coins_spent: SPIN_COST,
    created_at:  new Date().toISOString(),
  });
  history = history.slice(0, 20);

  res.json({
    balance,
    result,       // array de 3 símbolos
    result_type,
    prize,
    message,
  });
});

// ── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎰 Retro FC Slots backend corriendo en puerto ${PORT}`);
});
