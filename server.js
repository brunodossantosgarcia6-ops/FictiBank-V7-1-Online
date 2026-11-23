const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_PATH || path.join(__dirname, "fictibank.db"));

db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  pix_key TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tx (
  id TEXT PRIMARY KEY,
  from_id TEXT,
  to_id TEXT,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(from_id) REFERENCES users(id),
  FOREIGN KEY(to_id) REFERENCES users(id)
);
`);

const seed = db.prepare(`
INSERT OR IGNORE INTO users (id,name,pin,balance,pix_key)
VALUES (@id,@name,@pin,@balance,@pix_key)
`);
seed.run({id:"bruno", name:"Bruno", pin:"1234", balance:1250, pix_key:"bruno@fictibank"});
seed.run({id:"irmao", name:"Irmão", pin:"4321", balance:650, pix_key:"irmao@fictibank"});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function publicUser(u) {
  return {id:u.id, name:u.name, balance:u.balance, pix_key:u.pix_key};
}

app.post("/api/login", (req,res)=>{
  const {id,pin}=req.body || {};
  const u=db.prepare("SELECT * FROM users WHERE id=? AND pin=?").get(id,pin);
  if(!u) return res.status(401).json({error:"PIN ou usuário inválido."});
  res.json({user:publicUser(u)});
});

app.get("/api/account/:id", (req,res)=>{
  const u=db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
  if(!u) return res.status(404).json({error:"Conta não encontrada."});
  const tx=db.prepare(`
    SELECT t.*, fu.name AS from_name, tu.name AS to_name
    FROM tx t
    LEFT JOIN users fu ON fu.id=t.from_id
    LEFT JOIN users tu ON tu.id=t.to_id
    WHERE t.from_id=? OR t.to_id=?
    ORDER BY t.created_at DESC
    LIMIT 100
  `).all(u.id,u.id);
  res.json({user:publicUser(u), transactions:tx});
});

app.post("/api/add-money",(req,res)=>{
  const {id,amount}=req.body || {};
  const value=Number(amount);
  if(!Number.isFinite(value) || value<=0) return res.status(400).json({error:"Valor inválido."});
  const u=db.prepare("SELECT * FROM users WHERE id=?").get(id);
  if(!u) return res.status(404).json({error:"Conta não encontrada."});
  db.prepare("UPDATE users SET balance=balance+? WHERE id=?").run(value,id);
  const updated=db.prepare("SELECT * FROM users WHERE id=?").get(id);
  res.json({user:publicUser(updated)});
});

app.post("/api/pix",(req,res)=>{
  const {from_id,pix_key,amount,description}=req.body || {};
  const value=Number(amount);
  if(!Number.isFinite(value) || value<=0) return res.status(400).json({error:"Valor inválido."});
  const from=db.prepare("SELECT * FROM users WHERE id=?").get(from_id);
  const to=db.prepare("SELECT * FROM users WHERE pix_key=?").get(String(pix_key||"").trim());
  if(!from || !to) return res.status(404).json({error:"Conta ou chave Pix não encontrada."});
  if(from.id===to.id) return res.status(400).json({error:"Não é possível enviar Pix para a própria conta."});
  if(from.balance < value) return res.status(400).json({error:"Saldo insuficiente."});

  const txid="FB-"+Math.random().toString(36).slice(2,12).toUpperCase();
  const now=new Date().toISOString();
  const transfer=db.transaction(()=>{
    db.prepare("UPDATE users SET balance=balance-? WHERE id=?").run(value,from.id);
    db.prepare("UPDATE users SET balance=balance+? WHERE id=?").run(value,to.id);
    db.prepare(`
      INSERT INTO tx (id,from_id,to_id,amount,description,created_at)
      VALUES (?,?,?,?,?,?)
    `).run(txid,from.id,to.id,value,description||"Pix",now);
  });
  transfer();

  const updated=db.prepare("SELECT * FROM users WHERE id=?").get(from.id);
  res.json({user:publicUser(updated),txid});
});

app.get("/api/ping",(req,res)=>res.json({ok:true,app:"FictiBank V7.1 Online"}));

app.get(/.*/, (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,()=>console.log(`FictiBank V7.1 Online rodando na porta ${PORT}`));
