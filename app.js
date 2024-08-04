const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniqesocket) => {
  console.log("connected");

  if (!players.white) {
    players.white = uniqesocket.id;
    uniqesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqesocket.id;
    uniqesocket.emit("playerRole", "b");
  } else {
    uniqesocket.emit("spectatorRole");
  }

  uniqesocket.on("disconnect", () => {
    if (uniqesocket.id === players.white) {
      delete players.white;
    } else if (uniqesocket.id === players.black) {
      delete players.black;
    }
  });

  uniqesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniqesocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.error("Error handling move: ", error);
      uniqesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
