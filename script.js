
"use strict";
const ARROW_CONFIG = [
  { id: "label1", startX: 27, startY: 19, targetX: 30, targetY: 30, inputX: 19, inputY: 15, answerX: 19, answerY: 15, marker: { enabled: true, radiusX: 1.8, radiusY: 2.4 } },
  { id: "label2", startX: 20, startY: 50, targetX: 48, targetY: 59, inputX: 17, inputY: 51, answerX: 17, answerY: 51, marker: { enabled: true, radiusX: 1.4, radiusY: 2.0 } },
  { id: "label3", startX: 57, startY: 15, targetX: 53, targetY: 22, inputX: 60, inputY: 12, answerX: 60, answerY: 12, marker: { enabled: true, radiusX: 1.5, radiusY: 2.1 } },
  { id: "label4", startX: 75, startY: 36, targetX: 53, targetY: 43, inputX: 84, inputY: 32, answerX: 84, answerY: 32, marker: { enabled: true, radiusX: 1.8, radiusY: 2.4 } },
  { id: "label5", startX: 76, startY: 66, targetX: 65, targetY: 62, inputX: 85, inputY: 69, answerX: 85, answerY: 69, marker: { enabled: true, radiusX: 2.0, radiusY: 2.7 } },
  { id: "label6", startX: 51, startY: 90, targetX: 57, targetY: 71, inputX: 44, inputY: 90, answerX: 44, answerY: 90, marker: { enabled: true, radiusX: 1.5, radiusY: 2.0 } }
];

const QUESTIONS = [
  { id: "label1", answer: "Annulus", aliases: ["Annular Ligament"] },
  { id: "label2", answer: "Umbo"},
  { id: "label3", answer: "Pars Flaccida"},
  { id: "label4", answer: "Manubrium", aliases: ["Handle of malleus"] },
  { id: "label5", answer: "Pars Tensa" },
  { id: "label6", answer: "Cone of light"}
];

(() => {
  const image = document.getElementById("anatomy-image");
  const stage = document.getElementById("image-stage");
  const svg = document.getElementById("arrow-layer");
  const labelLayer = document.getElementById("label-layer");
  const overlay = document.getElementById("results-overlay");
  const secondRetryBtn = document.getElementById("secondRetryBtn");
  const feedback = document.getElementById("feedback");
  const progress = document.getElementById("progress");
  const submitButton = document.getElementById("submit-button");
  const revealButton = document.getElementById("reveal-button");
  const retryButton = document.getElementById("retry-button");
  const answersButton = document.getElementById("answers-button");

  const questionById = new Map(QUESTIONS.map(q => [q.id, q]));
  const configById = new Map(ARROW_CONFIG.map(q => [q.id, q]));
  let submitted = false;
  let revealed = false;
  let lastFocusedElement = null;

  const validQuestions = QUESTIONS.filter(q => configById.has(q.id));
  if (validQuestions.length !== QUESTIONS.length || ARROW_CONFIG.length !== QUESTIONS.length) {
    console.warn("Each question needs exactly one matching ARROW_CONFIG entry with a unique ID.");
  }
  if (new Set(QUESTIONS.map(q => q.id)).size !== QUESTIONS.length ||
      new Set(ARROW_CONFIG.map(q => q.id)).size !== ARROW_CONFIG.length) {
    console.warn("Question and arrow IDs must be unique.");
  }

  function updateProgress() {
    const filled = QUESTIONS.filter(q => {
      const input = document.getElementById(`answer-${q.id}`);
      return input && input.value.trim().length > 0;
    }).length;
    progress.textContent = `${filled} of ${QUESTIONS.length} answered`;
  }

  function handleInput() {
    if (submitted) {
      submitted = false;
      document.querySelectorAll(".label-input").forEach(input => input.classList.remove("is-correct", "is-incorrect"));
    }
    feedback.textContent = "";
    updateProgress();
  }

  function normalize(value) {
    return String(value ?? "").trim().toLocaleLowerCase();
  }

  function isCorrect(question, value) {
    const normalized = normalize(value);
    if (!normalized) return false;
    return [question.answer, ...(question.aliases || [])].some(answer => normalize(answer) === normalized);
  }

  function evaluate() {
    let correct = 0;
    QUESTIONS.forEach(question => {
      const input = document.getElementById(`answer-${question.id}`);
      const ok = isCorrect(question, input.value);
      input.classList.toggle("is-correct", ok);
      input.classList.toggle("is-incorrect", !ok);
      if (ok) correct += 1;
    });
    submitted = true;
    const total = QUESTIONS.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    document.getElementById("score-number").textContent = `${correct} / ${total}`;
    document.getElementById("score-percent").textContent = `${percent}%`;
    document.getElementById("score-caption").textContent = `${correct} correct ${correct === 1 ? "answer" : "answers"}`;
    lastFocusedElement = document.activeElement;
    overlay.hidden = false;
    document.getElementById("retry-button").focus();
  }

  function revealAnswers() {
    revealed = true;
    QUESTIONS.forEach(question => {
      const label = document.getElementById(`correct-${question.id}`);
      label.textContent = questionById.get(question.id).answer;
      label.classList.add("visible");
    });
    overlay.hidden = true;
    secondRetryBtn.hidden = false;
    feedback.textContent = "Correct answers are shown in green. Choose Retry to start a fresh attempt.";
  }

  function retry() {
    QUESTIONS.forEach(question => {
      const input = document.getElementById(`answer-${question.id}`);
      input.value = "";
      input.classList.remove("is-correct", "is-incorrect");
    });
    submitted = false;
    revealed = false;
    document.querySelectorAll(".answer-label").forEach(label => {
      label.classList.remove("visible");
      label.textContent = "";
    });
    overlay.hidden = true;
    secondRetryBtn.hidden = true;
    feedback.textContent = "";
    updateProgress();
    const first = document.getElementById(`answer-${QUESTIONS[0]?.id}`);
    if (first) first.focus();
  }

  function render() {
    ArrowDrawer.draw(stage, svg, labelLayer, validQuestions.map(q => configById.get(q.id)), handleInput);
    updateProgress();
  }

  submitButton.addEventListener("click", evaluate);
  revealButton.addEventListener("click", revealAnswers);
  retryButton.addEventListener("click", retry);
  secondRetryBtn.addEventListener("click", retry);
  answersButton.addEventListener("click", revealAnswers);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) return; // Keep the full-screen result intentional; no accidental dismissal.
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) {
      // Deliberately do not dismiss results with Escape; use the explicit buttons.
      event.preventDefault();
    }
  });

  // Wait for image dimensions before laying out overlays. Re-draw after image load
  // and on resize/orientation changes so the SVG and labels track the image exactly.
  function redraw() {
    if (!image.complete || !image.naturalWidth) return;
    render();
  }
  image.addEventListener("load", redraw);
  image.addEventListener("error", () => {
    feedback.textContent = "The image could not be loaded. Check the image path in index.html.";
  });
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      // Coordinates are percentages, so CSS already scales them; redraw ensures
      // SVG geometry and labels are refreshed after orientation/viewport changes.
      redraw();
    });
    observer.observe(stage);
    observer.observe(image);
  } else {
    window.addEventListener("resize", redraw, { passive: true });
  }
  window.addEventListener("orientationchange", () => setTimeout(redraw, 100), { passive: true });

  if (image.complete && image.naturalWidth) redraw();
})();
