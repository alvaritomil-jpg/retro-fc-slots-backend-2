const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir peticiones desde fuera
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Estado falso en memoria
let balance = 100;
let history = [];
let dailyClaimed = false;

const SPIN_COST = 10;

function randomResult() {
  const rand = Math.random();

  if (rand < 0.50) return "nothing";
  if (rand < 0.75) return "discount";
  if (rand < 0.90) return "free_ship";
  if (rand < 0.97) return "vip";
  if (rand < 0.995) return "shirt";
  return "jackpot";
}

function symbolsForResult(resultType) {
  const map = {
    nothing: ["balon", "moneda", "estrella"],
    discount: ["moneda", "moneda", "moneda"],
    free_ship: ["estrella", "estrella", "estrella"],
    vip: ["corona", "corona", "corona"],
    shirt: ["camiseta", "camiseta", "camiseta"],
    jackpot: ["trofeo", "trofeo", "trofeo"],
  };

  return map[resultType] || ["balon", "moneda", "estrella"];
}

function buildPrize(resultType) {
  if (resultType === "discount") {
    return {
      code: "SLOT-15OFF",
      description: "Descuento 15%",
    };
  }

  if (resultType === "free_ship") {
    return {
      code: "ENVIO-GRATIS",
      description: "Envío gratis",
    };
  }

  if (resultType === "vip") {
    return {
      code: "VIP-ACCESS",
      description: "Acceso VIP",
    };
  }

  if (resultType === "shirt") {
    return {
      code: "CAMISETA-GRATIS",
      product_name: "Camiseta retro sorpresa",
      product_image: "",
      product_url: "/collections/all",
      description: "Camiseta retro gratis",
    };
  }

  if (resultType === "jackpot") {
    return {
      code: "JACKPOT",
      product_name: "Camiseta jackpot",
      product_image: "",
      product_url: "/collections/all",
      description: "¡Jackpot!",
    };
  }

  return null;
}

function buildMessage(resultType) {
  const messages = {
    nothing: "No te ha tocado nada esta vez.",
    discount: "Has ganado un descuento.",
    free_ship: "Has ganado envío gratis.",
    vip: "Has ganado acceso VIP.",
    shirt: "Has ganado una camiseta.",
    jackpot: "¡Jackpot! Premio máximo.",
  };

  return messages[resultType] || "Resultado desconocido.";
}

// Salud
app.get("/", (req, res) => {
  res.send("Backend Retro FC Slots funcionando");
});

// Saldo
app.get("/balance", (req, res) => {
  res.json({ balance });
});

// Historial
app.get("/history", (req, res) => {
  res.json({ history });
});

// Bonus diario
app.post("/daily-bonus", (req, res) => {
  if (dailyClaimed) {
    return res.status(409).json({
      error: "Ya reclamaste el bonus hoy.",
    });
  }

  dailyClaimed = true;
  balance += 5;

  res.json({
    new_balance: balance,
    coins_awarded: 5,
  });
});

// Girar
app.post("/spin", (req, res) => {
  if (balance < SPIN_COST) {
    return res.status(402).json({
      error: "Saldo insuficiente",
    });
  }

  balance -= SPIN_COST;

  const resultType = randomResult();
  const symbols = symbolsForResult(resultType);
  const prize = buildPrize(resultType);
  const message = buildMessage(resultType);

  const entry = {
    result_type: resultType,
    description: message,
    coins_spent: SPIN_COST,
    created_at: new Date().toISOString(),
  };

  history.unshift(entry);
  history = history.slice(0, 20);

  res.json({
    result_type: resultType,
    symbols,
    prize,
    new_balance: balance,
    message,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});