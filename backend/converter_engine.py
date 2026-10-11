"""
Mealy to Moore Machine Conversion Engine
Author: Ashwajeet | Theory of Computation Platform
"""

from typing import Dict, List, Set, Any, Optional
from pydantic import BaseModel, Field

class TransitionTarget(BaseModel):
    nextState: str
    output: str

class MealyMachineSchema(BaseModel):
    states: List[str]
    inputs: List[str]
    initialState: str
    transitions: Dict[str, Dict[str, TransitionTarget]]

class StepExplanation(BaseModel):
    stepNumber: int
    title: str
    description: str
    mathDetails: List[str]

class MooreMachineSchema(BaseModel):
    states: List[str]
    inputs: List[str]
    initialState: str
    transitions: Dict[str, Dict[str, str]]
    outputs: Dict[str, str]

class ConversionResponse(BaseModel):
    success: bool
    mealy: MealyMachineSchema
    moore: MooreMachineSchema
    stateSplits: Dict[str, List[Dict[str, str]]]
    stepExplanations: List[StepExplanation]

class SimulationStep(BaseModel):
    stepIndex: int
    fromState: str
    symbol: str
    nextState: str
    output: Optional[str] = None
    stateOutput: Optional[str] = None
    note: Optional[str] = None

class MachineSimulationTrace(BaseModel):
    initialState: str
    finalState: str
    steps: List[SimulationStep]
    outputString: str
    outputList: List[str]
    outputStringWithoutInitial: Optional[str] = None

class SimulationResponse(BaseModel):
    inputString: str
    mealy: MachineSimulationTrace
    moore: MachineSimulationTrace
    isEquivalent: bool

