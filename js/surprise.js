// surprise.js - gerencia caixas surpresa com efeito dopamina
let surpriseBoxes = []; // array de caixas fechadas

function renderSurpriseBoxes() {
  const container = document.getElementById("surpriseBoxContainer");
  if(surpriseBoxes.length === 0) {
    container.innerHTML = `<div class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-400">
      <i class="fas fa-box-open text-4xl mb-2"></i>
      <p>Nenhuma caixa disponível agora.<br>Complete um ciclo de foco!</p>
    </div>`;
    return;
  }
  container.innerHTML = "";
  surpriseBoxes.forEach((box, idx) => {
    const boxDiv = document.createElement("div");
    boxDiv.className = "surprise-box bg-white p-4 rounded-xl shadow-md text-center cursor-pointer hover:shadow-lg transition";
    boxDiv.innerHTML = `
      <i class="fas fa-gift text-3xl text-amber-500 mb-2"></i>
      <p class="font-bold">Caixa Surpresa #${idx+1}</p>
      <span class="text-xs text-gray-400">clique para abrir ➕</span>
    `;
    boxDiv.onclick = () => openSurpriseBox(idx);
    container.appendChild(boxDiv);
  });
}

function openSurpriseBox(index) {
  const rewards = [
    { pontos: 15, msg: "🎁 +15 XP! Continue assim!" },
    { pontos: 25, msg: "✨ BOOM! +25 XP extra!" },
    { pontos: 5, msg: "🍀 +5 XP. Pequeno progresso é progresso." },
    { pontos: 50, msg: "💎 JACKPOT! +50 XP! Você está on fire!" },
    { pontos: 10, msg: "📚 Foco recompensado! +10 XP" },
  ];
  const rand = rewards[Math.floor(Math.random() * rewards.length)];
  // Adiciona XP via função global do main
  if(window.addXP) window.addXP(rand.pontos);
  alert(`✨ ${rand.msg} ✨\n${rand.pontos} pontos adicionados!`);
  // Remove a caixa aberta
  surpriseBoxes.splice(index, 1);
  renderSurpriseBoxes();
  // Efeito visual de confete (simulado)
  document.body.style.transform = "scale(1.01)";
  setTimeout(() => document.body.style.transform = "", 150);
}

function unlockSurpriseBox() {
  surpriseBoxes.push({ type: "normal" });
  renderSurpriseBoxes();
  // Feedback sonoro mental (apenas visual)
  const containerDiv = document.getElementById("surpriseBoxContainer");
  containerDiv.style.opacity = "0.7";
  setTimeout(() => containerDiv.style.opacity = "1", 200);
}

// exponha funções para main.js
window.unlockSurpriseBox = unlockSurpriseBox;
window.addSurpriseBox = (force) => { if(force) unlockSurpriseBox(); };
