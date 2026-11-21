/**
 * CogniPath AI - Main Client Application Logic (v2.0)
 * Implements real-time state management, multi-agent orchestrations,
 * interactive assessments, Chart.js radar visualizations, Socratic chat,
 * voice synthesis, and 1-click guided demo tour.
 */

// Global Application State
const state = {
  profile: {
    name: "Alex Rivera",
    target_subject: "Python & Algorithmic Problem Solving",
    current_level: "Intermediate",
    target_goal: "Master dynamic programming, memoization, and graph state traversal for technical interviews",
    preferred_style: "Hands-on & Code-First",
    time_commitment_hrs: 6,
    prior_knowledge_summary: "Familiar with Python syntax, basic loops, recursion, and simple list/dict manipulations, but struggle with optimal recurrence formulation and state compression."
  },
  diagnosis: null,
  learningPath: null,
  activeNode: null,
  activeQuiz: null,
  quizAnswers: {},
  quizResult: null,
  tutorHistory: [],
  radarChart: null,
  voiceEnabled: false
};

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
  initPresets();
  initPills();
  initEventListeners();
  loadDiagnosticProbes();
  initRadarChart();
});

// Setup visual level and style selector pills
function initPills() {
  // Experience Level Pills
  const levelPills = document.querySelectorAll("#level-pills-container .level-pill");
  levelPills.forEach(pill => {
    pill.addEventListener("click", () => {
      levelPills.forEach(p => {
        p.className = "level-pill p-2.5 rounded-xl border text-xs font-medium text-center transition bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200";
      });
      pill.className = "level-pill p-2.5 rounded-xl border text-xs font-medium text-center transition bg-indigo-950/80 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/40";
      const val = pill.dataset.value;
      document.getElementById("input-level").value = val;
      state.profile.current_level = val;
      loadDiagnosticProbes();
    });
  });

  // Learning Style Pills
  const stylePills = document.querySelectorAll("#style-pills-container .style-pill");
  stylePills.forEach(pill => {
    pill.addEventListener("click", () => {
      stylePills.forEach(p => {
        p.className = "style-pill p-2 rounded-xl border text-[11px] font-medium text-center transition bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200";
      });
      pill.className = "style-pill p-2 rounded-xl border text-[11px] font-medium text-center transition bg-indigo-950/80 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/40";
      const val = pill.dataset.value;
      document.getElementById("input-style").value = val;
      state.profile.preferred_style = val;
    });
  });

  // Voice Speech Toggle
  const btnAudio = document.getElementById("btn-audio-toggle");
  if (btnAudio) {
    btnAudio.addEventListener("click", () => {
      state.voiceEnabled = !state.voiceEnabled;
      if (state.voiceEnabled) {
        btnAudio.className = "p-2 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs transition ring-1 ring-indigo-500/40";
        showToast("Voice Readout Enabled", "info");
      } else {
        btnAudio.className = "p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs transition";
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        showToast("Voice Readout Disabled", "info");
      }
    });
  }

  // Quick Tour / Instant Demo Button
  const btnTour = document.getElementById("btn-quick-tour");
  if (btnTour) {
    btnTour.addEventListener("click", runQuickTour);
  }
}

// 1-Click Guided Demo Tour for First-Time Users & Judges
async function runQuickTour() {
  showToast("Launching Instant Demo Tour...", "info");
  
  // Auto-select preset 0
  const presetContainer = document.getElementById("preset-container");
  const firstBtn = presetContainer ? presetContainer.querySelector("button") : null;
  if (firstBtn) firstBtn.click();

  // Scroll to trigger button and highlight it
  const btnDiagnose = document.getElementById("btn-run-diagnosis");
  if (btnDiagnose) {
    btnDiagnose.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btnDiagnose.classList.add("ring-4", "ring-indigo-500", "animate-pulse");
    setTimeout(() => {
      btnDiagnose.classList.remove("ring-4", "ring-indigo-500", "animate-pulse");
      btnDiagnose.click();
    }, 700);
  }
}

