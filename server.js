const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Route giao diện chọn chế độ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "GAMEMODE.html"));
});

// Phục vụ frontend cho từng chế độ
app.use("/multi", express.static(path.join(__dirname, "lucky-wheel-frontend")));
app.use("/single", express.static(path.join(__dirname, "single-player")));

// Danh sách phần thưởng dùng chung (nếu muốn tách riêng, có thể khai báo riêng cho mỗi chế độ)
let prizes = [];

// 🔁 MULTI-PLAYER LOGIC
const multiNamespace = io.of("/multi");
multiNamespace.on("connection", (socket) => {
  console.log("✅ Một người chơi (multi) đã kết nối");

  socket.emit("update_prizes", prizes);

  socket.on("spin", (result) => {
    console.log("🎯 [Multi] Kết quả quay:", result);
    socket.broadcast.emit("spin_result", result); // Gửi cho người chơi khác
  });

  socket.on("update_prizes", (updatedPrizes) => {
    prizes = updatedPrizes;
    console.log("📦 [Multi] Danh sách phần thưởng cập nhật:", prizes);
    multiNamespace.emit("update_prizes", prizes);
  });

  socket.on("disconnect", () => {
    console.log("❌ Một người chơi (multi) đã rời đi");
  });
});

// 🎯 SINGLE-PLAYER LOGIC
const singleNamespace = io.of("/single");
singleNamespace.on("connection", (socket) => {
  console.log(`✅ Người chơi (single) ${socket.id} đã kết nối`);

  socket.emit("update_prizes", prizes);

  socket.on("spin", (result) => {
    console.log(`🎯 [Single] Kết quả quay của ${socket.id}:`, result);
    socket.emit("spin_result", result); // Gửi riêng cho người chơi đó
  });

  socket.on("update_prizes", (updatedPrizes) => {
    prizes = updatedPrizes;
    console.log("📦 [Single] Danh sách phần thưởng cập nhật:", prizes);
    socket.emit("update_prizes", prizes);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Người chơi (single) ${socket.id} đã rời đi`);
  });
});

// Khởi động server
server.listen(3000, () => {
  console.log("🚀 Server đang chạy tại: http://localhost:3000");
});

// Nếu người dùng truy cập sai route
app.use((req, res, next) => {
  res.status(404).send("⛔ Trang không tồn tại hoặc sai đường dẫn!");
});
