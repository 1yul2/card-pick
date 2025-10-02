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

// Admin-only section for deleting and editing cards

async function deleteCard(id) {
  if (!confirm("정말 이 카드를 삭제하시겠습니까?")) return;
  try {
    const res = await fetch(`/api/cards/delete/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      alert("카드가 삭제되었습니다.");
      await loadCards();
      renderAdminCards();
    } else {
      const err = await res.json().catch(() => ({}));
      console.error("Delete failed", res.status, err);
      alert("카드 삭제에 실패했습니다. (" + res.status + ")");
    }
  } catch (error) {
    console.error(error);
    alert("오류가 발생했습니다.");
  }
}

async function updateCard(id, data) {
  try {
    const res = await fetch(`/api/cards/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        team: data.team,
        icon: data.icon,
        grade: data.grade,
        wins: data.wins,
        losses: data.losses
      }),
    });
    if (res.ok) {
      alert("카드가 업데이트되었습니다.");
      await loadCards();
      renderAdminCards();
    } else {
      const err = await res.json().catch(() => ({}));
      console.error("Update failed", res.status, err);
      alert("카드 업데이트에 실패했습니다. (" + res.status + ")");
    }
  } catch (error) {
    console.error(error);
    alert("오류가 발생했습니다.");
  }
}

async function renderAdminCards() {
  const adminList = document.getElementById("admin-cards-list");
  if (!adminList) return;
  adminList.innerHTML = "";

  try {
    const res = await fetch("/api/cards");
    if (!res.ok) {
      adminList.textContent = "카드 목록을 불러오는데 실패했습니다.";
      return;
    }
    const cards = await res.json();

    cards.forEach(card => {
      const div = document.createElement("div");
      div.className = "admin-card-item";
      div.style.border = "1px solid #ccc";
      div.style.padding = "8px";
      div.style.marginBottom = "8px";

      const info = document.createElement("div");
      info.textContent = `[${card.id}] ${card.icon} ${card.name} (${card.team}) - ${card.grade}`;
      info.style.marginBottom = "4px";

      const btnDelete = document.createElement("button");
      btnDelete.textContent = "삭제";
      btnDelete.style.marginRight = "8px";
      btnDelete.addEventListener("click", () => deleteCard(card.id));

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "수정";
      btnEdit.addEventListener("click", () => {
        // 간단한 prompt를 이용한 수정 예시
        const newName = prompt("이름을 입력하세요:", card.name);
        if (newName === null) return;
        const newTeam = prompt("팀을 입력하세요:", card.team);
        if (newTeam === null) return;
        const newIcon = prompt("아이콘을 입력하세요:", card.icon);
        if (newIcon === null) return;
        const newGrade = prompt("등급을 입력하세요 (normal, rare, epic, legend):", card.grade);
        if (newGrade === null) return;

        const updatedData = {
          name: newName.trim(),
          team: newTeam.trim(),
          icon: newIcon.trim(),
          grade: newGrade.trim(),
          wins: card.wins || 0,
          losses: card.losses || 0,
        };
        updateCard(card.id, updatedData);
      });

      div.appendChild(info);
      div.appendChild(btnDelete);
      div.appendChild(btnEdit);

      adminList.appendChild(div);
    });
  } catch (error) {
    adminList.textContent = "오류가 발생했습니다.";
  }
}

if (document.getElementById("admin-cards-list")) {
  renderAdminCards();
}