/**
 * Mealy to Moore Machine Mathematical Conversion Engine
 * Author: Ashwajeet | Theory of Computation Engine
 */

class MealyToMooreConverter {
  /**
   * Validate and convert a Mealy Machine specification to its equivalent Moore Machine.
   * 
   * @param {Object} mealy - Mealy machine representation
   *   states: ['q1', 'q2', ...]
   *   inputs: ['a', 'b', ...]
   *   initialState: 'q1'
   *   transitions: {
   *     'q1': { 'a': { nextState: 'q1', output: '1' }, 'b': { nextState: 'q2', output: '0' } },
   *     ...
   *   }
   * @returns {Object} Result containing Moore machine data and step-by-step explanations
   */
  static convert(mealy) {
    const { states, inputs, initialState, transitions } = mealy;

    // Step 1: Collect all incoming outputs for each state
    // incomingOutputs[state] = Set of outputs
    const incomingOutputs = {};
    states.forEach(st => {
      incomingOutputs[st] = new Set();
    });

    const incomingTransitions = {};
    states.forEach(st => {
      incomingTransitions[st] = [];
    });

    states.forEach(fromState => {
      inputs.forEach(inputSymbol => {
        const trans = transitions[fromState] && transitions[fromState][inputSymbol];
        if (trans && trans.nextState !== undefined && trans.output !== undefined) {
          const toState = trans.nextState;
          const outVal = String(trans.output).trim();
          if (incomingOutputs[toState]) {
            incomingOutputs[toState].add(outVal);
            incomingTransitions[toState].push({
              from: fromState,
              input: inputSymbol,
              output: outVal
            });
          }
        }
      });
    });

    // Step 2: Determine state splitting
    // If a state has multiple incoming outputs, split it into stateName + outputVal (e.g. q1 -> q10, q11)
    // If a state has 1 incoming output, say '0', it maps to q10 (or q1 with output 0)
    // If a state has 0 incoming outputs (e.g. only initial), assign standard default output or '-'
    const stateSplits = {}; // originalState -> [ { mooreStateName, output } ]
    const mooreStates = [];
    const stateOutputMap = {}; // mooreStateName -> output
    const splitLookup = {}; // originalState + '_' + output -> mooreStateName

    const stepExplanations = [];

    // Step 1 Explanation
    const step1Breakdown = states.map(st => {
      const outs = Array.from(incomingOutputs[st]).sort();
      const count = outs.length;
      const transList = incomingTransitions[st].map(t => `δ(${t.from}, ${t.input}) → (${t.output})`).join(', ') || 'No incoming transitions';
      return {
        state: st,
        outputs: outs,
        count: count,
        detail: `State ${st} receives outputs: { ${outs.join(', ') || 'none'} } via [${transList}].`
      };
    });

    stepExplanations.push({
      stepNumber: 1,
      title: "Identify Incoming Outputs per State",
      description: "Examine every transition in the Mealy machine matrix. Collect the set of all distinct output symbols associated with transitions entering each state.",
      mathDetails: step1Breakdown.map(b => b.detail)
    });

    // Step 2 Splitting logic & explanation
    const step2Breakdown = [];

    states.forEach(st => {
      const outs = Array.from(incomingOutputs[st]).sort();
      stateSplits[st] = [];

      if (outs.length === 0) {
        // No incoming transitions: retain single state with default/neutral output
        const defOut = "0"; // standard default output
        const mName = st;
        stateSplits[st].push({ name: mName, output: defOut, original: st });
        mooreStates.push(mName);
        stateOutputMap[mName] = defOut;
        splitLookup[`${st}_${defOut}`] = mName;
        splitLookup[`${st}_any`] = mName;

        step2Breakdown.push(
          `State ${st} has no incoming transitions. Retain single state ${mName} with default output '${defOut}'.`
        );
      } else if (outs.length === 1) {
        // Exactly one incoming output: single Moore state
        const singleOut = outs[0];
        // Standard naming: if state ends in digits, e.g. q1 -> q10 or q1 with output singleOut
        // To be clear and unambiguous, name it q1 + singleOut or st if unique
        const mName = `${st}${singleOut}`;
        stateSplits[st].push({ name: mName, output: singleOut, original: st });
        mooreStates.push(mName);
        stateOutputMap[mName] = singleOut;
        splitLookup[`${st}_${singleOut}`] = mName;

        step2Breakdown.push(
          `State ${st} has only 1 incoming output (${singleOut}). Convert to single Moore state ${mName} with state output = ${singleOut}.`
        );
      } else {
        // Multiple incoming outputs: split into separate states
        const createdNames = [];
        outs.forEach(outVal => {
          const mName = `${st}${outVal}`;
          stateSplits[st].push({ name: mName, output: outVal, original: st });
          mooreStates.push(mName);
          stateOutputMap[mName] = outVal;
          splitLookup[`${st}_${outVal}`] = mName;
          createdNames.push(`${mName} (output ${outVal})`);
        });

        step2Breakdown.push(
          `State ${st} has incoming transitions with outputs { ${outs.join(', ')} }. Split ${st} into ${createdNames.join(' and ')}.`
        );
      }
    });

    stepExplanations.push({
      stepNumber: 2,
      title: "Split States Based on Distinct Outputs",
      description: "In a Moore machine, outputs are mapped solely to states. Therefore, any Mealy state entered with k distinct outputs must be split into k distinct states, each assigned one unique output.",
      mathDetails: step2Breakdown
    });

    // Step 3: Reconstruct the Moore Transition Matrix
    // For every Moore state (which derives from an original state st):
    // For each input symbol a:
    // Original transition: δ(st, a) = nextSt, output = outVal
    // Target Moore state is splitLookup[`${nextSt}_${outVal}`]
    const mooreTransitions = {};
    const step3Breakdown = [];

    mooreStates.forEach(mState => {
      mooreTransitions[mState] = {};
      const origState = stateSplits[Object.keys(stateSplits).find(k => 
        stateSplits[k].some(s => s.name === mState)
      )]?.find(s => s.name === mState)?.original;

      inputs.forEach(inputSymbol => {
        const origTrans = transitions[origState] && transitions[origState][inputSymbol];
        if (origTrans) {
          const targetOrig = origTrans.nextState;
          const targetOut = String(origTrans.output).trim();
          let targetMoore = splitLookup[`${targetOrig}_${targetOut}`];

          // Fallback if targetOrig had no incoming or edge case
          if (!targetMoore && splitLookup[`${targetOrig}_any`]) {
            targetMoore = splitLookup[`${targetOrig}_any`];
          }
          if (!targetMoore && stateSplits[targetOrig] && stateSplits[targetOrig].length > 0) {
            targetMoore = stateSplits[targetOrig][0].name;
          }

          mooreTransitions[mState][inputSymbol] = targetMoore;

          step3Breakdown.push(
            `δ'(${mState}, ${inputSymbol}) = ${targetMoore} (derived from original transition δ(${origState}, ${inputSymbol}) = ${targetOrig} with output ${targetOut}).`
          );
        }
      });
    });

    stepExplanations.push({
      stepNumber: 3,
      title: "Reconstruct Moore Transition Table",
      description: "For every newly created Moore state, inherit the transitions of its parent state. Direct the transition to the specific target state whose output matches the original Mealy transition output.",
      mathDetails: step3Breakdown
    });

    // Step 4: Designate Moore Initial State & Output Equivalence Rule
    let mooreInitialState = null;
    const initialSplits = stateSplits[initialState] || [];
    if (initialSplits.length > 0) {
      mooreInitialState = initialSplits[0].name;
    } else {
      mooreInitialState = mooreStates[0] || initialState;
    }

    stepExplanations.push({
      stepNumber: 4,
      title: "Initial State Designation & Equivalence Note",
      description: "Designate the initial Moore state. Since a Moore machine emits an output before reading any input symbol, for any input string w, the output length is |w| + 1, whereas the Mealy output length is |w|. Omitting the initial output yields strictly identical strings.",
      mathDetails: [
        `Primary designated Moore initial state: ${mooreInitialState} (initial output = ${stateOutputMap[mooreInitialState]}).`,
        `Mathematical Equivalence: If Mealy output for string w is λ_Mealy(q0, w), then Moore output is λ_Moore(q0') · λ_Mealy(q0, w).`
      ]
    });

    return {
      success: true,
      mealy: {
        states,
        inputs,
        initialState,
        transitions
      },
      moore: {
        states: mooreStates,
        inputs,
        initialState: mooreInitialState,
        transitions: mooreTransitions,
        outputs: stateOutputMap
      },
      stateSplits,
      stepExplanations
    };
  }

