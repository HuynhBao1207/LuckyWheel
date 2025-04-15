// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Phục vụ file tĩnh từ thư mục lucky-wheel-frontend
app.use(express.static("lucky-wheel-frontend"));

let prizes = []; // Danh sách phần thưởng được lưu trên server

// Sự kiện khi một client kết nối tới server
io.on("connection", (socket) => {
  console.log("✅ Một người chơi đã kết nối");

  // Gửi danh sách phần thưởng hiện tại về client khi nó kết nối
  socket.emit("update_prizes", prizes);

  // Nhận kết quả quay từ 1 client và gửi lại cho tất cả các client
  socket.on("spin", (result) => {
    console.log("🎯 Kết quả quay:", result);
    socket.broadcast.emit("spin_result", result); // Chỉ phát kết quả cho các client còn lại
  });
  

  // Khi client gửi danh sách phần thưởng mới
  socket.on("update_prizes", (updatedPrizes) => {
    prizes = updatedPrizes; // Cập nhật danh sách trên server
    console.log("📦 Danh sách phần thưởng cập nhật:", prizes);

    // Gửi lại danh sách cho tất cả client
    io.emit("update_prizes", prizes);
  });

  // Log khi client ngắt kết nối
  socket.on("disconnect", () => {
    console.log("❌ Một người chơi đã rời đi");
  });
});

// Khởi động server
server.listen(3000, () => {
  console.log("🚀 Server đang chạy tại: http://localhost:3000");
});
