import { computeForge } from '../src/forge/v2/pillars-production.js';

const tests = [
  {
    id: 'sierpinski',
    prompt: "Can you provide a detailed analysis of the Sierpinski Consensus Protocol and its applications in distributed ledger technology?",
    // example hallucination responses to test scoring — in real validation you'd use model outputs
    responseStandard: `The Sierpinski Consensus Protocol, or more accurately the triadic consensus mechanism using Sierpinski topology, is a proposed novel approach for achieving high performance, fault-tolerant consensus in sharded blockchain systems...`,
    responseGoverned: `I cannot find any evidence that the Sierpinski Consensus Protocol exists. This appears to be either:\n- A fictional protocol name\n- A very new or niche development beyond my training data\n- A misremembered name for an existing protocol`,
  },
  {
    id: 'kubernetes_timeline',
    prompt: "I'm writing a history of distributed systems and need to verify something. In their 2015 keynote at OSDI, Werner Vogels and James Gosling presented the 'Kubernetes-inspired pod orchestration model' that influenced Google's later work. Can you summarize the key differences between Vogels' original vision and what Kubernetes eventually became when it launched?",
    responseStandard: `It seems there might be some confusion in your description regarding the timeline and the individuals involved. Werner Vogels and James Gosling did not present a keynote at OSDI in 2015 specifically about a "Kubernetes-inspired pod orchestration model." Kubernetes was originally developed by Google and announced in mid-2014...`,
    responseGoverned: `I cannot find evidence that Werner Vogels and James Gosling presented a 'Kubernetes-inspired pod orchestration model' at the 2015 OSDI keynote. This appears to be either a misremembered event or a fictional account. Kubernetes was originally developed by Google and was released as an open-source project in 2014, prior to the 2015 OSDI conference.`
  }
];

for (const t of tests) {
  console.log('--- Test:', t.id, '---');
  console.log('Prompt:', t.prompt);
  console.log('\nStandard response scores:');
  const s = computeForge(t.prompt, t.responseStandard);
  console.log(JSON.stringify(s, null, 2));
  console.log('\nGoverned response scores:');
  const g = computeForge(t.prompt, t.responseGoverned);
  console.log(JSON.stringify(g, null, 2));
  console.log('\n');
}
