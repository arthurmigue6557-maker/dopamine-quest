// main.js - controle de timer, metas, progresso, pontos e nível
let timerInterval = null;
let timeLeft = 25 * 60; // segundos
let isRunning = false;
let currentGoal = "";
let userXP = 0;
let userLevel = 1;
let dailyCompletions = 0;
let streak = 0;

// Carregar dados do localStorage
function loadGameData() {
  const savedXP = localStorage.getItem("dq_xp");
  const savedLevel = localStorage.getItem("dq_level");
  const savedStreak = localStorage.getItem("dq_streak");
  const savedDaily = localStorage.getItem("dq_daily");
  const lastDate = localStorage.getItem("dq_lastDate");
  const today = new Date().toDateString();
  
  if(savedXP) userXP = parseInt(savedXP);
  if(savedLevel) userLevel = parseInt(savedLevel);
  if(savedStreak) streak = parseInt(savedStreak);
  if(savedDaily) dailyCompletions = parseInt(savedDaily);
  
  if(lastDate !== today) {
    // reset diário mas mantém streak se tiver completado ontem
    const completedYesterday = (dailyCompletions > 0);
    if(!completedYesterday) streak = 0;
    dailyCompletions = 0;
    localStorage.setItem("dq_lastDate", today);
  }
  updateUIStats();
}

function saveGame() {
  localStorage.setItem("dq_xp", userXP);
  localStorage.setItem("dq_level", userLevel);
  localStorage.setItem("dq_streak", streak);
  localStorage.setItem("dq_daily", dailyCompletions);
}

function updateUIStats() {
  document.getElementById("pointsDisplay").innerText = `${userXP} pts`;
  document.getElementById("levelDisplay").innerHTML = `Nível ${userLevel}`;
  document.getElementById("streakCount").innerText = streak;
  const percent = (dailyCompletions / 5) * 100;
  document.getElementById("dailyProgressBar").style.width = `${Math.min(100, percent)}%`;
  document.getElementById("dailyProgressPercent").innerText = `${Math.min(100, Math.floor(percent))}%`;
}

function addXP(amount) {
  userXP += amount;
  let newLevel = 1 + Math.floor(userXP / 100);
  if(newLevel > userLevel) {
    userLevel = newLevel;
    // Surpresa de up de nível
    alert(`🎉 UP! Você atingiu o nível ${userLevel}! +1 caixa extra!`);
    if(window.addSurpriseBox) window.addSurpriseBox(true);
  }
  saveGame();
  updateUIStats();
}

function completeCycle() {
  if(!currentGoal) {
    alert("Defina uma meta primeiro!");
    return false;
  }
  if(!isRunning && timeLeft === 0) {
    // ciclo concluído com sucesso
    addXP(10);
    dailyCompletions++;
    if(dailyCompletions === 5) streak++;
    saveGame();
    updateUIStats();
    // Disparar caixa surpresa
    if(window.unlockSurpriseBox) window.unlockSurpriseBox();
    // resetar timer visual
    resetTimerUI();
    return true;
  } else {
    alert("Finalize o timer primeiro (deixe chegar a 0:00)");
    return false;
  }
}

// Timer lógica
function updateTimerDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  document.getElementById("timer").innerText = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  if(timeLeft === 0 && isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    completeCycle();
  }
}

function startTimer() {
  if(timerInterval) clearInterval(timerInterval);
  isRunning = true;
  timerInterval = setInterval(() => {
    if(timeLeft > 0 && isRunning) {
      timeLeft--;
      updateTimerDisplay();
    } else if(timeLeft === 0) {
      clearInterval(timerInterval);
      isRunning = false;
      updateTimerDisplay();
      completeCycle();
    }
  }, 1000);
}

function pauseTimer() { isRunning = false; }
function resetTimerUI() {
  isRunning = false;
  clearInterval(timerInterval);
  const minutes = parseInt(document.getElementById("focusSlider").value);
  timeLeft = minutes * 60;
  updateTimerDisplay();
}

// Eventos
document.getElementById("setGoalBtn").onclick = () => {
  const goal = document.getElementById("goalInput").value.trim();
  if(goal) {
    currentGoal = goal;
    document.getElementById("goalText").innerText = goal;
    document.getElementById("currentGoalDisplay").classList.remove("hidden");
  } else alert("Escreva uma meta poderosa!");
};
document.getElementById("startTimerBtn").onclick = startTimer;
document.getElementById("pauseTimerBtn").onclick = pauseTimer;
document.getElementById("resetTimerBtn").onclick = resetTimerUI;
document.getElementById("focusSlider").oninput = (e) => {
  if(!isRunning) {
    timeLeft = parseInt(e.target.value) * 60;
    updateTimerDisplay();
  }
};
document.getElementById("resetGameBtn").onclick = () => {
  if(confirm("Zerar todo progresso? Seu vício será reiniciado.")) {
    localStorage.clear();
    location.reload();
  }
};

loadGameData();
resetTimerUI();
