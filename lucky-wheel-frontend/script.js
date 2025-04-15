// Kết nối tới server qua Socket.IO
const socket = io();

// Biến trạng thái để tránh quay nhiều lần
let spinning = false;

// Nhận kết quả quay từ server
socket.on("spin_result", (result) => {
  console.log("Received spin result:", result); // Thêm log để kiểm tra
  if (!spinning) {
    spinWheelWithResult(result); // Quay vòng với kết quả nhận được từ server
  }
});

// Nhận danh sách phần thưởng mới từ server
socket.on("update_prizes", (updatedPrizes) => {
  prizes = updatedPrizes;
  updatePrizeList();
  drawWheel();
});

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const prizeInput = document.getElementById("prizeInput");
const prizeList = document.getElementById("prizeList");
const resultList = document.getElementById("resultList");

let prizes = [];  // Mảng chứa các phần thưởng
let prizeColors = {};  // Lưu màu sắc của từng phần thưởng
let currentAngle = 0;  // Góc quay hiện tại của bánh xe

// Xử lý sự kiện khi nhấn Enter để thêm phần thưởng
function handleEnter(event) {
  if (event.key === "Enter") {
    addPrize();
  }
}

// Thêm phần thưởng vào danh sách
function addPrize() {
  const prize = prizeInput.value.trim();
  if (prize && prizes.length < 20 && !prizes.includes(prize)) {
    prizes.push(prize);
    if (!prizeColors[prize]) {
      prizeColors[prize] = generateUniqueColor();
    }
    prizeInput.value = "";

    // Gửi danh sách phần thưởng cập nhật lên server
    socket.emit("update_prizes", prizes);

    updatePrizeList();
    drawWheel();
  }
}

// Cập nhật danh sách phần thưởng hiển thị trên giao diện
function updatePrizeList() {
  prizeList.innerHTML = "";
  prizes.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item} 
      <button class="delete-btn" onclick="removePrize(${index})">Xóa</button>`;
    prizeList.appendChild(li);
  });
}

// Xóa phần thưởng khỏi danh sách
function removePrize(index) {
  const removedPrize = prizes[index];
  prizes.splice(index, 1);
  delete prizeColors[removedPrize];

  // Gửi danh sách phần thưởng cập nhật lên server
  socket.emit("update_prizes", prizes);

  updatePrizeList();
  drawWheel();
}

// Vẽ bánh xe quay với danh sách phần thưởng hiện tại
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const arcSize = (2 * Math.PI) / prizes.length;

  prizes.forEach((prize, i) => {
    const angle = i * arcSize;
    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, angle, angle + arcSize);
    ctx.fillStyle = prizeColors[prize] || "#ccc";  // Màu sắc cho phần thưởng
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.stroke();

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(angle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.fillText(prize, 240, 10);
    ctx.restore();
  });

  // Vẽ nút quay giữa bánh xe
  ctx.beginPath();
  ctx.arc(250, 250, 40, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Quay", 250, 250);
}

// Quay bánh xe và phát kết quả
function spinWheel() {
  if (spinning) return;  // Kiểm tra nếu đang quay, tránh quay lại

  if (prizes.length < 2) {
    document.getElementById("notification").textContent = "Vui lòng nhập 2 phần thưởng trở lên!";
    document.getElementById("notification").style.display = "block";
    return;
  }

  document.getElementById("notification").style.display = "none";
  spinning = true;  // Đánh dấu là đang quay

  // Chọn kết quả cục bộ
  const randomIndex = Math.floor(Math.random() * prizes.length);
  const result = prizes[randomIndex];

  // Quay tại local và phát kết quả ra toàn bộ
  spinWheelWithResult(result);

  // Gửi kết quả lên server để đồng bộ
  socket.emit("spin", result);
}

// Quay bánh xe với kết quả đã chọn
function spinWheelWithResult(result) {
  const index = prizes.indexOf(result);
  if (index === -1) {
    console.error("Phần thưởng không tồn tại trong danh sách!");
    return;
  }

  const arcSize = (2 * Math.PI) / prizes.length;
  const targetAngle = (3 * Math.PI) / 2 - (index * arcSize + arcSize / 2);
  const extraSpins = 10;
  const finalAngle = targetAngle + extraSpins * 2 * Math.PI;
  let startTime = null;
  const duration = 3000;
  const initialAngle = currentAngle % (2 * Math.PI);

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  try {
    soundSpin.currentTime = 0;
    soundSpin.play();
  } catch (err) {
    console.warn("Không thể phát âm thanh (spin):", err);
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    currentAngle = initialAngle + easedProgress * (finalAngle - initialAngle);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(currentAngle);
    ctx.translate(-250, -250);
    drawWheel();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      addResult(result); // Hiển thị kết quả sau khi vòng quay dừng
    }
  }

  requestAnimationFrame(animate);
}

// Hiển thị kết quả quay
function addResult(result) {
  spinning = false;  // Đánh dấu quay xong

  try {
    soundWin.currentTime = 0;
    soundWin.play();
  } catch (err) {
    console.warn("Không thể phát âm thanh (win):", err);
  }

  const timestamp = new Date().toLocaleString("vi-VN");
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#ff0", "#f0f", "#0ff", "#0f0", "#f00", "#00f"],
    scalar: 1.2,
  });

  const li = document.createElement("li");
  li.textContent = `Kết quả: ${result} - Thời gian: ${timestamp}`;
  resultList.appendChild(li);

  // Lưu kết quả lên server (nếu cần)
  fetch("http://localhost:8080/save_result.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prize: result }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Server response:", data))
    .catch((error) => console.error("Lỗi kết nối:", error));

  // Hiển thị popup với kết quả
  const popup = document.getElementById("popupResult");
  const popupContent = document.getElementById("popupContent");
  const btnOk = document.getElementById("popupCloseBtn");
  const btnRemove = document.getElementById("popupRemoveBtn");

  popupContent.textContent = `🎉 Bạn đã trúng: ${result}! 🎉`;
  popup.classList.add("show");

  btnOk.onclick = () => {
    popup.classList.remove("show");
  };

  btnRemove.onclick = () => {
    const index = prizes.indexOf(result);
    if (index !== -1) {
      prizes.splice(index, 1);
      updatePrizeList();
      drawWheel();
    }
    popup.classList.remove("show");
  };
}

// Hàm tạo màu sắc ngẫu nhiên cho phần thưởng
function generateUniqueColor() {
  const usedColors = Object.values(prizeColors);
  let color;
  do {
    const hue = Math.floor(Math.random() * 360);
    color = `hsl(${hue}, 90%, 60%)`;
  } while (usedColors.includes(color));
  return color;
}

// Khởi tạo âm thanh
const soundSpin = document.getElementById("sound-spin");
const soundWin = document.getElementById("sound-win");

// Đặt sự kiện cho canvas
window.onload = () => {
  prizes = [];
  updatePrizeList();
  drawWheel();

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - 250;
    const dy = y - 250;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 40) {
      spinWheel();
    }
  });

  document.getElementById("popupCloseBtn").addEventListener("click", () => {
    document.getElementById("popupResult").classList.remove("show");
  });
};