// Load available curriculum presets
async function initPresets() {
  try {
    const res = await fetch("/api/presets");
    const data = await res.json();
    const container = document.getElementById("preset-container");
    if (!container || !data.presets) return;

    const icons = ["fa-code", "fa-network-wired", "fa-brain", "fa-cubes"];
    const badges = ["Popular", "Advanced", "Deep Dive", "Hands-On"];

    container.innerHTML = "";
    data.presets.forEach((p, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const icon = icons[idx % icons.length];
      const badge = badges[idx % badges.length];

      btn.className = `text-left p-4 rounded-2xl border transition-all ${
        idx === 0 
          ? "bg-indigo-950/70 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/50" 
          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`;
      btn.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">
            <i class="fas ${icon}"></i>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">${badge}</span>
        </div>
        <div class="font-bold text-slate-100 text-xs mb-1 line-clamp-1">${p.title}</div>
        <div class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">${p.goal}</div>
      `;
      btn.onclick = () => selectPreset(p, btn);
      container.appendChild(btn);
    });
  } catch (err) {
    console.error("Failed to load presets:", err);
  }
}

function selectPreset(preset, btnElement) {
  // Update state
  state.profile.target_subject = preset.subject;
  state.profile.current_level = preset.level;
  state.profile.target_goal = preset.goal;
  state.profile.preferred_style = preset.style;
  state.profile.time_commitment_hrs = preset.hours;

  // Sync inputs
  document.getElementById("input-subject").value = preset.subject;
  document.getElementById("input-level").value = preset.level;
  document.getElementById("input-goal").value = preset.goal;
  document.getElementById("input-style").value = preset.style;
  document.getElementById("input-hours").value = preset.hours;

  // Update pills UI
  const levelPills = document.querySelectorAll("#level-pills-container .level-pill");
  levelPills.forEach(p => {
    if (p.dataset.value.toLowerCase() === preset.level.toLowerCase()) {
      p.className = "level-pill p-2.5 rounded-xl border text-xs font-medium text-center transition bg-indigo-950/80 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/40";
    } else {
      p.className = "level-pill p-2.5 rounded-xl border text-xs font-medium text-center transition bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200";
    }
  });

  // Visual highlight
  const allBtns = document.getElementById("preset-container").querySelectorAll("button");
  allBtns.forEach(b => {
    b.className = "text-left p-4 rounded-2xl border transition-all bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200";
  });
  btnElement.className = "text-left p-4 rounded-2xl border transition-all bg-indigo-950/70 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/50";

  loadDiagnosticProbes();
}

// Clickable, engaging diagnostic probe cards
async function loadDiagnosticProbes() {
  const subject = document.getElementById("input-subject").value;
  const level = document.getElementById("input-level").value;
  const container = document.getElementById("probes-container");
  if (!container) return;

  container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 animate-pulse"><i class="fas fa-spinner fa-spin mr-2"></i>Synthesizing diagnostic probes for ${subject}...</div>`;

  try {
    const res = await fetch(`/api/diagnostic-probes?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}`);
    const data = await res.json();
    container.innerHTML = "";

    if (data.probes && data.probes.length > 0) {
      data.probes.forEach((probe, idx) => {
        const card = document.createElement("div");
        card.className = "p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs mb-3";
        card.innerHTML = `
          <div class="font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Probe ${idx+1}: ${probe.question}</span>
            <span class="text-[10px] text-indigo-400 font-mono">Cognitive Check</span>
          </div>
          <div class="space-y-1.5" id="probe-opts-${probe.id}">
            ${probe.options.map((opt, optIdx) => `
              <div class="probe-option-card flex items-start space-x-2.5 p-2 rounded-lg border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-300 cursor-pointer transition hover:bg-slate-800/40 ${optIdx === 0 ? 'border-indigo-500/40 bg-indigo-950/20 text-indigo-200' : ''}" onclick="selectProbeOption('${probe.id}', this, '${opt.replace(/'/g, "\\'")}')">
                <input type="radio" name="probe_${probe.id}" value="${opt}" class="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700" ${optIdx === 0 ? 'checked' : ''}>
                <span class="leading-relaxed">${opt}</span>
              </div>
            `).join('')}
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="text-xs text-slate-500">Probe generator offline; default baseline will be used.</div>`;
  }
}

function selectProbeOption(probeId, cardElement, val) {
  const container = document.getElementById(`probe-opts-${probeId}`);
  if (!container) return;
  container.querySelectorAll(".probe-option-card").forEach(c => {
    c.className = "probe-option-card flex items-start space-x-2.5 p-2 rounded-lg border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-300 cursor-pointer transition hover:bg-slate-800/40";
    const radio = c.querySelector("input[type='radio']");
    if (radio) radio.checked = false;
  });

  cardElement.className = "probe-option-card flex items-start space-x-2.5 p-2 rounded-lg border border-indigo-500/50 bg-indigo-950/30 text-indigo-200 cursor-pointer transition ring-1 ring-indigo-500/40";
  const radio = cardElement.querySelector("input[type='radio']");
  if (radio) radio.checked = true;
}

function initEventListeners() {
  // Navigation Tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      switchSection(target);
    });
  });

  // Run Diagnosis Button
  const btnDiagnose = document.getElementById("btn-run-diagnosis");
  if (btnDiagnose) {
    btnDiagnose.addEventListener("click", runFullDiagnosis);
  }

  // Quick Plan Generator
  const btnGenPath = document.getElementById("btn-generate-path");
  if (btnGenPath) {
    btnGenPath.addEventListener("click", generateCurriculumPath);
  }

  // Socratic Chat Form
  const tutorForm = document.getElementById("tutor-form");
  if (tutorForm) {
    tutorForm.addEventListener("submit", sendTutorMessage);
  }

  // Export Plan JSON
  const btnExport = document.getElementById("btn-export-plan");
  if (btnExport) {
    btnExport.addEventListener("click", exportLearningPlan);
  }
}

function switchSection(sectionId) {
  // Toggle active views
  document.querySelectorAll(".app-section").forEach(sec => {
    sec.classList.add("hidden");
  });
  const activeSec = document.getElementById(`section-${sectionId}`);
  if (activeSec) {
    activeSec.classList.remove("hidden");
  }

  // Toggle tab buttons
  document.querySelectorAll(".nav-tab").forEach(tab => {
    if (tab.dataset.target === sectionId) {
      tab.classList.add("bg-indigo-600/20", "text-indigo-400", "border-indigo-500/50");
      tab.classList.remove("text-slate-400", "border-transparent");
    } else {
      tab.classList.remove("bg-indigo-600/20", "text-indigo-400", "border-indigo-500/50");
      tab.classList.add("text-slate-400", "border-transparent");
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Multi-Agent Step 1: Run Diagnosis
async function runFullDiagnosis() {
  const btn = document.getElementById("btn-run-diagnosis");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing Mental Models & Gaps...`;

  // Collect form state
  state.profile.name = document.getElementById("input-name").value || "Alex Rivera";
  state.profile.target_subject = document.getElementById("input-subject").value || "Python & Algorithms";
  state.profile.current_level = document.getElementById("input-level").value || "Intermediate";
  state.profile.target_goal = document.getElementById("input-goal").value || "Master key concepts";
  state.profile.preferred_style = document.getElementById("input-style").value || "Hands-on & Code-First";
  state.profile.time_commitment_hrs = parseFloat(document.getElementById("input-hours").value) || 6;
  state.profile.prior_knowledge_summary = document.getElementById("input-prior").value || "";

  // Collect probe answers
  let probeAnswers = [];
  const probeRadios = document.querySelectorAll("#probes-container input[type='radio']:checked");
  probeRadios.forEach(r => probeAnswers.push(`${r.name}: ${r.value}`));

  const payload = {
    profile: state.profile,
    answers: probeAnswers.join("\n") + "\n\nUser Background Notes: " + state.profile.prior_knowledge_summary
  };

  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === "success" && data.diagnosis) {
      state.diagnosis = data.diagnosis;
      renderDiagnosisView(data.diagnosis);
      switchSection("matrix");
      showToast("Diagnostic Insights Ready!", "success");
      
      // Auto-trigger curriculum generation for seamless flow
      generateCurriculumPath();
    } else {
      showToast("Diagnostic analysis failed: " + (data.message || "Unknown error"), "error");
    }
  } catch (err) {
    console.error("Diagnosis error:", err);
    showToast("Error connecting to diagnostic agent.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// Render Knowledge Gap Matrix & Chart
function renderDiagnosisView(diag) {
  document.getElementById("diag-subject-badge").textContent = diag.subject || state.profile.target_subject;
  document.getElementById("diag-readiness-score").textContent = `${diag.overall_readiness_score || 60}%`;
  document.getElementById("diag-cognitive-summary").textContent = diag.cognitive_summary || "Diagnosis complete.";

  // Render Gaps Table
  const tableBody = document.getElementById("gaps-table-body");
  tableBody.innerHTML = "";

  const gaps = diag.identified_gaps || [];
  gaps.forEach((g, idx) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-800/60 hover:bg-slate-800/30 transition text-xs";

    const sevColors = {
      critical: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      moderate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      minor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    };
    const badgeClass = sevColors[g.severity] || sevColors.moderate;

    tr.innerHTML = `
      <td class="py-3 px-3">
        <div class="font-semibold text-slate-100">${g.concept_name}</div>
        <div class="text-[11px] text-slate-400">${g.category || 'Core Concept'}</div>
      </td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] border ${badgeClass} uppercase font-medium">
          ${g.severity}
        </span>
      </td>
      <td class="py-3 px-3">
        <div class="flex items-center space-x-2">
          <div class="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full ${g.mastery_score < 50 ? 'bg-rose-500' : (g.mastery_score < 75 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${g.mastery_score}%"></div>
          </div>
          <span class="text-[11px] font-mono text-slate-300">${g.mastery_score}%</span>
        </div>
      </td>
      <td class="py-3 px-3 text-slate-400">
        <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300">${g.bloom_level || 'Apply'}</span>
      </td>
      <td class="py-3 px-3 text-slate-300 text-[11px]">
        <div class="italic text-rose-300/90 mb-1">"${g.misconception}"</div>
        <div class="flex items-center justify-between gap-2 mt-2">
          <div class="text-slate-400 text-[10px] flex items-center">
            <i class="fas fa-arrow-right text-indigo-400 mr-1.5"></i>${g.recommended_remedy}
          </div>
          <button type="button" class="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold flex items-center transition" onclick="instantRemediate('${g.concept_name.replace(/'/g, "\\'")}')">
            <i class="fas fa-bolt text-indigo-400 mr-1"></i>Explain
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Render Strengths
  const strengthsContainer = document.getElementById("diag-strengths-container");
  strengthsContainer.innerHTML = "";
  (diag.strengths || []).forEach(str => {
    const li = document.createElement("li");
    li.className = "flex items-start text-xs text-slate-300";
    li.innerHTML = `<i class="fas fa-check-circle text-emerald-400 mr-2 mt-0.5"></i><span>${str}</span>`;
    strengthsContainer.appendChild(li);
  });

  // Update Radar Chart
  updateRadarChart(gaps);
}

// 1-Click Instant Remediation for any detected gap
function instantRemediate(conceptName) {
  switchSection("tutor");
  const input = document.getElementById("tutor-user-input");
  if (input) {
    input.value = `Can you explain the intuition behind ${conceptName} and why students typically confuse it?`;
    document.getElementById("tutor-form").dispatchEvent(new Event("submit"));
  }
}

// Chart.js Radar Chart
function initRadarChart() {
  const ctx = document.getElementById("radarMasteryChart");
  if (!ctx) return;

  const labels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
  const baselineData = [75, 65, 45, 38, 40, 30];

  state.radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Assessed Mastery",
          data: baselineData,
          fill: true,
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          borderColor: "rgba(99, 102, 241, 0.9)",
          pointBackgroundColor: "rgba(99, 102, 241, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(99, 102, 241, 1)"
        },
        {
          label: "Target Proficiency Goal",
          data: [90, 90, 85, 80, 80, 75],
          fill: false,
          borderColor: "rgba(16, 185, 129, 0.6)",
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: "rgba(255, 255, 255, 0.08)" },
          grid: { color: "rgba(255, 255, 255, 0.06)" },
          pointLabels: {
            color: "#94a3b8",
            font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" }
          },
          ticks: {
            backdropColor: "transparent",
            color: "#64748b",
            font: { size: 9 },
            stepSize: 20
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#cbd5e1", font: { size: 11 }, boxWidth: 12 }
        }
      }
    }
  });
}

