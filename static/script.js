// 데이터는 서버에서 불러옴
let cardList = [];

async function loadCards() {
  const res = await fetch("/api/cards");
  cardList = await res.json();
  //renderProbability();
  renderTeamOptions();
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
const teamMembersList = document.getElementById("team-members-list");

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
  const selectedTeam = document.getElementById("team-filter")?.value;
  let pool = cardList;

  // 팀이 선택되어 있으면 해당 팀 카드 중 체크된 멤버만 필터링
  if (selectedTeam) {
    const checkedMemberCheckboxes = teamMembersList.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedMemberCheckboxes.length === 0) {
      alert("선택한 팀에서 체크된 멤버가 없습니다.");
      return null;
    }
    const checkedNames = Array.from(checkedMemberCheckboxes).map(cb => cb.value);
    pool = cardList.filter(c => c.team === selectedTeam && checkedNames.includes(c.name));
  }

  if (pool.length === 0) {
    alert("선택한 팀에 카드가 없습니다.");
    return null;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// UI 반영
function applyResult(cardResult) {
    resultIcon.textContent = cardResult.icon;
    resultName.textContent = cardResult.name;
    resultGrade.textContent = cardResult.grade;
    recentBadge.className = "badge normal";
    recentBadge.textContent = "CARD";
}

function addHistory(cardResult) {
  const div = document.createElement("div");
  div.className = "item";
  div.title = cardResult.name;

  // 아이콘
  const icon = document.createElement("div");
  icon.textContent = cardResult.icon;
  icon.style.fontSize = "20px";   // 아이콘 크게

  // 이름
  const name = document.createElement("div");
  name.textContent = cardResult.name;
  name.style.fontSize = "12px";   // 이름 작게

  // 조립
  div.appendChild(icon);
  div.appendChild(name);

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
  if (!picked) {
    locked = false;
    return;
  }
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
      grade: document.getElementById("grade").value,
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
      loadCards();
      addCardForm.reset();
    } else {
      alert("카드 추가에 실패했습니다.");
    }
  });
}
// 팀 필터 옵션 렌더링
function renderTeamOptions() {
  const select = document.getElementById("team-filter");
  if (!select) return;
  // 기존 옵션 제거
  select.innerHTML = "";
  // "전체" 기본 옵션 추가
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "전체";
  select.appendChild(defaultOption);
  // 유니크 팀 목록 추출
  const teams = Array.from(new Set(cardList.map(card => card.team).filter(Boolean)));
  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    select.appendChild(option);
  });

  // team-filter change 이벤트 등록
  select.addEventListener("change", () => {
    renderTeamMembers(select.value);
  });

  // 초기 렌더링
  renderTeamMembers(select.value);
}

// 팀 멤버 체크박스 렌더링
function renderTeamMembers(team) {
  if (!teamMembersList) return;
  teamMembersList.innerHTML = "";
  if (!team) return;
  const members = cardList.filter(card => card.team === team);
  members.forEach(member => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.cursor = "pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = member.name;
    checkbox.checked = true;

    const iconSpan = document.createElement("span");
    iconSpan.textContent = member.icon;
    iconSpan.style.marginRight = "4px";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = member.name;

    label.appendChild(checkbox);
    label.appendChild(iconSpan);
    label.appendChild(nameSpan);

    teamMembersList.appendChild(label);
  });
}