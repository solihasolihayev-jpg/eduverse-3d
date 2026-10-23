const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true, app: "EDUVERSE 3D", rooms: rooms.size }));

const MAX_PLAYERS = 40;
const rooms = new Map();
const questionBank = [
  { q: "Fotosintez jarayoni asosan qaysi organoidda sodir bo‘ladi?", a: ["Mitoxondriya", "Xloroplast", "Ribosoma", "Yadro"], correct: 1 },
  { q: "HTML asosan nima uchun ishlatiladi?", a: ["Veb-sahifa tuzilmasi", "Ma’lumotlar bazasi", "Operatsion tizim", "Kompyuter sovitish"], correct: 0 },
  { q: "Suvning kimyoviy formulasi qaysi?", a: ["CO₂", "O₂", "H₂O", "NaCl"], correct: 2 },
  { q: "O‘zbekiston Respublikasining poytaxti qaysi shahar?", a: ["Samarqand", "Buxoro", "Toshkent", "Xiva"], correct: 2 },
  { q: "1 bayt odatda nechta bitdan iborat?", a: ["4", "8", "16", "32"], correct: 1 }
];

function roomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}
function publicRoom(room) {
  return {
    code: room.code, status: room.status, hostId: room.hostId,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, avatar: p.avatar, score: p.score,
      correct: p.correct, answered: p.answered
    })).sort((a,b) => b.score - a.score),
    questionIndex: room.questionIndex,
    questionCount: room.questions.length,
    currentQuestion: room.status === "playing" && room.questionIndex < room.questions.length
      ? { q: room.questions[room.questionIndex].q, a: room.questions[room.questionIndex].a, endsAt: room.endsAt }
      : null
  };
}
function broadcastRoom(room) {
  io.to(room.code).emit("room_update", publicRoom(room));
}
function finishRoom(room) {
  room.status = "finished";
  room.endsAt = null;
  broadcastRoom(room);
  io.to(room.code).emit("game_finished", {
    leaderboard: publicRoom(room).players,
    message: "O‘yin yakunlandi!"
  });
}
function nextQuestion(room) {
  room.questionIndex++;
  if (room.questionIndex >= room.questions.length) return finishRoom(room);
  room.players.forEach(p => { p.answered = false; });
  room.endsAt = Date.now() + room.questionSeconds * 1000;
  const q = room.questions[room.questionIndex];
  io.to(room.code).emit("new_question", {
    index: room.questionIndex, total: room.questions.length,
    question: { q: q.q, a: q.a, endsAt: room.endsAt }
  });
  broadcastRoom(room);
  clearTimeout(room.timer);
  room.timer = setTimeout(() => {
    if (room.status === "playing") nextQuestion(room);
  }, room.questionSeconds * 1000);
}

io.on("connection", socket => {
  socket.on("create_room", ({ name, avatar }) => {
    name = String(name || "").trim().slice(0, 24);
    if (!name) return socket.emit("error_message", "Avval ismingizni kiriting.");
    let code;
    do { code = roomCode(); } while (rooms.has(code));
    const room = {
      code, hostId: socket.id, status: "lobby", players: new Map(),
      questionIndex: -1, questions: questionBank.map(q => ({...q, a:[...q.a]})),
      questionSeconds: 15, endsAt: null, timer: null
    };
    rooms.set(code, room);
    addPlayer(socket, room, name, avatar);
    socket.emit("room_created", { code });
    broadcastRoom(room);
  });

  socket.on("join_room", ({ code, name, avatar }) => {
    code = String(code || "").trim().toUpperCase();
    name = String(name || "").trim().slice(0, 24);
    const room = rooms.get(code);
    if (!name) return socket.emit("error_message", "Avval ismingizni kiriting.");
    if (!room) return socket.emit("error_message", "Bunday xona topilmadi. Kodni tekshiring.");
    if (room.status !== "lobby") return socket.emit("error_message", "Bu xona o‘yinni boshlab bo‘lgan.");
    if (room.players.size >= MAX_PLAYERS) return socket.emit("error_message", "Xona to‘la: maksimal 40 o‘yinchi.");
    addPlayer(socket, room, name, avatar);
    broadcastRoom(room);
  });

  socket.on("start_game", () => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id) return socket.emit("error_message", "Faqat xona egasi o‘yinni boshlashi mumkin.");
    if (room.status !== "lobby") return;
    room.status = "playing";
    room.questionIndex = -1;
    nextQuestion(room);
  });

  socket.on("submit_answer", ({ answerIndex }) => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.status !== "playing") return;
    const p = room.players.get(socket.id);
    const q = room.questions[room.questionIndex];
    if (!p || p.answered || !q || Date.now() > room.endsAt) return;
    p.answered = true;
    const isCorrect = Number(answerIndex) === q.correct;
    if (isCorrect) {
      p.correct++;
      const remaining = Math.max(0, room.endsAt - Date.now());
      p.score += 100 + Math.floor(remaining / 1000) * 2;
    }
    socket.emit("answer_result", { correct: isCorrect, correctIndex: q.correct, score: p.score });
    broadcastRoom(room);
    if ([...room.players.values()].every(player => player.answered)) {
      clearTimeout(room.timer);
      room.timer = setTimeout(() => { if (room.status === "playing") nextQuestion(room); }, 1200);
    }
  });

  socket.on("leave_room", () => removePlayer(socket));
  socket.on("disconnect", () => removePlayer(socket));
});

function addPlayer(socket, room, name, avatar) {
  const colors = ["#39d5ff", "#b58cff", "#ffd166", "#ff6b9a", "#65e6a5", "#ff9f43"];
  room.players.set(socket.id, {
    id: socket.id, name, avatar: colors.includes(avatar) ? avatar : colors[crypto.randomInt(colors.length)],
    score: 0, correct: 0, answered: false
  });
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.emit("joined_room", { code: room.code, isHost: room.hostId === socket.id });
}
function findRoomBySocket(id) {
  for (const room of rooms.values()) if (room.players.has(id)) return room;
  return null;
}
function removePlayer(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.data.roomCode = null;
  if (!room) return;
  room.players.delete(socket.id);
  socket.leave(code);
  if (room.players.size === 0) {
    clearTimeout(room.timer);
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
  broadcastRoom(room);
}
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`EDUVERSE 3D server running on port ${PORT}`));
