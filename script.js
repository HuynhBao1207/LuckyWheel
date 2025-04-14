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
