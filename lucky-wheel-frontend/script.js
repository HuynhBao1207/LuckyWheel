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

let prizes = [];
let prizeColors = {};
let currentAngle = 0;

// Xử lý sự kiện khi nhấn Enter để thêm phần thưởng
function handleEnter(event) {
  if (event.key === "Enter") {
    addPrize();
  }
}

function addPrize() {
  const prize = prizeInput.value.trim();
  if (prize && prizes.length < 20 && !prizes.includes(prize)) {
    prizes.push(prize);
    if (!prizeColors[prize]) {
      prizeColors[prize] = generateUniqueColor();
    }
    prizeInput.value = "";
    socket.emit("update_prizes", prizes);
    updatePrizeList();
    drawWheel();
    savePrizesToLocalStorage();
  }
}

function updatePrizeList() {
  prizeList.innerHTML = "";
  prizes.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item} 
      <button class="delete-btn" onclick="removePrize(${index})">Xóa</button>`;
    prizeList.appendChild(li);
  });
}

function removePrize(index) {
  const removedPrize = prizes[index];
  if (confirm(`Bạn có chắc muốn xóa phần thưởng "${removedPrize}" không?`)) {
    prizes.splice(index, 1);
    delete prizeColors[removedPrize];
    socket.emit("update_prizes", prizes);
    updatePrizeList();
    drawWheel();
    savePrizesToLocalStorage(); // lưu lại danh sách mới
  }
}
function savePrizesToLocalStorage() {
  localStorage.setItem("wheelPrizes", JSON.stringify(prizes));
}

function loadPrizesFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("wheelPrizes") || "[]");
  prizes = saved;
  updatePrizeList();
  drawWheel();
}


function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const arcSize = (2 * Math.PI) / prizes.length;

  prizes.forEach((prize, i) => {
    const angle = i * arcSize;
    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, angle, angle + arcSize);
    ctx.fillStyle = prizeColors[prize] || "#ccc";
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

function spinWheel() {
  if (spinning) return;
  if (prizes.length < 2) {
    alert("Vui lòng thêm ít nhất 2 phần thưởng để quay!");
    return;
  }

  spinning = true;

  const randomIndex = Math.floor(Math.random() * prizes.length);
  const result = prizes[randomIndex];

  spinWheelWithResult(result);
  socket.emit("spin", result);
}

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
      addResult(result);
    }
  }

  requestAnimationFrame(animate);
}

function addResult(result) {
  spinning = false;

  try {
    soundWin.currentTime = 0;
    soundWin.play();
  } catch (err) {
    console.warn("Không thể phát âm thanh (win):", err);
  }

  const timestamp = new Date().toLocaleString("vi-VN");
  if (!result || result === "Không có phần thưởng") {
    result = "Không có phần thưởng";
  }

  const resultData = {
    result: result,
    timestamp: timestamp
  };

  let results = JSON.parse(localStorage.getItem("spinResults") || "[]");
  results.push(resultData);
  localStorage.setItem("spinResults", JSON.stringify(results));

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

function generateUniqueColor() {
  const usedColors = Object.values(prizeColors);
  let color;
  do {
    const hue = Math.floor(Math.random() * 360);
    color = `hsl(${hue}, 90%, 60%)`;
  } while (usedColors.includes(color));
  return color;
}

const soundSpin = document.getElementById("sound-spin");
const soundWin = document.getElementById("sound-win");

window.onload = () => {
  loadPrizesFromLocalStorage();
  updatePrizeList();
  drawWheel();

  const savedResults = JSON.parse(localStorage.getItem("spinResults") || "[]");
  savedResults.forEach(({ result, timestamp }) => {
    const li = document.createElement("li");
    li.textContent = `Kết quả: ${result} - Thời gian: ${timestamp}`;
    resultList.appendChild(li);
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    const storedResults = JSON.parse(localStorage.getItem("spinResults") || "[]");

    if (storedResults.length === 0) {
      alert("Không có lịch sử để xóa!");
      return;
    }
    if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử kết quả?")) {
      localStorage.removeItem("spinResults");
      resultList.innerHTML = "";
    }
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const storedResults = JSON.parse(localStorage.getItem("spinResults") || "[]");
    if (storedResults.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const data = storedResults.map((item, index) => ({
      STT: index + 1,
      "Phần thưởng": item.result || "Không có phần thưởng",
      "Thời gian": item.timestamp || "Không có thời gian"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kết Quả");

    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `ket-qua-vong-quay-${now}.xlsx`;
    XLSX.writeFile(workbook, filename);

    // 🎉 Hiển thị alert sau khi lưu
    alert(`✅ Đã lưu kết quả ra file: ${filename}`);

  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;  // Xác định điểm nhấp chuột theo tọa độ canvas
    const y = e.clientY - rect.top;
  
    const centerX = canvas.width / 2;  // Tính toán tọa độ trung tâm
    const centerY = canvas.height / 2;
    const radius = 40;  // Bán kính của nút quay (giữ nguyên)
  
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance <= radius) {  // Kiểm tra xem có click vào vùng nút quay không
      spinWheel();  // Nếu có thì gọi hàm quay
    }
  });
  

  document.getElementById("popupCloseBtn").addEventListener("click", () => {
    document.getElementById("popupResult").classList.remove("show");
  });
};
