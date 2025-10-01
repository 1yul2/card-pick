// 데이터는 서버에서 불러옴
let cardList = [];

async function loadCards() {
  const res = await fetch("/api/cards");
  cardList = await res.json();
  renderProbability();
}

loadCards();

const gradeNames = { normal: "일반", rare: "레어", epic: "에픽", legend: "레전드" };
const badgeClasses = { normal: "normal", rare: "rare", epic: "epic", legend: "legend" };

// 요소
const card = document.getElementById("card");
const btnDraw = document.getElementById("btn-draw");
const btnReset = document.getElementById("btn-reset");
const resultIcon = document.getElementById("result-icon");
const resultName = document.getElementById("result-name");
const resultGrade = document.getElementById("result-grade");
const historyArea = document.getElementById("history");
const probabilityBox = document.getElementById("probability");
const recentBadge = document.getElementById("badge-recent");

// 확률표
function renderProbability() {
  probabilityBox.innerHTML = "";
  const equalProb = (100 / cardList.length).toFixed(2);
  cardList.forEach(({name}) => {
      const span = document.createElement("span");
      span.className = "chip";
      span.textContent = `${name} ${equalProb}%`;
      probabilityBox.appendChild(span);
    });
}

// 가중치 뽑기
function pickCard() {
  const idx = Math.floor(Math.random() * cardList.length);
  return cardList[idx];
}

// UI 반영
function applyResult(cardResult) {
    resultIcon.textContent = cardResult.icon;
    resultName.textContent = cardResult.name;
    resultGrade.textContent = cardResult.name; // 팀 대신 이름 보여줌
    recentBadge.className = "badge normal";
    recentBadge.textContent = "CARD";
}

function addHistory(cardResult) {
  const div = document.createElement("div");
  div.className = "item";
  div.title = `${cardResult.name}`;
  div.textContent = `${cardResult.icon} ${cardResult.name}`;
  historyArea.prepend(div);
}

// flip
let locked = false;
async function flipAndShowResult() {
  if (locked) return;
  locked = true;
  card.classList.remove("flip");
  await delay(50);
  const picked = pickCard();
  applyResult(picked);
  addHistory(picked);
  await delay(80);
  card.classList.add("flip");  // 컨테이너만 회전
  await delay(300);
  locked = false;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

btnDraw.addEventListener("click", flipAndShowResult);
card.addEventListener("click", flipAndShowResult);

btnReset.addEventListener("click", () => {
  historyArea.innerHTML = "";
  card.classList.remove("flip");
  resultIcon.textContent = "✨";
  resultName.textContent = "—";
  resultGrade.textContent = "—";
  recentBadge.className = "badge normal";
  recentBadge.textContent = "READY";
});

// 살짝 튕김
setTimeout(() => {
  card.style.transform = "rotateY(-8deg) rotateX(2deg)";
  setTimeout(() => card.style.transform = "", 300);
}, 300);

// 카드 추가 폼 이벤트
const addCardForm = document.getElementById("add-card-form");
if (addCardForm) {
  addCardForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("name").value,
      team: document.getElementById("team").value,
      icon: document.getElementById("icon").value,
      wins: 0,
      losses: 0,
    };

    const res = await fetch("/api/cards/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("카드가 추가되었습니다!");
      loadCards(); // 카드 리스트 다시 불러오기
      addCardForm.reset();
    } else {
      alert("카드 추가에 실패했습니다.");
    }
  });
}