function updateRadarChart(gaps) {
  if (!state.radarChart) return;
  const bloomLevels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
  const scores = [80, 70, 50, 40, 45, 35]; // defaults

  gaps.forEach(g => {
    const lvl = g.bloom_level;
    const idx = bloomLevels.indexOf(lvl);
    if (idx !== -1) {
      scores[idx] = Math.min(scores[idx], g.mastery_score);
    }
  });

  state.radarChart.data.datasets[0].data = scores;
  state.radarChart.update();
}

// Multi-Agent Step 2: Curriculum Architect Agent
async function generateCurriculumPath() {
  const btn = document.getElementById("btn-generate-path");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Synthesizing Adaptive Path...`;
  }

  const payload = {
    profile: state.profile,
    gaps: state.diagnosis ? state.diagnosis.identified_gaps : []
  };

  try {
    const res = await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === "success" && data.learning_path) {
      state.learningPath = data.learning_path;
      renderLearningPathView(data.learning_path);
      switchSection("roadmap");
      showToast("Personalized Learning Roadmap Ready!", "success");
    }
  } catch (err) {
    console.error("Path error:", err);
    showToast("Error generating learning roadmap.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-route mr-2"></i>View My Custom Learning Roadmap ➔`;
    }
  }
}

// Render Interactive Skill Tree / Learning Path
function renderLearningPathView(path) {
  const container = document.getElementById("learning-nodes-container");
  if (!container) return;
  container.innerHTML = "";

  document.getElementById("path-subject-title").textContent = path.subject || state.profile.target_subject;
  document.getElementById("path-total-hours").textContent = `${path.total_estimated_hours || 6} Hours Estimated`;

  const nodes = path.nodes || [];
  if (nodes.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400">No learning nodes generated yet.</div>`;
    return;
  }

  nodes.forEach((node, index) => {
    const isReady = node.status === "ready";
    const isMastered = node.status === "mastered";
    const isLocked = node.status === "locked";
    const isRemedial = node.is_remedial;

    const nodeCard = document.createElement("div");
    nodeCard.className = `relative pl-12 pb-8 ${index === nodes.length - 1 ? 'pb-0' : ''}`;

    // Status styling
    let statusBadge = "";
    let iconClass = "";
    let borderClass = "";

    if (isMastered) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center font-semibold"><i class="fas fa-check-circle mr-1"></i>Mastered</span>`;
      iconClass = "bg-emerald-500 text-slate-950 font-bold";
      borderClass = "border-emerald-500/40 bg-emerald-950/10";
    } else if (isReady) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center pulse-node font-semibold"><i class="fas fa-play-circle mr-1"></i>Ready to Assess</span>`;
      iconClass = "bg-indigo-600 text-white glow-indigo font-bold";
      borderClass = "border-indigo-500/50 bg-slate-900/90 shadow-lg shadow-indigo-950/30";
    } else {
      statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700 flex items-center"><i class="fas fa-lock mr-1"></i>Locked</span>`;
      iconClass = "bg-slate-800 text-slate-500";
      borderClass = "border-slate-800/80 bg-slate-900/40 opacity-70";
    }

    const remedialBadge = isRemedial ? `
      <span class="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center">
        <i class="fas fa-shield-alt mr-1"></i>Remedial Bridge
      </span>
    ` : '';

    nodeCard.innerHTML = `
      <!-- Vertical connecting line -->
      ${index < nodes.length - 1 ? '<div class="timeline-stem"></div>' : ''}

      <!-- Node icon circle -->
      <div class="absolute left-2.5 top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${iconClass}">
        ${isMastered ? '<i class="fas fa-check"></i>' : index + 1}
      </div>

      <!-- Main Node Card -->
      <div class="glass-card rounded-2xl p-5 border ${borderClass} transition-all">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">${node.category || 'Module'}</span>
            ${remedialBadge}
            ${statusBadge}
          </div>
          <div class="flex items-center space-x-3 text-xs text-slate-400">
            <span><i class="far fa-clock mr-1 text-slate-500"></i>${node.estimated_minutes} min</span>
            <span class="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300">Bloom: ${node.bloom_target}</span>
          </div>
        </div>

        <h4 class="text-base font-bold text-slate-100 mb-2">${node.title}</h4>
        <p class="text-xs text-slate-300 mb-4 leading-relaxed">${node.description}</p>

        ${node.remediation_reason ? `
          <div class="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 mb-3 flex items-start">
            <i class="fas fa-info-circle text-amber-400 mr-2 mt-0.5"></i>
            <div><strong>Remediation Target:</strong> ${node.remediation_reason}</div>
          </div>
        ` : ''}

        <!-- Key Takeaways -->
        <div class="space-y-1 mb-4">
          ${(node.key_takeaways || []).map(tk => `
            <div class="flex items-start text-[11px] text-slate-400">
              <i class="fas fa-chevron-right text-indigo-400 text-[9px] mr-2 mt-1"></i>
              <span>${tk}</span>
            </div>
          `).join('')}
        </div>

        <!-- Action Bar -->
        <div class="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center space-x-2">
            ${(node.resource_links || []).map(r => `
              <a href="${r.url}" target="_blank" class="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center hover:underline">
                <i class="fas fa-external-link-alt mr-1 text-[9px]"></i>${r.title}
              </a>
            `).join('')}
          </div>

          <div class="flex items-center space-x-2">
            <button type="button" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition flex items-center" onclick="openTutorForNode('${node.id}')">
              <i class="fas fa-comments text-indigo-400 mr-1.5"></i>Ask Tutor
            </button>

            ${!isLocked ? `
              <button type="button" class="px-4 py-1.5 rounded-xl font-bold text-xs transition flex items-center ${
                isMastered ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }" onclick="startAssessmentForNode('${node.id}')">
                <i class="fas fa-tasks mr-1.5"></i>${isMastered ? 'Re-Test Mastery' : 'Take Quiz ➔'}
              </button>
            ` : `
              <button type="button" disabled class="px-3 py-1.5 rounded-xl bg-slate-800/40 text-xs text-slate-500 cursor-not-allowed">
                <i class="fas fa-lock mr-1"></i>Prerequisites Required
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    container.appendChild(nodeCard);
  });
}

