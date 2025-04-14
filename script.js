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
