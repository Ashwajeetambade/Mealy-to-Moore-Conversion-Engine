"""
Test Dynamic API Endpoints for FastAPI Backend
Author: Ashwajeet
"""

import urllib.request
import json

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# Test 1: Dynamic 3-state, 3-input alphabet machine (N=3, M=3)
print("=== DYNAMIC TEST 1: N=3 STATES, M=3 INPUTS (a, b, c) ===")
dynamic_machine = {
    "states": ["S0", "S1", "S2"],
    "inputs": ["a", "b", "c"],
    "initialState": "S0",
    "transitions": {
        "S0": {
            "a": {"nextState": "S1", "output": "0"},
            "b": {"nextState": "S2", "output": "1"},
            "c": {"nextState": "S0", "output": "0"}
        },
        "S1": {
            "a": {"nextState": "S0", "output": "1"},
            "b": {"nextState": "S1", "output": "0"},
            "c": {"nextState": "S2", "output": "0"}
        },
        "S2": {
            "a": {"nextState": "S2", "output": "1"},
            "b": {"nextState": "S0", "output": "0"},
            "c": {"nextState": "S1", "output": "1"}
        }
    }
}

res1 = post_json("http://127.0.0.1:8000/api/convert", dynamic_machine)
assert res1["success"] is True
print("Backend Conversion Success:", res1["success"])
print("Generated Moore States:", res1["moore"]["states"])
print("Generated Moore Outputs:", res1["moore"]["outputs"])
print("Total Step Explanations:", len(res1["stepExplanations"]))
for step in res1["stepExplanations"]:
    print(f"  Step {step['stepNumber']}: {step['title']} ({len(step['mathDetails'])} lines)")

# Test 2: Dynamic Simulation on N=3 Machine with string "abcba"
print("\n=== DYNAMIC TEST 2: SIMULATING 'abcba' ===")
sim_payload = {
    "mealy": dynamic_machine,
    "moore": res1["moore"],
    "inputString": "abcba"
}

sim_res = post_json("http://127.0.0.1:8000/api/simulate", sim_payload)
print("Input String:", sim_res["inputString"])
print("Mealy Output String:", sim_res["mealy"]["outputString"])
print("Moore Output String:", sim_res["moore"]["outputString"])
print("Moore (w/o initial):", sim_res["moore"]["outputStringWithoutInitial"])
print("Mathematically Equivalent:", sim_res["isEquivalent"])
assert sim_res["isEquivalent"] is True
assert sim_res["mealy"]["outputString"] == sim_res["moore"]["outputStringWithoutInitial"]

# Test 3: Large Dynamic Machine (N=5 States, M=2 Inputs)
print("\n=== DYNAMIC TEST 3: N=5 STATES (q1 to q5) ===")
large_machine = {
    "states": ["q1", "q2", "q3", "q4", "q5"],
    "inputs": ["0", "1"],
    "initialState": "q1",
    "transitions": {
        "q1": {"0": {"nextState": "q2", "output": "0"}, "1": {"nextState": "q3", "output": "1"}},
        "q2": {"0": {"nextState": "q4", "output": "1"}, "1": {"nextState": "q5", "output": "0"}},
        "q3": {"0": {"nextState": "q1", "output": "1"}, "1": {"nextState": "q2", "output": "0"}},
        "q4": {"0": {"nextState": "q3", "output": "0"}, "1": {"nextState": "q4", "output": "1"}},
        "q5": {"0": {"nextState": "q5", "output": "0"}, "1": {"nextState": "q1", "output": "0"}}
    }
}
res3 = post_json("http://127.0.0.1:8000/api/convert", large_machine)
assert res3["success"] is True
print("N=5 Machine Moore States:", res3["moore"]["states"])
print("N=5 Generated Outputs:", res3["moore"]["outputs"])

print("\nALL BACKEND API DYNAMIC COMPUTATION TESTS PASSED WITH 100% SUCCESS!")
