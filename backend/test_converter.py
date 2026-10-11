"""
Unit Tests for Python Mealy to Moore Converter Engine
Author: Ashwajeet
"""

import sys
from converter_engine import (
    MealyToMooreConverter,
    MealyMachineSchema,
    TransitionTarget
)

def test_prompt_example():
    print("=== TEST 1: PROMPT EXAMPLE (PYTHON BACKEND) ===")
    mealy = MealyMachineSchema(
        states=["q1", "q2"],
        inputs=["a", "b"],
        initialState="q1",
        transitions={
            "q1": {
                "a": TransitionTarget(nextState="q1", output="1"),
                "b": TransitionTarget(nextState="q2", output="0"),
            },
            "q2": {
                "a": TransitionTarget(nextState="q1", output="0"),
                "b": TransitionTarget(nextState="q2", output="1"),
            }
        }
    )

    res = MealyToMooreConverter.convert(mealy)
    assert res.success is True
    assert set(res.moore.states) == {"q10", "q11", "q20", "q21"}
    assert res.moore.outputs["q10"] == "0"
    assert res.moore.outputs["q11"] == "1"
    assert res.moore.outputs["q20"] == "0"
    assert res.moore.outputs["q21"] == "1"
    assert res.moore.transitions["q10"]["a"] == "q11"
    assert res.moore.transitions["q10"]["b"] == "q20"
    assert res.moore.transitions["q20"]["a"] == "q10"
    assert res.moore.transitions["q20"]["b"] == "q21"

    print("States:", res.moore.states)
    print("Outputs:", res.moore.outputs)
    print("Transitions Verified Successfully!")

    sim = MealyToMooreConverter.simulate(res.mealy, res.moore, "ababa")
    assert sim.isEquivalent is True
    assert sim.mealy.outputString == "10000"
    assert sim.moore.outputString == "010000"
    print("Simulation: Mealy output =", sim.mealy.outputString, "| Moore output =", sim.moore.outputString)
    print("Strict Equivalence Verified:", sim.isEquivalent)

def test_serial_adder():
    print("\n=== TEST 2: SERIAL ADDER (PYTHON BACKEND) ===")
    mealy = MealyMachineSchema(
        states=["q0", "q1"],
        inputs=["0", "1"],
        initialState="q0",
        transitions={
            "q0": {
                "0": TransitionTarget(nextState="q0", output="0"),
                "1": TransitionTarget(nextState="q0", output="1"),
            },
            "q1": {
                "0": TransitionTarget(nextState="q0", output="1"),
                "1": TransitionTarget(nextState="q1", output="0"),
            }
        }
    )
    res = MealyToMooreConverter.convert(mealy)
    assert res.success is True
    assert "q00" in res.moore.states
    assert "q01" in res.moore.states
    assert "q10" in res.moore.states
    print("Serial Adder States:", res.moore.states)
    print("Serial Adder Verified Successfully!")

if __name__ == "__main__":
    test_prompt_example()
    test_serial_adder()
    print("\nALL PYTHON BACKEND TESTS PASSED WITH 100% SUCCESS!")