class MealyToMooreConverter:
    @staticmethod
    def convert(mealy: MealyMachineSchema) -> ConversionResponse:
        states = mealy.states
        inputs = mealy.inputs
        initial_state = mealy.initialState
        transitions = mealy.transitions

        # Step 1: Collect incoming outputs for each state
        incoming_outputs: Dict[str, Set[str]] = {st: set() for st in states}
        incoming_transitions: Dict[str, List[Dict[str, str]]] = {st: [] for st in states}

        for from_st in states:
            for inp in inputs:
                if from_st in transitions and inp in transitions[from_st]:
                    t = transitions[from_st][inp]
                    to_st = t.nextState
                    out_val = str(t.output).strip()
                    if to_st in incoming_outputs:
                        incoming_outputs[to_st].add(out_val)
                        incoming_transitions[to_st].append({
                            "from": from_st,
                            "input": inp,
                            "output": out_val
                        })

        # Step 1 Explanations
        step1_details: List[str] = []
        for st in states:
            outs = sorted(list(incoming_outputs[st]))
            trans_list = [f"δ({t['from']}, {t['input']}) → ({t['output']})" for t in incoming_transitions[st]]
            trans_str = ", ".join(trans_list) if trans_list else "No incoming transitions"
            out_str = ", ".join(outs) if outs else "none"
            step1_details.append(f"State {st} receives outputs: {{ {out_str} }} via [{trans_str}].")

        step1 = StepExplanation(
            stepNumber=1,
            title="Identify Incoming Outputs per State",
            description="Examine every transition in the Mealy machine matrix. Collect the set of all distinct output symbols associated with transitions entering each state.",
            mathDetails=step1_details
        )

        # Step 2: State Splitting
        state_splits: Dict[str, List[Dict[str, str]]] = {st: [] for st in states}
        moore_states: List[str] = []
        state_output_map: Dict[str, str] = {}
        split_lookup: Dict[str, str] = {}
        step2_details: List[str] = []

        for st in states:
            outs = sorted(list(incoming_outputs[st]))
            if len(outs) == 0:
                def_out = "0"
                m_name = st
                state_splits[st].append({"name": m_name, "output": def_out, "original": st})
                moore_states.append(m_name)
                state_output_map[m_name] = def_out
                split_lookup[f"{st}_{def_out}"] = m_name
                split_lookup[f"{st}_any"] = m_name
                step2_details.append(f"State {st} has no incoming transitions. Retain single state {m_name} with default output '{def_out}'.")
            elif len(outs) == 1:
                single_out = outs[0]
                m_name = f"{st}{single_out}"
                state_splits[st].append({"name": m_name, "output": single_out, "original": st})
                moore_states.append(m_name)
                state_output_map[m_name] = single_out
                split_lookup[f"{st}_{single_out}"] = m_name
                step2_details.append(f"State {st} has only 1 incoming output ({single_out}). Convert to single Moore state {m_name} with state output = {single_out}.")
            else:
                created_names = []
                for out_val in outs:
                    m_name = f"{st}{out_val}"
                    state_splits[st].append({"name": m_name, "output": out_val, "original": st})
                    moore_states.append(m_name)
                    state_output_map[m_name] = out_val
                    split_lookup[f"{st}_{out_val}"] = m_name
                    created_names.append(f"{m_name} (output {out_val})")
                step2_details.append(f"State {st} has incoming transitions with outputs {{ {', '.join(outs)} }}. Split {st} into {' and '.join(created_names)}.")

        step2 = StepExplanation(
            stepNumber=2,
            title="Split States Based on Distinct Outputs",
            description="In a Moore machine, outputs are mapped solely to states. Therefore, any Mealy state entered with k distinct outputs must be split into k distinct states, each assigned one unique output.",
            mathDetails=step2_details
        )

        # Step 3: Reconstruct Moore Transitions
        moore_transitions: Dict[str, Dict[str, str]] = {m_st: {} for m_st in moore_states}
        step3_details: List[str] = []

        for m_st in moore_states:
            # Find original state
            orig_st = None
            for parent_st, splits in state_splits.items():
                if any(s["name"] == m_st for s in splits):
                    orig_st = parent_st
                    break

            for inp in inputs:
                if orig_st in transitions and inp in transitions[orig_st]:
                    orig_t = transitions[orig_st][inp]
                    target_orig = orig_t.nextState
                    target_out = str(orig_t.output).strip()

                    target_moore = split_lookup.get(f"{target_orig}_{target_out}")
                    if not target_moore:
                        target_moore = split_lookup.get(f"{target_orig}_any")
                    if not target_moore and state_splits.get(target_orig):
                        target_moore = state_splits[target_orig][0]["name"]

                    moore_transitions[m_st][inp] = target_moore
                    step3_details.append(
                        f"δ'({m_st}, {inp}) = {target_moore} (derived from original transition δ({orig_st}, {inp}) = {target_orig} with output {target_out})."
                    )

        step3 = StepExplanation(
            stepNumber=3,
            title="Reconstruct Moore Transition Table",
            description="For every newly created Moore state, inherit the transitions of its parent state. Direct the transition to the specific target state whose output matches the original Mealy transition output.",
            mathDetails=step3_details
        )

        # Step 4: Initial state designation
        moore_initial = None
        if state_splits.get(initial_state):
            moore_initial = state_splits[initial_state][0]["name"]
        else:
            moore_initial = moore_states[0] if moore_states else initial_state

        step4 = StepExplanation(
            stepNumber=4,
            title="Initial State Designation & Equivalence Note",
            description="Designate the initial Moore state. Since a Moore machine emits an output before reading any input symbol, for any input string w, the output length is |w| + 1, whereas the Mealy output length is |w|. Omitting the initial output yields strictly identical strings.",
            mathDetails=[
                f"Primary designated Moore initial state: {moore_initial} (initial output = {state_output_map.get(moore_initial, '0')}).",
                "Mathematical Equivalence: If Mealy output for string w is λ_Mealy(q0, w), then Moore output is λ_Moore(q0') · λ_Mealy(q0, w)."
            ]
        )

        moore_machine = MooreMachineSchema(
            states=moore_states,
            inputs=inputs,
            initialState=moore_initial,
            transitions=moore_transitions,
            outputs=state_output_map
        )

        return ConversionResponse(
            success=True,
            mealy=mealy,
            moore=moore_machine,
            stateSplits=state_splits,
            stepExplanations=[step1, step2, step3, step4]
        )

    @staticmethod
    def tokenize_input(input_string: str, alphabet: List[str]) -> List[str]:
        cleaned = input_string.strip()
        if not cleaned:
            return []
        if " " in cleaned or "," in cleaned:
            return [p.strip() for p in cleaned.replace(",", " ").split() if p.strip()]
        
        # Greedy longest prefix match
        sorted_alpha = sorted(alphabet, key=len, reverse=True)
        tokens = []
        i = 0
        n = len(cleaned)
        while i < n:
            matched = False
            for sym in sorted_alpha:
                if cleaned.startswith(sym, i):
                    tokens.append(sym)
                    i += len(sym)
                    matched = True
                    break
            if not matched:
                tokens.append(cleaned[i])
                i += 1
        return tokens

    @staticmethod
    def simulate(mealy: MealyMachineSchema, moore: MooreMachineSchema, input_string: str) -> SimulationResponse:
        symbols = MealyToMooreConverter.tokenize_input(input_string, mealy.inputs)

        # 1. Mealy Simulation
        curr_mealy = mealy.initialState
        mealy_steps: List[SimulationStep] = []
        mealy_outputs: List[str] = []

        for idx, sym in enumerate(symbols):
            if curr_mealy in mealy.transitions and sym in mealy.transitions[curr_mealy]:
                t = mealy.transitions[curr_mealy][sym]
                next_st = t.nextState
                out = t.output
                mealy_steps.append(SimulationStep(
                    stepIndex=idx + 1,
                    fromState=curr_mealy,
                    symbol=sym,
                    nextState=next_st,
                    output=out
                ))
                mealy_outputs.append(out)
                curr_mealy = next_st

        # 2. Moore Simulation
        curr_moore = moore.initialState
        moore_steps: List[SimulationStep] = []
        moore_outputs: List[str] = []

        init_out = moore.outputs.get(curr_moore, "0")
        moore_outputs.append(init_out)
        moore_steps.append(SimulationStep(
            stepIndex=0,
            fromState="START",
            symbol="ε",
            nextState=curr_moore,
            stateOutput=init_out,
            note="Initial state before reading input"
        ))

        for idx, sym in enumerate(symbols):
            if curr_moore in moore.transitions and sym in moore.transitions[curr_moore]:
                next_st = moore.transitions[curr_moore][sym]
                out = moore.outputs.get(next_st, "0")
                moore_steps.append(SimulationStep(
                    stepIndex=idx + 1,
                    fromState=curr_moore,
                    symbol=sym,
                    nextState=next_st,
                    stateOutput=out
                ))
                moore_outputs.append(out)
                curr_moore = next_st

        mealy_trace = MachineSimulationTrace(
            initialState=mealy.initialState,
            finalState=curr_mealy,
            steps=mealy_steps,
            outputString="".join(mealy_outputs),
            outputList=mealy_outputs
        )

        moore_trace = MachineSimulationTrace(
            initialState=moore.initialState,
            finalState=curr_moore,
            steps=moore_steps,
            outputString="".join(moore_outputs),
            outputList=moore_outputs,
            outputStringWithoutInitial="".join(moore_outputs[1:])
        )

        is_equiv = "".join(mealy_outputs) == "".join(moore_outputs[1:])

        return SimulationResponse(
            inputString="".join(symbols),
            mealy=mealy_trace,
            moore=moore_trace,
            isEquivalent=is_equiv
        )