  /**
   * Tokenize an input string supporting single and multi-character alphabet symbols
   */
  static tokenizeInput(inputString, alphabet) {
    const cleaned = inputString.trim();
    if (!cleaned) return [];
    if (cleaned.includes(' ') || cleaned.includes(',')) {
      return cleaned.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    }
    const sortedAlpha = [...alphabet].sort((a, b) => b.length - a.length);
    const tokens = [];
    let i = 0;
    while (i < cleaned.length) {
      let matched = false;
      for (const sym of sortedAlpha) {
        if (cleaned.startsWith(sym, i)) {
          tokens.push(sym);
          i += sym.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(cleaned[i]);
        i++;
      }
    }
    return tokens;
  }

  /**
   * Simulate a string on both Mealy and Moore machines side-by-side.
   */
  static simulateString(mealy, moore, inputString) {
    const symbols = MealyToMooreConverter.tokenizeInput(inputString, mealy.inputs);

    // Validate symbols against alphabet
    const validInputs = new Set(mealy.inputs);
    for (const sym of symbols) {
      if (!validInputs.has(sym)) {
        return {
          error: `Symbol '${sym}' is not in the input alphabet { ${mealy.inputs.join(', ')} }.`
        };
      }
    }

    // 1. Simulate Mealy
    let currMealyState = mealy.initialState;
    const mealySteps = [];
    const mealyOutputList = [];

    symbols.forEach((sym, idx) => {
      const trans = mealy.transitions[currMealyState] && mealy.transitions[currMealyState][sym];
      if (trans) {
        const nextSt = trans.nextState;
        const out = trans.output;
        mealySteps.push({
          stepIndex: idx + 1,
          fromState: currMealyState,
          symbol: sym,
          nextState: nextSt,
          output: out
        });
        mealyOutputList.push(out);
        currMealyState = nextSt;
      }
    });

    // 2. Simulate Moore
    let currMooreState = moore.initialState;
    const mooreSteps = [];
    const mooreOutputList = [];

    // Moore produces initial state output at step 0
    const initialMooreOutput = moore.outputs[currMooreState];
    mooreOutputList.push(initialMooreOutput);
    mooreSteps.push({
      stepIndex: 0,
      fromState: 'START',
      symbol: 'ε',
      nextState: currMooreState,
      stateOutput: initialMooreOutput,
      note: 'Initial state before reading input'
    });

    symbols.forEach((sym, idx) => {
      const nextSt = moore.transitions[currMooreState] && moore.transitions[currMooreState][sym];
      if (nextSt) {
        const out = moore.outputs[nextSt];
        mooreSteps.push({
          stepIndex: idx + 1,
          fromState: currMooreState,
          symbol: sym,
          nextState: nextSt,
          stateOutput: out
        });
        mooreOutputList.push(out);
        currMooreState = nextSt;
      }
    });

    return {
      inputString: symbols.join(''),
      mealy: {
        initialState: mealy.initialState,
        finalState: currMealyState,
        steps: mealySteps,
        outputString: mealyOutputList.join(''),
        outputList: mealyOutputList
      },
      moore: {
        initialState: moore.initialState,
        finalState: currMooreState,
        steps: mooreSteps,
        outputString: mooreOutputList.join(''),
        outputStringWithoutInitial: mooreOutputList.slice(1).join(''),
        outputList: mooreOutputList
      },
      isEquivalent: mealyOutputList.join('') === mooreOutputList.slice(1).join('')
    };
  }
}

// Make accessible to browser window and Node.js environments
if (typeof window !== 'undefined') {
  window.MealyToMooreConverter = MealyToMooreConverter;
}
if (typeof global !== 'undefined') {
  global.MealyToMooreConverter = MealyToMooreConverter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MealyToMooreConverter;
}
