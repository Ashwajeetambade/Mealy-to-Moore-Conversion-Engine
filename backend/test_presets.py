"""
Test all 4 Standard TOC Presets (Section 3.6)
Author: Ashwajeet
"""

import urllib.request
import json

def get_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# 1. Fetch Presets from Backend
presets = get_json("http://127.0.0.1:8000/api/presets")
print("Fetched Presets Keys:", list(presets.keys()))
assert "preset1" in presets
assert "preset2" in presets
assert "preset3" in presets
assert "preset4" in presets

# 2. Test Each Preset Conversion & Simulation
for p_key in ["preset1", "preset2", "preset3", "preset4"]:
    p = presets[p_key]
    print(f"\n==========================================")
    print(f"Testing {p['name']}")
    print(f"States: {p['states']} | Alphabet: {p['inputs']} | Initial: {p['initialState']}")
    
    # Test Conversion
    conv_res = post_json("http://127.0.0.1:8000/api/convert", p)
    assert conv_res["success"] is True
    print(f"Moore States: {conv_res['moore']['states']}")
    print(f"Moore Outputs: {conv_res['moore']['outputs']}")
    print(f"Step Explanations: {len(conv_res['stepExplanations'])} steps generated")

    # Test Simulation
    sim_payload = {
        "mealy": p,
        "moore": conv_res["moore"],
        "inputString": p["sampleInput"]
    }
    sim_res = post_json("http://127.0.0.1:8000/api/simulate", sim_payload)
    print(f"Simulating: '{p['sampleInput']}'")
    print(f"Mealy Output: {sim_res['mealy']['outputString']}")
    print(f"Moore Output: {sim_res['moore']['outputString']}")
    print(f"Is Strictly Equivalent: {sim_res['isEquivalent']}")
    assert sim_res["isEquivalent"] is True

print("\n==========================================")
print("ALL 4 PRESETS CONVERTED AND SIMULATED WITH 100% ACCURACY!")