// Multi-Agent Step 3: Adaptive Assessment Generation
async function startAssessmentForNode(nodeId) {
  const node = state.learningPath.nodes.find(n => n.id === nodeId);
  if (!node) return;

  state.activeNode = node;
  state.quizAnswers = {};
  state.quizResult = null;

  switchSection("assessment");
  const container = document.getElementById("quiz-runner-container");
  container.innerHTML = `
    <div class="p-12 text-center">
      <div class="inline-block p-4 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-2xl mb-4 animate-bounce">
        <i class="fas fa-brain"></i>
      </div>
      <h3 class="text-base font-bold text-slate-100 mb-1">Synthesizing Diagnostic Questions...</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">Targeting Bloom's depth (${node.bloom_target}) and generating misconception distractors for "${node.title}".</p>
    </div>
  `;

  try {
    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: node, count: 2 })
    });
    const data = await res.json();

    if (data.status === "success" && data.assessment) {
      state.activeQuiz = data.assessment;
      renderQuizInterface(data.assessment, node);
    } else {
      showToast("Failed to generate assessment.", "error");
    }
  } catch (err) {
    console.error("Quiz gen error:", err);
    showToast("Error generating quiz.", "error");
  }
}

function renderQuizInterface(assessment, node) {
  const container = document.getElementById("quiz-runner-container");
  const questions = assessment.questions || [];

  if (questions.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No questions available for this module.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
      <div>
        <span class="text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold">Active Assessment</span>
        <h3 class="text-lg font-bold text-slate-100">${node.title}</h3>
      </div>
      <div class="flex items-center space-x-3 text-xs">
        <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          <i class="fas fa-layer-group text-indigo-400 mr-1.5"></i>Bloom: ${node.bloom_target}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
          <i class="fas fa-question-circle mr-1.5"></i>${questions.length} Diagnostic Items
        </span>
      </div>
    </div>

    <!-- Questions list -->
    <form id="assessment-submit-form" onsubmit="submitAssessment(event)">
      <div class="space-y-6 mb-8">
        ${questions.map((q, idx) => `
          <div class="glass-card rounded-2xl p-5 border border-slate-800/80">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-slate-400">Question ${idx + 1} of ${questions.length}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">${q.difficulty} • ${q.bloom_level}</span>
            </div>

            <p class="text-sm font-medium text-slate-100 mb-4 leading-relaxed">${q.question_text}</p>

            ${q.code_snippet ? `
              <pre class="p-3 rounded-xl bg-slate-950 text-emerald-400 text-xs font-mono mb-4 overflow-x-auto border border-slate-800"><code>${q.code_snippet}</code></pre>
            ` : ''}

            <!-- Options (Clickable Card Blocks) -->
            <div class="space-y-2">
              ${q.options.map(opt => `
                <label class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-indigo-500/40 cursor-pointer transition text-xs text-slate-300">
                  <input type="radio" name="answer_${q.id}" value="${opt.id}" required class="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700">
                  <div class="flex-1">
                    <span class="font-bold text-indigo-400 mr-1.5">${opt.id}.</span>
                    <span>${opt.text}</span>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-slate-800">
        <button type="button" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition" onclick="switchSection('roadmap')">
          <i class="fas fa-arrow-left mr-1.5"></i>Back to Roadmap
        </button>

        <button type="submit" id="btn-submit-assessment" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center">
          <i class="fas fa-paper-plane mr-2"></i>Submit for Adaptive Evaluation ➔
        </button>
      </div>
    </form>
  `;
}

// Multi-Agent Step 4: Adaptation & Dynamic Re-planning
async function submitAssessment(event) {
  event.preventDefault();
  const btn = document.getElementById("btn-submit-assessment");
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Evaluating Misconceptions & Adapting Path...`;

  const form = document.getElementById("assessment-submit-form");
  const formData = new FormData(form);
  const answers = {};

  state.activeQuiz.questions.forEach(q => {
    answers[q.id] = formData.get(`answer_${q.id}`);
  });

  const payload = {
    node: state.activeNode,
    questions: state.activeQuiz.questions,
    answers: answers,
    current_path: state.learningPath
  };

  try {
    const res = await fetch("/api/evaluate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === "success" && data.result) {
      state.quizResult = data.result;
      if (data.result.updated_path) {
        state.learningPath = data.result.updated_path;
      }
      renderEvaluationResult(data.result);
      showToast(data.result.passed ? "Milestone Mastered!" : "Adaptation applied: Remedial path inserted.", data.result.passed ? "success" : "info");
    } else {
      showToast("Evaluation failed: " + (data.message || "Unknown"), "error");
    }
  } catch (err) {
    console.error("Eval error:", err);
    showToast("Error processing assessment evaluation.", "error");
  } finally {
    btn.disabled = false;
  }
}

function renderEvaluationResult(result) {
  const container = document.getElementById("quiz-runner-container");
  const passed = result.passed;

  container.innerHTML = `
    <div class="glass-card rounded-2xl p-6 border ${passed ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-amber-500/40 bg-amber-950/10'} mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${passed ? 'bg-emerald-500 text-slate-950 glow-emerald' : 'bg-amber-500 text-slate-950 glow-amber'}">
            <i class="fas ${passed ? 'fa-award' : 'fa-lightbulb'}"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-100">${passed ? 'Milestone Cleared with Mastery!' : 'Knowledge Gap Detected: Path Adapted'}</h3>
            <p class="text-xs text-slate-400">Score: <strong class="text-slate-200">${result.score}/${result.total_questions} (${result.percentage}%)</strong></p>
          </div>
        </div>

        <div class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span class="text-slate-400 mr-1.5">Mastery Shift:</span>
          ${Object.entries(result.concept_mastery_delta || {}).map(([k, v]) => `
            <span class="font-mono font-bold ${v >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${v >= 0 ? '+' : ''}${v} ${k}</span>
          `).join(', ')}
        </div>
      </div>

      <p class="text-xs text-slate-300 leading-relaxed mb-4">${result.feedback_summary}</p>

      <!-- Adaptation Description Banner -->
      <div class="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-xs text-indigo-200 flex items-start space-x-3 mb-6">
        <i class="fas fa-magic text-indigo-400 mt-0.5"></i>
        <div>
          <strong class="text-indigo-300">Live Agent Adaptation:</strong> ${result.path_change_description || 'Updated your roadmap nodes to optimize retention.'}
        </div>
      </div>

      <!-- Detected Misconceptions Breakdown -->
      ${(result.detected_misconceptions && result.detected_misconceptions.length > 0) ? `
        <div class="mb-6">
          <h4 class="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center">
            <i class="fas fa-exclamation-triangle mr-1.5"></i>Diagnosed Flawed Mental Models
          </h4>
          <div class="space-y-2">
            ${result.detected_misconceptions.map(m => `
              <div class="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs">
                <div class="font-semibold text-rose-200 mb-1">${m.concept} <span class="text-[10px] text-rose-400 font-mono">(${m.tag})</span></div>
                <div class="text-slate-300 text-[11px]">${m.explanation}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Next Steps Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <button type="button" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition" onclick="openTutorForNode('${state.activeNode.id}')">
          <i class="fas fa-user-graduate text-indigo-400 mr-1.5"></i>Debrief with AI Mentor
        </button>

        <button type="button" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center shadow-md shadow-indigo-600/30" onclick="viewUpdatedRoadmap()">
          <i class="fas fa-map-marked-alt mr-2"></i>View Adapted Roadmap ➔
        </button>
      </div>
    </div>
  `;
}

function viewUpdatedRoadmap() {
  renderLearningPathView(state.learningPath);
  switchSection("roadmap");
}

// Socratic Tutor Interface
function openTutorForNode(nodeId) {
  const node = state.learningPath ? state.learningPath.nodes.find(n => n.id === nodeId) : null;
  state.activeNode = node;
  switchSection("tutor");

  const badge = document.getElementById("tutor-active-node-badge");
  if (badge && node) {
    badge.textContent = `Focus: ${node.title}`;
  }

  // Pre-fill suggested question
  const promptInput = document.getElementById("tutor-user-input");
  if (promptInput && node) {
    promptInput.value = `Can you guide me through the intuition behind ${node.title} without just giving the answer?`;
  }
}

async function sendTutorMessage(event) {
  event.preventDefault();
  const input = document.getElementById("tutor-user-input");
  const msg = input.value.trim();
  if (!msg) return;

  const chatContainer = document.getElementById("tutor-chat-messages");
  
  // Render user message
  appendChatMessage("user", msg);
  input.value = "";

  state.tutorHistory.push({ role: "user", content: msg });

  // Render typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.id = "tutor-typing";
  typingDiv.className = "flex items-start space-x-2 text-xs text-slate-400 animate-pulse";
  typingDiv.innerHTML = `<div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold"><i class="fas fa-brain"></i></div><div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">Thinking Socratically...</div>`;
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: state.tutorHistory,
        current_node: state.activeNode,
        style: state.profile.preferred_style
      })
    });
    const data = await res.json();

    const typingElem = document.getElementById("tutor-typing");
    if (typingElem) typingElem.remove();

    if (data.status === "success" && data.reply) {
      appendChatMessage("assistant", data.reply);
      state.tutorHistory.push({ role: "assistant", content: data.reply });

      // If voice enabled, speak aloud
      if (state.voiceEnabled && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    }
  } catch (err) {
    const typingElem = document.getElementById("tutor-typing");
    if (typingElem) typingElem.remove();
    appendChatMessage("assistant", "I had trouble formulating a response. Let me know what specific step you're contemplating.");
  }
}

function appendChatMessage(role, text) {
  const chatContainer = document.getElementById("tutor-chat-messages");
  const div = document.createElement("div");
  div.className = `flex items-start space-x-2 text-xs ${role === 'user' ? 'justify-end' : 'justify-start'}`;

  if (role === 'assistant') {
    div.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 glow-indigo">
        <i class="fas fa-robot"></i>
      </div>
      <div class="max-w-[85%] p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line shadow-sm">
        ${text}
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="max-w-[85%] p-3.5 rounded-2xl bg-indigo-600 text-white leading-relaxed whitespace-pre-line shadow-md shadow-indigo-600/20">
        ${text}
      </div>
      <div class="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
        <i class="fas fa-user"></i>
      </div>
    `;
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Export Learning Plan
function exportLearningPlan() {
  const exportData = {
    app: "CogniPath AI - Autonomous Personalized Learning Agent",
    generated_at: new Date().toISOString(),
    profile: state.profile,
    diagnosis: state.diagnosis,
    learning_path: state.learningPath
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `CogniPath_Learning_Plan_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("Learning Plan Exported as JSON!", "success");
}

// Toast notification helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const colors = {
    success: "bg-emerald-950/90 border-emerald-500/40 text-emerald-200",
    error: "bg-rose-950/90 border-rose-500/40 text-rose-200",
    info: "bg-indigo-950/90 border-indigo-500/40 text-indigo-200"
  };
  const icons = {
    success: "fa-check-circle text-emerald-400",
    error: "fa-exclamation-circle text-rose-400",
    info: "fa-info-circle text-indigo-400"
  };

  toast.className = `p-3.5 rounded-2xl border text-xs shadow-xl backdrop-blur-md flex items-center space-x-2.5 transition-all transform duration-300 ${colors[type] || colors.info}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