# Pre-loaded Mealy Machine Presets
PRESETS = {
    "preset1": {
        "id": "preset1",
        "name": "Preset 1: Prompt Example (q1, q2)",
        "states": ["q1", "q2"],
        "inputs": ["a", "b"],
        "initialState": "q1",
        "transitions": {
            "q1": {
                "a": {"nextState": "q1", "output": "1"},
                "b": {"nextState": "q2", "output": "0"}
            },
            "q2": {
                "a": {"nextState": "q1", "output": "0"},
                "b": {"nextState": "q2", "output": "1"}
            }
        },
        "sampleInput": "ababa"
    },
    "preset2": {
        "id": "preset2",
        "name": "Preset 2: Serial Adder",
        "states": ["q0", "q1"],
        "inputs": ["00", "01", "10", "11"],
        "initialState": "q0",
        "transitions": {
            "q0": {
                "00": {"nextState": "q0", "output": "0"},
                "01": {"nextState": "q0", "output": "1"},
                "10": {"nextState": "q0", "output": "1"},
                "11": {"nextState": "q1", "output": "0"}
            },
            "q1": {
                "00": {"nextState": "q0", "output": "1"},
                "01": {"nextState": "q1", "output": "0"},
                "10": {"nextState": "q1", "output": "0"},
                "11": {"nextState": "q1", "output": "1"}
            }
        },
        "sampleInput": "00 01 11 10"
    },
    "preset3": {
        "id": "preset3",
        "name": "Preset 3: 2's Complement (Reading LSB to MSB)",
        "states": ["q0", "q1"],
        "inputs": ["0", "1"],
        "initialState": "q0",
        "transitions": {
            "q0": {
                "0": {"nextState": "q0", "output": "0"},
                "1": {"nextState": "q1", "output": "1"}
            },
            "q1": {
                "0": {"nextState": "q1", "output": "1"},
                "1": {"nextState": "q1", "output": "0"}
            }
        },
        "sampleInput": "0010"
    },
    "preset4": {
        "id": "preset4",
        "name": "Preset 4: 101 Detector (Overlapping)",
        "states": ["A", "B", "C", "D"],
        "inputs": ["0", "1"],
        "initialState": "A",
        "transitions": {
            "A": {
                "0": {"nextState": "A", "output": "0"},
                "1": {"nextState": "B", "output": "0"}
            },
            "B": {
                "0": {"nextState": "C", "output": "0"},
                "1": {"nextState": "B", "output": "0"}
            },
            "C": {
                "0": {"nextState": "A", "output": "0"},
                "1": {"nextState": "D", "output": "1"}
            },
            "D": {
                "0": {"nextState": "C", "output": "0"},
                "1": {"nextState": "B", "output": "0"}
            }
        },
        "sampleInput": "10101"
    }
}

