(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function svgElement(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }

  function clampPercent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 50;
  }

  function drawArrow(svg, question) {
    const sx = clampPercent(question.startX);
    const sy = clampPercent(question.startY);
    const tx = clampPercent(question.targetX);
    const ty = clampPercent(question.targetY);
    const group = svgElement("g", { "data-arrow-id": question.id });

    // Optional target circle, also expressed in image-relative coordinates.
    if (question.marker && question.marker.enabled) {
      const rx = Number(question.marker.radiusX ?? 1.4);
      const ry = Number(question.marker.radiusY ?? 1.8);
      group.appendChild(svgElement("ellipse", {
        cx: tx * 10, cy: ty * 10,
        rx: Math.max(2, rx * 10), ry: Math.max(2, ry * 10),
        class: "target-ring"
      }));
    }

    // A line from the label-side start to the anatomical target.
    group.appendChild(svgElement("line", {
      x1: sx * 10, y1: sy * 10, x2: tx * 10, y2: ty * 10,
      class: "arrow-line"
    }));

    // Draw the arrowhead at the target end. Geometry is calculated automatically.
    const dx = tx - sx;
    const dy = ty - sy;
    const angle = Math.atan2(dy, dx);
    const length = 1.25; // arrowhead length in percentage units
    const spread = 0.62;
    const bx = tx - Math.cos(angle) * length;
    const by = ty - Math.sin(angle) * length;
    const p1 = `${tx * 10},${ty * 10}`;
    const p2 = `${(bx + Math.sin(angle) * spread) * 10},${(by - Math.cos(angle) * spread) * 10}`;
    const p3 = `${(bx - Math.sin(angle) * spread) * 10},${(by + Math.cos(angle) * spread) * 10}`;
    group.appendChild(svgElement("polygon", { points: `${p1} ${p2} ${p3}`, class: "arrow-head" }));
    svg.appendChild(group);
  }

  function draw(stage, svg, labelLayer, questions, onInput) {
    svg.replaceChildren();
    labelLayer.replaceChildren();
    // A 1000 × 1000 viewBox maps percentage coordinates to the full stage.
    // preserveAspectRatio="none" is safe here because the SVG box exactly
    // overlays the displayed image box, which may itself be any aspect ratio.
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("preserveAspectRatio", "none");

    questions.forEach((question, index) => {
      drawArrow(svg, question);

      const input = document.createElement("input");
      input.type = "text";
      input.className = "label-input";
      input.id = `answer-${question.id}`;
      input.name = `answer-${question.id}`;
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", `Answer for label ${index + 1}`);
      input.placeholder = question.placeholder || `Label ${index + 1}`;
      input.style.left = `${clampPercent(question.inputX)}%`;
      input.style.top = `${clampPercent(question.inputY)}%`;
      input.dataset.questionId = question.id;
      input.addEventListener("input", () => onInput(question.id, input.value));
      labelLayer.appendChild(input);

      const answer = document.createElement("div");
      answer.className = "answer-label";
      answer.id = `correct-${question.id}`;
      answer.style.left = `${clampPercent(question.answerX ?? question.inputX)}%`;
      answer.style.top = `${clampPercent(question.answerY ?? question.inputY)}%`;
      answer.dataset.questionId = question.id;
      answer.setAttribute("aria-live", "polite");
      labelLayer.appendChild(answer);
    });
  }

  window.ArrowDrawer = { draw };
})();
