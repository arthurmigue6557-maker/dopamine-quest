/* custom.css - Minimalismo funcional e coesão visual */
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  scroll-behavior: smooth;
}

/* melhoria de acessibilidade e foco */
button:focus-visible, a:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

/* animação das caixas surpresa */
@keyframes bounceTiny {
  0%,100%{ transform: translateY(0); }
  50%{ transform: translateY(-6px); }
}
.surprise-unlocked {
  animation: bounceTiny 0.3s ease;
  background: linear-gradient(135deg, #FFD966, #FFB347);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2);
}

/* responsividade mobile extra */
@media (max-width: 640px) {
  .card-glass {
    border-radius: 1.5rem;
    padding: 1rem;
  }
  #timer {
    font-size: 3rem;
  }
}
