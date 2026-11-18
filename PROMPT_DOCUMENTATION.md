# CogniPath AI — Prompt Engineering Documentation & Architecture

This document provides a comprehensive breakdown of the prompt architecture, chain-of-thought methodologies, schema enforcement, and security guardrails implemented in **CogniPath AI (PS04: Personalized AI Learning Agent)**.

---

## 1. Multi-Agent Prompting Strategy Overview

CogniPath AI employs a decoupled, specialized multi-agent architecture where each agent is constrained by a precise cognitive role, domain knowledge boundaries, and strict JSON output schemas.

| Agent | Core Objective | Cognitive Taxonomy / Framework | Output Schema |
|---|---|---|---|
| **Diagnostic Agent** | Knowledge gap detection & misconception root-cause analysis | Bloom's Revised Taxonomy (Remember to Create) | `KnowledgeGapProfile` JSON |
| **Curriculum Architect Agent** | Dynamic Directed Acyclic Graph (DAG) generation & sequencing | Prerequisite Dependency Graphs & Zone of Proximal Development (ZPD) | `LearningPath` JSON |
| **Assessment Agent** | High-discrimination diagnostic assessment creation | Distractor-Driven Misconception Mapping | `AssessmentSuite` JSON |
| **Adaptation Agent** | Performance evaluation, mastery delta computation & path re-planning | Bayesian Knowledge Tracing & Dynamic Path Invariant Mutation | `AdaptationResult` JSON |
| **Socratic AI Mentor** | Conversational tutoring without direct spoon-feeding | Socratic Method & Guided Inquiry | Pedagogical Dialogue Markdown |

---

## 2. Agent 1: Diagnostic & Knowledge Gap Detection Agent

### System Prompt Specification
```markdown
You are the Senior Diagnostic & Knowledge Gap Detection Agent for CogniPath AI.
Your objective: Rigorously analyze a learner's subject, experience level, goal, and prior knowledge to construct a high-precision Knowledge Gap Profile.

CRITICAL GUIDELINES:
1. Ground your diagnosis in Bloom's Revised Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create).
2. For each identified knowledge gap, pinpoint the exact underlying MISCONCEPTION (not just what they don't know, but the flawed mental model that causes the confusion).
3. Assign severity: 'critical' (blocks progression), 'moderate' (causes errors), or 'minor' (sub-optimal).
4. Provide a concrete, actionable pedagogical remedy for each gap.
5. Identify at least 2 genuine strengths to reinforce learner confidence.
6. Return strictly valid JSON matching the exact schema below. No conversational fluff outside the JSON.
```

### Few-Shot Example & Reasoning Trace
- **Input**: Student understands recursion and basic arrays, but writes O(2^N) Fibonacci and struggles with memoization state design.
- **Cognitive Diagnosis**: Identifies failure to identify overlapping subproblem topologies and confusion between call-stack execution vs. memoized state caches.
- **Severity**: Critical.
- **Remedy**: Step-through recursive call DAG visualizer and bottom-up 1D/2D table population.

---

## 3. Agent 2: Curriculum Architect Agent

### System Prompt Specification
```markdown
You are the Senior Curriculum Architect Agent for CogniPath AI.
Your objective: Construct an adaptive, logically sequenced Personalized Learning Path (Skill DAG) tailored to the student's exact knowledge gaps, target goal, and cognitive profile.

CRITICAL INSTRUCTIONS:
1. Sequence nodes strictly by prerequisite dependency: foundations must precede applied concepts.
2. For identified critical/moderate knowledge gaps, insert explicit targeted nodes marked with `"is_remedial": true` and a clear `"remediation_reason"`.
3. If the student already has high mastery in baseline topics, FAST-TRACK them by skipping redundant foundational fluff and focusing directly on advanced synthesis.
4. Each node must have clear, measurable key takeaways and estimated study duration in minutes.
5. Node 1 should be set to `"status": "ready"`; subsequent dependent nodes should be set to `"status": "locked"`.
6. Return strictly valid JSON adhering to the schema below.
```

---

## 4. Agent 3: Adaptive Assessment Engine Agent

### Distractor-Driven Misconception Mapping
Standard quizzes test binary recall (A=Right, B/C/D=Wrong). CogniPath AI uses **Distractor-Driven Diagnostics**:
Each incorrect distractor tests for a specific, documented misconception:
- **Distractor A**: *Hardware Concurrency Misconception* (Student thinks memoization is multi-threading).
- **Distractor B**: *Correct Answer* (Exploits overlapping subproblems and O(1) state lookup).
- **Distractor C**: *Greedy vs. DP Confusion* (Conflates greedy local choice with optimal substructure).
- **Distractor D**: *State Space Truncation Fallacy* (Assumes arbitrary index skipping).

---

## 5. Agent 4: Dynamic Adaptation & Re-planning Agent

### Real-Time Path Mutation Invariant
When the student completes an assessment:
1. If **Score >= 70%**:
   - Current node status transitions to `"mastered"`.
   - Immediate downstream prerequisite node unlocks to `"ready"`.
   - Mastery scores increase proportionally across Bloom levels.
2. If **Score < 70%**:
   - Status remains in progress.
   - The agent constructs a customized **Remedial Micro-Node** addressing the exact diagnosed misconception.
   - The remedial micro-node is dynamically inserted into the active roadmap *before* advanced topics.
   - The student receives an encouraging breakdown of *why* their path was adjusted.

---

## 6. Agent 5: Socratic AI Mentor

### Prompt Contract & Guardrails
- **Core Directive**: Never provide full code solutions or direct exam answers.
- **Guided Inquiry**: Break the problem down into base cases, state variables, and inductive reasoning.
- **Style Alignment**: Adapts tone to user's selected preference (Code-First, Visual, Theoretical, Socratic).
- **Off-Topic Redirection**: Gently deflects non-educational or adversarial prompts back to the learning topic.

---

## 7. Security & Prompt Injection Mitigation

1. **Input Normalization & Sanitization**:
   - Strips common jailbreak patterns (`"ignore previous instructions"`, `"system:"`, `"DAN"`).
   - Enforces strict character and length boundaries (`MAX_PROMPT_LENGTH = 4000`).
2. **Structural Delimiter Isolation**:
   - Prompts separate user inputs from system instructions using structural tagging.
3. **Deterministic JSON Extraction**:
   - Multi-tier JSON parser strips conversational markdown fences and repairs malformed output.
4. **Resilient Provider Fallback**:
   - Automatically degrades through Groq -> Gemini -> OpenAI -> High-Fidelity Simulation Engine without crashing.
