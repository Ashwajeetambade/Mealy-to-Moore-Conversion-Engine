const MealyToMooreConverter = require('../frontend/converter.js');

// Test 1: Prompt Example
console.log('=== TEST 1: PROMPT EXAMPLE ===');
const mealy1 = {
  states: ['q1', 'q2'],
  inputs: ['a', 'b'],
  initialState: 'q1',
  transitions: {
    'q1': { 'a': { nextState: 'q1', output: '1' }, 'b': { nextState: 'q2', output: '0' } },
    'q2': { 'a': { nextState: 'q1', output: '0' }, 'b': { nextState: 'q2', output: '1' } }
  }
};

const res1 = MealyToMooreConverter.convert(mealy1);
console.log('Moore States:', res1.moore.states);
console.log('Outputs:', res1.moore.outputs);
console.log('Transitions:', JSON.stringify(res1.moore.transitions, null, 2));

console.log('\n--- Step Explanations ---');
res1.stepExplanations.forEach(s => {
  console.log(`[Step ${s.stepNumber}] ${s.title}`);
  s.mathDetails.forEach(d => console.log('  •', d));
});

console.log('\n--- Simulation Trace (ababa) ---');
const sim1 = MealyToMooreConverter.simulateString(res1.mealy, res1.moore, 'ababa');
console.log('Mealy Output Sequence:', sim1.mealy.outputString);
console.log('Moore Output Sequence:', sim1.moore.outputString);
console.log('Moore (excluding initial):', sim1.moore.outputStringWithoutInitial);
console.log('Is Strictly Equivalent?:', sim1.isEquivalent);

// Test 2: Serial Adder
console.log('\n=== TEST 2: SERIAL BINARY ADDER ===');
const mealy2 = {
  states: ['q0', 'q1'],
  inputs: ['0', '1'],
  initialState: 'q0',
  transitions: {
    'q0': { '0': { nextState: 'q0', output: '0' }, '1': { nextState: 'q0', output: '1' } },
    'q1': { '0': { nextState: 'q0', output: '1' }, '1': { nextState: 'q1', output: '0' } }
  }
};
const res2 = MealyToMooreConverter.convert(mealy2);
console.log('Moore States:', res2.moore.states);
console.log('Outputs:', res2.moore.outputs);
console.log('Transitions:', JSON.stringify(res2.moore.transitions, null, 2));

console.log('\nALL CONVERSION TESTS COMPLETED SUCCESSFULLY!');
