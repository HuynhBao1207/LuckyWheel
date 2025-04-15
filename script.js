const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const prizeInput = document.getElementById("prizeInput");
const prizeList = document.getElementById("prizeList");
const resultList = document.getElementById("resultList");

let prizes = [];
let prizeColors = {};
let currentAngle = 0;

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
    updatePrizeList();
    drawWheel();
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
  prizes.splice(index, 1);
  delete prizeColors[removedPrize];
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
  if (prizes.length === 0) return;

  const randomIndex = Math.floor(Math.random() * prizes.length);
  const arcSize = (2 * Math.PI) / prizes.length;
  const targetAngle = (3 * Math.PI) / 2 - (randomIndex * arcSize + arcSize / 2);
  const extraSpins = 10;
  const finalAngle = targetAngle + extraSpins * 2 * Math.PI;
  let startTime = null;
  const duration = 3000;
  const initialAngle = currentAngle % (2 * Math.PI);

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
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
      addResult(prizes[randomIndex]);
    }
  }

  requestAnimationFrame(animate);
}

function addResult(result) {
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

  fetch("http://localhost:8080/save_result.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prize: result }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Server response:", data))
    .catch((error) => console.error("Lỗi kết nối:", error));

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
      try {
        soundSpin.currentTime = 0;
        soundSpin.play();
      } catch (err) {
        console.warn("Không thể phát âm thanh (spin):", err);
      }
      spinWheel();
    }
  });

  document.getElementById("popupCloseBtn").addEventListener("click", () => {
    document.getElementById("popupResult").classList.remove("show");
  });
};
