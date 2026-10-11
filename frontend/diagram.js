/**
 * Mobile-Responsive State Transition Diagram SVG Visualizer with Touch Zoom & Pan
 * Author: Ashwajeet | Theory of Computation Platform
 */

class AutomataDiagramVisualizer {
  // Shared Pan & Zoom State
  static transform = {
    scale: 1,
    translateX: 0,
    translateY: 0
  };

  static isDragging = false;
  static startX = 0;
  static startY = 0;
  static initialPinchDistance = null;
  static initialScale = 1;
  static listenersAttached = false;
  static currentType = 'moore';
  static currentData = null;

  /**
   * Render an SVG transition diagram for a Mealy Machine.
   */
  static renderMealy(containerId, mealy) {
    this.currentType = 'mealy';
    this.currentData = mealy;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { states, inputs, transitions, initialState } = mealy;
    const width = 800;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;
    const n = states.length;
    const radius = n <= 2 ? 140 : Math.min(centerX, centerY) - 85;

    // Calculate node coordinates
    const nodeCoords = {};
    if (n === 2) {
      nodeCoords[states[0]] = { x: centerX - 140, y: centerY };
      nodeCoords[states[1]] = { x: centerX + 140, y: centerY };
    } else {
      states.forEach((st, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        nodeCoords[st] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    }

    let svg = `<svg id="diagram-svg-elem" class="diagram-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
    
    // Defs for arrows, filters, and text halos
    svg += `
      <defs>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb"/>
        </marker>
        <marker id="arrow-dark" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a"/>
        </marker>
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-3" dy="-3" stdDeviation="3" flood-color="#ffffff" flood-opacity="0.95"/>
          <feDropShadow dx="3" dy="3" stdDeviation="3" flood-color="#a6b4c8" flood-opacity="0.75"/>
        </filter>
      </defs>
    `;

    // Group transitions
    const edgeMap = {};
    states.forEach(fromSt => {
      inputs.forEach(inp => {
        const tr = transitions[fromSt] && transitions[fromSt][inp];
        if (tr) {
          const key = `${fromSt}->${tr.nextState}`;
          if (!edgeMap[key]) edgeMap[key] = [];
          edgeMap[key].push(`${inp}/${tr.output}`);
        }
      });
    });

    // Content container supporting interactive Pan & Zoom
    svg += `<g id="diagram-content-group" transform="translate(${this.transform.translateX}, ${this.transform.translateY}) scale(${this.transform.scale})">`;

    // 1. Draw Edges
    Object.keys(edgeMap).forEach(key => {
      const [fromSt, toSt] = key.split('->');
      const labels = edgeMap[key].join(', ');
      const p1 = nodeCoords[fromSt];
      const p2 = nodeCoords[toSt];
      if (!p1 || !p2) return;

      if (fromSt === toSt) {
        // Self-loop placed radially outward
        const dx = p1.x - centerX;
        const dy = p1.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = n === 2 ? 0 : dx / dist;
        const uy = n === 2 ? -1 : dy / dist;

        const loopRadius = 26;
        const loopCenterX = p1.x + ux * 36;
        const loopCenterY = p1.y + uy * 36;
        const labelBoxWidth = Math.max(48, labels.length * 9 + 14);

        svg += `
          <circle cx="${loopCenterX}" cy="${loopCenterY}" r="${loopRadius}" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-dasharray="2,2"/>
          <rect x="${loopCenterX + ux * 22 - labelBoxWidth/2}" y="${loopCenterY + uy * 22 - 11}" width="${labelBoxWidth}" height="20" rx="4" fill="#e6ecf4" stroke="rgba(166,180,200,0.6)" stroke-width="1"/>
          <text x="${loopCenterX + ux * 22}" y="${loopCenterY + uy * 22 + 4}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" text-anchor="middle">${labels}</text>
        `;
      } else {
        // Directed arc between two states
        const hasReverse = !!edgeMap[`${toSt}->${fromSt}`];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        const curveOffset = hasReverse ? 32 : 16;
        const cx = midX - (dy / norm) * curveOffset;
        const cy = midY + (dx / norm) * curveOffset;
        const labelBoxWidth = Math.max(48, labels.length * 9 + 14);

        svg += `
          <path d="M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}" fill="none" stroke="#2563eb" stroke-width="2.2" marker-end="url(#arrow-blue)"/>
          <rect x="${cx - labelBoxWidth/2}" y="${cy - 10}" width="${labelBoxWidth}" height="20" rx="4" fill="#e6ecf4" stroke="rgba(166,180,200,0.6)" stroke-width="1"/>
          <text x="${cx}" y="${cy + 5}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" text-anchor="middle">${labels}</text>
        `;
      }
    });

    // 2. Draw Nodes
    states.forEach(st => {
      const p = nodeCoords[st];
      const isInitial = st === initialState;

      if (isInitial) {
        svg += `
          <path d="M ${p.x - 62} ${p.y} L ${p.x - 34} ${p.y}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrow-dark)"/>
          <text x="${p.x - 68}" y="${p.y - 5}" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a" text-anchor="end">START</text>
        `;
      }

      svg += `
        <circle cx="${p.x}" cy="${p.y}" r="28" fill="#e6ecf4" stroke="${isInitial ? '#2563eb' : 'rgba(255,255,255,0.95)'}" stroke-width="${isInitial ? '3' : '2'}" filter="url(#node-shadow)"/>
        <text x="${p.x}" y="${p.y + 5}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800" text-anchor="middle">${st}</text>
      `;
    });

    svg += `</g></svg>`;
    container.innerHTML = svg;
    this.initInteractiveControls(containerId);
  }

  /**
   * Render an SVG transition diagram for a Moore Machine.
   */
  static renderMoore(containerId, moore) {
    this.currentType = 'moore';
    this.currentData = moore;
    const container = document.getElementById(containerId);
    if (!container) return;

    const { states, inputs, transitions, initialState, outputs } = moore;
    const width = 800;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;
    const n = states.length;
    const radius = n <= 2 ? 140 : Math.min(centerX, centerY) - 85;

    const nodeCoords = {};
    if (n === 2) {
      nodeCoords[states[0]] = { x: centerX - 140, y: centerY };
      nodeCoords[states[1]] = { x: centerX + 140, y: centerY };
    } else {
      states.forEach((st, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        nodeCoords[st] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    }

    let svg = `<svg id="diagram-svg-elem" class="diagram-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
    svg += `
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#15803d"/>
        </marker>
        <marker id="arrow-moore-dark" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a"/>
        </marker>
        <filter id="moore-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-3" dy="-3" stdDeviation="3" flood-color="#ffffff" flood-opacity="0.95"/>
          <feDropShadow dx="3" dy="3" stdDeviation="3" flood-color="#a6b4c8" flood-opacity="0.75"/>
        </filter>
      </defs>
    `;

    // Group transitions
    const edgeMap = {};
    states.forEach(fromSt => {
      inputs.forEach(inp => {
        const nextSt = transitions[fromSt] && transitions[fromSt][inp];
        if (nextSt) {
          const key = `${fromSt}->${nextSt}`;
          if (!edgeMap[key]) edgeMap[key] = [];
          edgeMap[key].push(inp);
        }
      });
    });

    svg += `<g id="diagram-content-group" transform="translate(${this.transform.translateX}, ${this.transform.translateY}) scale(${this.transform.scale})">`;

    // 1. Draw Edges
    Object.keys(edgeMap).forEach(key => {
      const [fromSt, toSt] = key.split('->');
      const labels = edgeMap[key].join(', ');
      const p1 = nodeCoords[fromSt];
      const p2 = nodeCoords[toSt];
      if (!p1 || !p2) return;

      if (fromSt === toSt) {
        const dx = p1.x - centerX;
        const dy = p1.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = n === 2 ? 0 : dx / dist;
        const uy = n === 2 ? -1 : dy / dist;

        const loopRadius = 26;
        const loopCenterX = p1.x + ux * 40;
        const loopCenterY = p1.y + uy * 40;
        const labelBoxWidth = Math.max(40, labels.length * 9 + 14);

        svg += `
          <circle cx="${loopCenterX}" cy="${loopCenterY}" r="${loopRadius}" fill="none" stroke="#15803d" stroke-width="2.2" stroke-dasharray="2,2"/>
          <rect x="${loopCenterX + ux * 24 - labelBoxWidth/2}" y="${loopCenterY + uy * 24 - 11}" width="${labelBoxWidth}" height="20" rx="4" fill="#e6ecf4" stroke="rgba(166,180,200,0.6)" stroke-width="1"/>
          <text x="${loopCenterX + ux * 24}" y="${loopCenterY + uy * 24 + 4}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" text-anchor="middle">${labels}</text>
        `;
      } else {
        const hasReverse = !!edgeMap[`${toSt}->${fromSt}`];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        const curveOffset = hasReverse ? 34 : 18;
        const cx = midX - (dy / norm) * curveOffset;
        const cy = midY + (dx / norm) * curveOffset;
        const labelBoxWidth = Math.max(40, labels.length * 9 + 14);

        svg += `
          <path d="M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}" fill="none" stroke="#15803d" stroke-width="2.2" marker-end="url(#arrow-green)"/>
          <rect x="${cx - labelBoxWidth/2}" y="${cy - 10}" width="${labelBoxWidth}" height="20" rx="4" fill="#e6ecf4" stroke="rgba(166,180,200,0.6)" stroke-width="1"/>
          <text x="${cx}" y="${cy + 5}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" text-anchor="middle">${labels}</text>
        `;
      }
    });

    // 2. Draw Nodes (State / Output)
    states.forEach(st => {
      const p = nodeCoords[st];
      const isInitial = st === initialState;
      const outVal = outputs[st] || '0';

      if (isInitial) {
        svg += `
          <path d="M ${p.x - 68} ${p.y} L ${p.x - 38} ${p.y}" stroke="#0f172a" stroke-width="2.5" marker-end="url(#arrow-moore-dark)"/>
          <text x="${p.x - 74}" y="${p.y - 5}" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="#0f172a" text-anchor="end">START</text>
        `;
      }

      svg += `
        <circle cx="${p.x}" cy="${p.y}" r="32" fill="#e6ecf4" stroke="${isInitial ? '#15803d' : 'rgba(255,255,255,0.95)'}" stroke-width="${isInitial ? '3' : '2'}" filter="url(#moore-node-shadow)"/>
        <line x1="${p.x - 24}" y1="${p.y}" x2="${p.x + 24}" y2="${p.y}" stroke="rgba(166, 180, 200, 0.7)" stroke-width="1.5"/>
        <text x="${p.x}" y="${p.y - 6}" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" text-anchor="middle">${st}</text>
        <text x="${p.x}" y="${p.y + 17}" fill="#15803d" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="800" text-anchor="middle">${outVal}</text>
      `;
    });

    svg += `</g></svg>`;
    container.innerHTML = svg;
    this.initInteractiveControls(containerId);
  }

  /**
   * Initialize Drag, Pan, Pinch-to-Zoom, and HUD button handlers
   */
  static initInteractiveControls(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const applyTransform = () => {
      const group = container.querySelector('#diagram-content-group');
      if (group) {
        group.setAttribute(
          'transform',
          `translate(${this.transform.translateX}, ${this.transform.translateY}) scale(${this.transform.scale})`
        );
      }
    };

    // Zoom Button Controls
    const zoomInBtn = document.getElementById('diagram-zoom-in');
    const zoomOutBtn = document.getElementById('diagram-zoom-out');
    const zoomResetBtn = document.getElementById('diagram-zoom-reset');

    if (zoomInBtn && !zoomInBtn.dataset.bound) {
      zoomInBtn.dataset.bound = 'true';
      zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transform.scale = Math.min(3.5, this.transform.scale + 0.25);
        applyTransform();
      });
    }

    if (zoomOutBtn && !zoomOutBtn.dataset.bound) {
      zoomOutBtn.dataset.bound = 'true';
      zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transform.scale = Math.max(0.5, this.transform.scale - 0.25);
        applyTransform();
      });
    }

    if (zoomResetBtn && !zoomResetBtn.dataset.bound) {
      zoomResetBtn.dataset.bound = 'true';
      zoomResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transform.scale = 1;
        this.transform.translateX = 0;
        this.transform.translateY = 0;
        applyTransform();
      });
    }

    if (this.listenersAttached) return;
    this.listenersAttached = true;

    // Desktop Mouse Drag / Pan
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.diagram-ctrl-btn')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.transform.translateX;
      this.startY = e.clientY - this.transform.translateY;
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.transform.translateX = e.clientX - this.startX;
      this.transform.translateY = e.clientY - this.startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        container.style.cursor = 'grab';
      }
    });

    // Mouse Wheel Zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.transform.scale = Math.min(3.5, Math.max(0.5, this.transform.scale * zoomFactor));
      applyTransform();
    }, { passive: false });

    // Touch Event Handling: Single-finger Pan & Two-finger Pinch-to-Zoom
    container.addEventListener('touchstart', (e) => {
      if (e.target.closest('.diagram-ctrl-btn')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.transform.translateX;
        this.startY = e.touches[0].clientY - this.transform.translateY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.initialScale = this.transform.scale;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.transform.translateX = e.touches[0].clientX - this.startX;
        this.transform.translateY = e.touches[0].clientY - this.startY;
        applyTransform();
      } else if (e.touches.length === 2 && this.initialPinchDistance) {
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDistance / this.initialPinchDistance;
        this.transform.scale = Math.min(3.5, Math.max(0.5, this.initialScale * factor));
        applyTransform();
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.initialPinchDistance = null;
      } else if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.transform.translateX;
        this.startY = e.touches[0].clientY - this.transform.translateY;
        this.initialPinchDistance = null;
      }
    });
  }
}

// Make accessible in browser and node
if (typeof window !== 'undefined') {
  window.AutomataDiagramVisualizer = AutomataDiagramVisualizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutomataDiagramVisualizer;
}
