import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const rankingEl = document.querySelector("#ranking");
const quizEl = document.querySelector("#quiz");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function loadRanking() {
  const data = await api("/api/ranking");
  rankingEl.innerHTML = "";
  data.ranking.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = `${s.username} \u00b7 ${s.category} \u00b7 ${s.points} pts`;
    rankingEl.append(li);
  });
}
async function refresh() {
  await loadRanking();
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
document.querySelector("#start").addEventListener("click", async () => {
  const cat = document.querySelector("#cat").value;
  const data = await api(`/api/questions?cat=${cat}`);
  quizEl.classList.remove("hidden");
  quizEl.innerHTML = "";
  let score = 0;
  let i = 0;
  function next() {
    if (i >= data.questions.length) {
      quizEl.innerHTML = `<p>Puntaje: ${score}</p><button class="primary" id="save">Guardar</button>`;
      document.querySelector("#save").addEventListener("click", async () => {
        await api("/api/score", { method: "POST", body: JSON.stringify({ category: cat, points: score }) });
        quizEl.classList.add("hidden");
        await loadRanking();
      });
      return;
    }
    const q = data.questions[i];
    quizEl.innerHTML = `<p>${q.q}</p><input id="ans" /><button class="primary" id="check">Ok</button>`;
    document.querySelector("#check").addEventListener("click", () => {
      if (document.querySelector("#ans").value.trim().toLowerCase() === q.a.toLowerCase()) score++;
      i++;
      next();
    });
  }
  next();
});
boot();
