/**
 * Application Controller & Dynamic UI Engine
 * Author: Ashwajeet | Theory of Computation Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentStates = ['q1', 'q2'];
  let currentInputs = ['a', 'b'];
  let currentInitialState = 'q1';
  let lastConversionResult = null;
  let activeDiagramTab = 'moore'; // 'mealy' or 'moore'

  // DOM Elements
  const stateCountInput = document.getElementById('state-count');
  const inputSymbolsInput = document.getElementById('input-symbols');
  const initialStateSelect = document.getElementById('initial-state-select');
  const matrixTableHead = document.getElementById('matrix-thead');
  const matrixTableBody = document.getElementById('matrix-tbody');
  const convertBtn = document.getElementById('convert-btn');
  const simulateBtn = document.getElementById('simulate-btn');
  const simInputString = document.getElementById('sim-input-string');
  const mooreResultCard = document.getElementById('moore-result-card');
  const mooreTableHead = document.getElementById('moore-thead');
  const mooreTableBody = document.getElementById('moore-tbody');
  const stepsContainer = document.getElementById('steps-container');
  const simResultsCard = document.getElementById('sim-results-card');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Presets definition (Section 3.6 Standard TOC Configurations)
  const PRESETS = {
    preset1: {
      name: "Preset 1: Prompt Example (q1, q2)",
      states: ['q1', 'q2'],
      inputs: ['a', 'b'],
      initialState: 'q1',
      transitions: {
        'q1': {
          'a': { nextState: 'q1', output: '1' },
          'b': { nextState: 'q2', output: '0' }
        },
        'q2': {
          'a': { nextState: 'q1', output: '0' },
          'b': { nextState: 'q2', output: '1' }
        }
      },
      sampleInput: 'ababa'
    },
    preset2: {
      name: "Preset 2: Serial Adder",
      states: ['q0', 'q1'],
      inputs: ['00', '01', '10', '11'],
      initialState: 'q0',
      transitions: {
        'q0': {
          '00': { nextState: 'q0', output: '0' },
          '01': { nextState: 'q0', output: '1' },
          '10': { nextState: 'q0', output: '1' },
          '11': { nextState: 'q1', output: '0' }
        },
        'q1': {
          '00': { nextState: 'q0', output: '1' },
          '01': { nextState: 'q1', output: '0' },
          '10': { nextState: 'q1', output: '0' },
          '11': { nextState: 'q1', output: '1' }
        }
      },
      sampleInput: '00 01 11 10'
    },
    preset3: {
      name: "Preset 3: 2's Complement (Reading LSB to MSB)",
      states: ['q0', 'q1'],
      inputs: ['0', '1'],
      initialState: 'q0',
      transitions: {
        'q0': {
          '0': { nextState: 'q0', output: '0' },
          '1': { nextState: 'q1', output: '1' }
        },
        'q1': {
          '0': { nextState: 'q1', output: '1' },
          '1': { nextState: 'q1', output: '0' }
        }
      },
      sampleInput: '0010'
    },
    preset4: {
      name: "Preset 4: 101 Detector (Overlapping)",
      states: ['A', 'B', 'C', 'D'],
      inputs: ['0', '1'],
      initialState: 'A',
      transitions: {
        'A': {
          '0': { nextState: 'A', output: '0' },
          '1': { nextState: 'B', output: '0' }
        },
        'B': {
          '0': { nextState: 'C', output: '0' },
          '1': { nextState: 'B', output: '0' }
        },
        'C': {
          '0': { nextState: 'A', output: '0' },
          '1': { nextState: 'D', output: '1' }
        },
        'D': {
          '0': { nextState: 'C', output: '0' },
          '1': { nextState: 'B', output: '0' }
        }
      },
      sampleInput: '10101'
    }
  };

  // Backwards compatibility aliases
  PRESETS.prompt = PRESETS.preset1;
  PRESETS.serialAdder = PRESETS.preset2;
  PRESETS.twosComplement = PRESETS.preset3;
  PRESETS.sequence101 = PRESETS.preset4;

  // Mobile menu toggle
  if (mobileNavToggle && navLinks) {
    mobileNavToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Populate Initial State Dropdown
  function refreshInitialStateDropdown() {
    initialStateSelect.innerHTML = '';
    currentStates.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = `State ${st}`;
      if (st === currentInitialState) opt.selected = true;
      initialStateSelect.appendChild(opt);
    });
  }

  // Build the dynamic Mealy Machine matrix table
  function renderMealyMatrix(prefillData = null) {
    // 1. Table Header
    let theadHTML = `
      <tr>
        <th class="header-state">Present State</th>
    `;
    currentInputs.forEach(inp => {
      theadHTML += `<th>Next State & Output (on ${inp})</th>`;
    });
    theadHTML += `</tr>`;
    matrixTableHead.innerHTML = theadHTML;

    // 2. Table Body
    let tbodyHTML = '';
    currentStates.forEach(st => {
      tbodyHTML += `
        <tr data-from-state="${st}">
          <td class="state-label">
            ${st} ${st === currentInitialState ? '<span class="state-badge">START</span>' : ''}
          </td>
      `;

      currentInputs.forEach(inp => {
        let valNext = st;
        let valOut = '0';

        if (prefillData && prefillData[st] && prefillData[st][inp]) {
          valNext = prefillData[st][inp].nextState;
          valOut = prefillData[st][inp].output;
        }

        tbodyHTML += `
          <td>
            <div class="matrix-cell-pair">
              <div>
                <div class="cell-sublabel">Next State</div>
                <select class="matrix-input-state" data-state="${st}" data-input="${inp}">
                  ${currentStates.map(s => `<option value="${s}" ${s === valNext ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div>
                <div class="cell-sublabel">Output</div>
                <input type="text" maxlength="4" class="matrix-input-output" data-state="${st}" data-input="${inp}" value="${valOut}" placeholder="0"/>
              </div>
            </div>
          </td>
        `;
      });

      tbodyHTML += `</tr>`;
    });
    matrixTableBody.innerHTML = tbodyHTML;
  }

  // Harvest data from input matrix
  function getMealyMachineFromUI() {
    const transitions = {};
    currentStates.forEach(st => {
      transitions[st] = {};
    });

    const rows = matrixTableBody.querySelectorAll('tr[data-from-state]');
    rows.forEach(row => {
      const fromSt = row.getAttribute('data-from-state');
      currentInputs.forEach(inp => {
        const stateSelect = row.querySelector(`.matrix-input-state[data-input="${inp}"]`);
        const outputInput = row.querySelector(`.matrix-input-output[data-input="${inp}"]`);
        const nextSt = stateSelect ? stateSelect.value : fromSt;
        const outVal = outputInput ? (outputInput.value.trim() || '0') : '0';
        transitions[fromSt][inp] = {
          nextState: nextSt,
          output: outVal
        };
      });
    });

    return {
      states: [...currentStates],
      inputs: [...currentInputs],
      initialState: currentInitialState,
      transitions: transitions
    };
  }

  // Render Moore Machine Output Table
  function renderMooreOutput(moore) {
    // 1. Table Header
    let theadHTML = `
      <tr>
        <th class="th-state">Present State</th>
    `;
    moore.inputs.forEach(inp => {
      theadHTML += `<th>Next State (on ${inp})</th>`;
    });
    theadHTML += `<th class="th-output">State Output</th></tr>`;
    mooreTableHead.innerHTML = theadHTML;

    // 2. Table Body
    let tbodyHTML = '';
    moore.states.forEach(mSt => {
      const isStart = mSt === moore.initialState;
      const outVal = moore.outputs[mSt];

      tbodyHTML += `
        <tr>
          <td class="td-state">
            ${mSt} ${isStart ? '<span class="state-badge">START</span>' : ''}
          </td>
      `;

      moore.inputs.forEach(inp => {
        const nextSt = moore.transitions[mSt] && moore.transitions[mSt][inp] ? moore.transitions[mSt][inp] : '-';
        tbodyHTML += `<td>${nextSt}</td>`;
      });

      tbodyHTML += `<td class="td-output">${outVal}</td></tr>`;
    });
    mooreTableBody.innerHTML = tbodyHTML;
  }

  // Render Step-by-Step Educational Explanation Cards
  function renderStepExplanations(stepExplanations) {
    stepsContainer.innerHTML = '';

    stepExplanations.forEach(step => {
      const card = document.createElement('div');
      card.className = 'step-card';

      let mathLines = '';
      if (step.mathDetails && step.mathDetails.length > 0) {
        mathLines = `
          <div class="step-math-box">
            ${step.mathDetails.map(line => `<div>• ${line}</div>`).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="step-header">
          <div class="step-number-badge">${step.stepNumber}</div>
          <h3 class="step-title">${step.title}</h3>
        </div>
        <p class="step-content">${step.description}</p>
        ${mathLines}
      `;

      stepsContainer.appendChild(card);
    });
  }

  // Trigger Conversion (Asynchronous with Backend API + Local Engine Fallback)
  async function runConversion() {
    const mealy = getMealyMachineFromUI();
    let result = null;

    try {
      const resp = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealy)
      });
      if (resp.ok) {
        result = await resp.json();
      }
    } catch (err) {
      // Fallback to client-side conversion engine
    }

    if (!result) {
      result = MealyToMooreConverter.convert(mealy);
    }

    lastConversionResult = result;

    // Display Moore Output
    renderMooreOutput(result.moore);

    // Display Step Explanations
    renderStepExplanations(result.stepExplanations);

    // Display Diagrams
    updateDiagrams();

    // Show result card
    mooreResultCard.style.display = 'block';
  }

  // Update Diagram SVGs
  function updateDiagrams() {
    if (!lastConversionResult) return;
    if (activeDiagramTab === 'mealy') {
      AutomataDiagramVisualizer.renderMealy('diagram-viewport', lastConversionResult.mealy);
    } else {
      AutomataDiagramVisualizer.renderMoore('diagram-viewport', lastConversionResult.moore);
    }
  }

  // Diagram tab buttons
  const tabBtnMoore = document.getElementById('tab-btn-moore');
  const tabBtnMealy = document.getElementById('tab-btn-mealy');

  if (tabBtnMoore && tabBtnMealy) {
    tabBtnMoore.addEventListener('click', () => {
      activeDiagramTab = 'moore';
      tabBtnMoore.classList.add('active');
      tabBtnMealy.classList.remove('active');
      updateDiagrams();
    });

    tabBtnMealy.addEventListener('click', () => {
      activeDiagramTab = 'mealy';
      tabBtnMealy.classList.add('active');
      tabBtnMoore.classList.remove('active');
      updateDiagrams();
    });
  }

  // Run String Simulation (Asynchronous with Backend API + Local Engine Fallback)
  async function runSimulation() {
    if (!lastConversionResult) {
      await runConversion();
    }

    const testStr = simInputString.value.trim();
    if (!testStr) return;

    let simResult = null;
    try {
      const resp = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealy: lastConversionResult.mealy,
          moore: lastConversionResult.moore,
          inputString: testStr
        })
      });
      if (resp.ok) {
        simResult = await resp.json();
      }
    } catch (err) {
      // Fallback to client-side simulation engine
    }

    if (!simResult) {
      simResult = MealyToMooreConverter.simulateString(
        lastConversionResult.mealy,
        lastConversionResult.moore,
        testStr
      );
    }

    if (simResult.error) {
      alert(simResult.error);
      return;
    }

    // Render Mealy Trace
    const mealyTraceBox = document.getElementById('mealy-sim-trace');
    let mealyHTML = `
      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
        Mealy Output: <span style="color: var(--brand-primary); font-family: var(--font-mono); font-size: 1.1rem;">${simResult.mealy.outputString || 'ε'}</span>
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">(Length: ${simResult.mealy.outputList.length})</span>
      </div>
      <div class="sim-sequence-row">
    `;
    simResult.mealy.steps.forEach(st => {
      mealyHTML += `
        <div class="sim-chip">
          ${st.fromState} <span class="accent">--(${st.symbol}/${st.output})--></span> ${st.nextState}
        </div>
      `;
    });
    mealyHTML += `</div>`;
    mealyTraceBox.innerHTML = mealyHTML;

    // Render Moore Trace
    const mooreTraceBox = document.getElementById('moore-sim-trace');
    let mooreHTML = `
      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
        Moore Output: <span style="color: #15803d; font-family: var(--font-mono); font-size: 1.1rem;">${simResult.moore.outputString || 'ε'}</span>
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">(Length: ${simResult.moore.outputList.length})</span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
        Excluding initial state output (${simResult.moore.steps[0].stateOutput}): <strong style="color: #15803d; font-family: var(--font-mono);">${simResult.moore.outputStringWithoutInitial}</strong>
        ${simResult.isEquivalent ? '<span style="color: #15803d; font-weight: 700;"> (Strictly Equivalent to Mealy)</span>' : ''}
      </div>
      <div class="sim-sequence-row">
    `;
    simResult.moore.steps.forEach((st, idx) => {
      if (idx === 0) {
        mooreHTML += `
          <div class="sim-chip accent">
            Start at ${st.nextState} [Out: ${st.stateOutput}]
          </div>
        `;
      } else {
        mooreHTML += `
          <div class="sim-chip">
            ${st.fromState} <span class="accent">--(${st.symbol})--></span> ${st.nextState} [Out: ${st.stateOutput}]
          </div>
        `;
      }
    });
    mooreHTML += `</div>`;
    mooreTraceBox.innerHTML = mooreHTML;

    simResultsCard.style.display = 'block';
  }

  // Load a preset
  function loadPreset(presetKey) {
    const p = PRESETS[presetKey];
    if (!p) return;

    currentStates = [...p.states];
    currentInputs = [...p.inputs];
    currentInitialState = p.initialState;

    stateCountInput.value = currentStates.length;
    inputSymbolsInput.value = currentInputs.join(', ');

    refreshInitialStateDropdown();
    renderMealyMatrix(p.transitions);

    if (simInputString) {
      simInputString.value = p.sampleInput;
    }

    // Highlight active preset chip
    document.querySelectorAll('.preset-chip').forEach(chip => {
      if (chip.getAttribute('data-preset') === presetKey) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Auto-run conversion for seamless experience
    runConversion();
  }

  // Event Listeners for State & Input Controls
  stateCountInput.addEventListener('change', () => {
    let num = parseInt(stateCountInput.value, 10);
    if (isNaN(num) || num < 2) num = 2;
    if (num > 8) num = 8;
    stateCountInput.value = num;

    currentStates = [];
    for (let i = 1; i <= num; i++) {
      currentStates.push(`q${i}`);
    }
    if (!currentStates.includes(currentInitialState)) {
      currentInitialState = currentStates[0];
    }
    refreshInitialStateDropdown();
    renderMealyMatrix();
    runConversion();
  });

  inputSymbolsInput.addEventListener('change', () => {
    const raw = inputSymbolsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const uniqueInputs = Array.from(new Set(raw));
    if (uniqueInputs.length < 1) {
      currentInputs = ['a', 'b'];
    } else {
      currentInputs = uniqueInputs;
    }
    inputSymbolsInput.value = currentInputs.join(', ');
    renderMealyMatrix();
    runConversion();
  });

  initialStateSelect.addEventListener('change', () => {
    currentInitialState = initialStateSelect.value;
    renderMealyMatrix(getMealyMachineFromUI().transitions);
    runConversion();
  });

  // Preset chip clicks
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.getAttribute('data-preset');
      loadPreset(key);
    });
  });

  // Buttons
  convertBtn.addEventListener('click', () => {
    runConversion();
  });

  // Live dynamic updates: re-run conversion immediately whenever any table cell is modified
  matrixTableBody.addEventListener('change', () => {
    runConversion();
  });

  matrixTableBody.addEventListener('input', (e) => {
    if (e.target && e.target.classList.contains('matrix-input-output')) {
      runConversion();
    }
  });

  simulateBtn.addEventListener('click', () => {
    runSimulation();
  });

  if (simInputString) {
    simInputString.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSimulation();
      }
    });
  }

  // Export Modal Triggers
  const exportBtn = document.getElementById('export-modal-btn');
  const exportModal = document.getElementById('export-modal');
  const exportClose = document.getElementById('export-modal-close');
  const exportCopyLatex = document.getElementById('copy-latex-btn');
  const exportCopyMarkdown = document.getElementById('copy-markdown-btn');
  const exportContentBox = document.getElementById('export-content-box');

  if (exportBtn && exportModal) {
    exportBtn.addEventListener('click', () => {
      if (!lastConversionResult) runConversion();
      const moore = lastConversionResult.moore;

      // Build LaTeX
      let latex = `% Moore Machine Transition Table\n`;
      latex += `\\begin{table}[h]\n\\centering\n`;
      latex += `\\begin{tabular}{|c|` + moore.inputs.map(() => 'c|').join('') + `c|}\n\\hline\n`;
      latex += `Present State & ` + moore.inputs.map(i => `Next (${i})`).join(' & ') + ` & Output \\\\ \\hline\n`;
      moore.states.forEach(st => {
        const trans = moore.inputs.map(inp => moore.transitions[st][inp] || '-').join(' & ');
        latex += `${st} & ${trans} & ${moore.outputs[st]} \\\\ \\hline\n`;
      });
      latex += `\\end{tabular}\n\\caption{Moore Machine Matrix}\n\\end{table}\n`;

      exportContentBox.value = latex;
      exportModal.classList.add('open');
    });

    exportClose.addEventListener('click', () => {
      exportModal.classList.remove('open');
    });

    exportCopyLatex.addEventListener('click', () => {
      navigator.clipboard.writeText(exportContentBox.value);
      alert('LaTeX code copied to clipboard.');
    });

    exportCopyMarkdown.addEventListener('click', () => {
      if (!lastConversionResult) return;
      const moore = lastConversionResult.moore;
      let md = `| Present State | ${moore.inputs.map(i => `Next (${i})`).join(' | ')} | State Output |\n`;
      md += `| --- | ${moore.inputs.map(() => '---').join(' | ')} | --- |\n`;
      moore.states.forEach(st => {
        const trans = moore.inputs.map(inp => moore.transitions[st][inp] || '-').join(' | ');
        md += `| ${st} | ${trans} | ${moore.outputs[st]} |\n`;
      });
      navigator.clipboard.writeText(md);
      alert('Markdown table copied to clipboard.');
    });
  }

  // ==========================================
  // Progressive Web App (PWA) & Smart Install
  // ==========================================
  const installContainer = document.getElementById('pwa-install-container');
  const installBtn = document.getElementById('pwa-install-btn');
  let deferredInstallPrompt = null;

  // Rule 5: Check if running in standalone display mode on page load
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (installContainer && installBtn) {
    if (isStandalone) {
      // Keep permanently hidden in standalone installed mode
      installContainer.style.display = 'none';
    } else {
      // Rule 1: Hide install button by default
      installContainer.style.display = 'none';

      // Rule 2: Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;

        // Unhide install button if not in standalone mode
        if (!isStandalone) {
          installContainer.style.display = 'flex';
        }
      });

      // Rule 3: Trigger native installation prompt on click
      installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;

        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          installContainer.style.display = 'none';
        }
        deferredInstallPrompt = null;
      });

      // Rule 4: Listen for appinstalled event to dynamically hide button
      window.addEventListener('appinstalled', () => {
        installContainer.style.display = 'none';
        deferredInstallPrompt = null;
      });
    }
  }

  // Register Service Worker for PWA compliance
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(() => {
        // Offline / restricted sandbox fallback
      });
  }

  // Initial Boot: Load Preset 1
  loadPreset('preset1');
});
