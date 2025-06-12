import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

dotenv.config();

/* ---------- create a connection pool ---------- */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 0,
});

const app = express();
app.use(express.json());

/* ---------- /register ---------- */
app.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password required" });
  }

  const [dup] = await pool.query("SELECT 1 FROM users WHERE email = ?", [
    email,
  ]);
  if (dup.length) return res.status(409).json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, phone) VALUES (?,?,?,?)",
    [name, email, hash, phone ?? null]
  );
  res.status(201).json({ message: "User created" });
});

/* ---------- /login ---------- */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query(
    "SELECT user_id, password_hash FROM users WHERE email = ?",
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: "Invalid creds" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid creds" });

  const token = jwt.sign({ user_id: rows[0].user_id, email }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
  res.json({ token });
});

/* ---------- example protected route ---------- */
app.get("/profile", auth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?",
    [req.user.user_id]
  );
  res.json(rows[0]);
});

function auth(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

app.listen(3000, () => console.log("API listening on http://localhost:3000"));
