import json
from typing import Dict, Any, List
from app.agents.state import LearnerProfile, KnowledgeGap
from app.agents.llm_gateway import LLMGateway

DIAGNOSTIC_SYSTEM_PROMPT = """You are the Senior Diagnostic & Knowledge Gap Detection Agent for CogniPath AI.
Your objective: Rigorously analyze a learner's subject, experience level, goal, and prior knowledge to construct a high-precision Knowledge Gap Profile.

CRITICAL GUIDELINES:
1. Ground your diagnosis in Bloom's Revised Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create).
2. For each identified knowledge gap, pinpoint the exact underlying MISCONCEPTION (not just what they don't know, but the flawed mental model that causes the confusion).
3. Assign severity: 'critical' (blocks progression), 'moderate' (causes errors), or 'minor' (sub-optimal).
4. Provide a concrete, actionable pedagogical remedy for each gap.
5. Identify at least 2 genuine strengths to reinforce learner confidence.
6. Return strictly valid JSON matching the exact schema below. No conversational fluff outside the JSON.

SCHEMA:
{
  "subject": "<string>",
  "overall_readiness_score": <int 0-100>,
  "cognitive_summary": "<2-3 sentence cognitive assessment of student's current mental models>",
  "identified_gaps": [
    {
      "concept_id": "<slug_id>",
      "concept_name": "<Concept Name>",
      "category": "<Category>",
      "mastery_score": <int 0-100>,
      "bloom_level": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create",
      "severity": "critical" | "moderate" | "minor",
      "misconception": "<precise description of student's flawed mental model>",
      "recommended_remedy": "<pedagogical technique/exercise to correct it>"
    }
  ],
  "strengths": [
    "<strength 1>",
    "<strength 2>"
  ]
}
"""

class DiagnosticAgent:
    def __init__(self, gateway: LLMGateway = None):
        self.gateway = gateway or LLMGateway()

    def diagnose(self, profile: LearnerProfile, diagnostic_answers: str = "") -> Dict[str, Any]:
        """
        Analyzes learner profile and answers to produce a comprehensive Knowledge Gap profile.
        """
        user_prompt = f"""
Learner Profile:
- Name: {profile.name}
- Target Subject: {profile.target_subject}
- Current Level: {profile.current_level}
- Target Learning Goal: {profile.target_goal}
- Preferred Learning Style: {profile.preferred_style}
- Weekly Time Commitment: {profile.time_commitment_hrs} hours
- Prior Knowledge Summary: {profile.prior_knowledge_summary or 'Self-reported level: ' + profile.current_level}

Diagnostic Responses / Work Samples:
{diagnostic_answers if diagnostic_answers else 'No direct work sample provided; deduce probable knowledge gaps and baseline misconceptions typical for this level and goal.'}

Analyze the learner thoroughly and return the JSON Knowledge Gap Profile.
"""
        raw_output = self.gateway.generate(DIAGNOSTIC_SYSTEM_PROMPT, user_prompt, temperature=0.2)
        parsed = self.gateway.extract_json(raw_output)

        if not parsed or "identified_gaps" not in parsed:
            # Fallback to simulated diagnostic output
            sim_raw = self.gateway._simulate_response(DIAGNOSTIC_SYSTEM_PROMPT, user_prompt)
            parsed = json.loads(sim_raw)

        return parsed

    def get_sample_diagnostic_questions(self, subject: str, level: str) -> List[Dict[str, Any]]:
        """
        Generates 3 fast diagnostic probe questions to test initial baseline.
        """
        prompt = f"""Generate 3 quick diagnostic probe questions for a {level} student learning '{subject}'.
Each question should probe a common conceptual misconception.
Return JSON:
[
  {{
    "id": "diag_1",
    "question": "<question>",
    "options": ["<opt A>", "<opt B>", "<opt C>", "<opt D>"],
    "misconception_checked": "<what error this detects>"
  }}
]
"""
        raw = self.gateway.generate(
            "You are an assessment probe generator. Return only JSON array.",
            prompt,
            temperature=0.3
        )
        parsed = self.gateway.extract_json(raw)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed

        # Default fallback probes
        return [
            {
                "id": "diag_1",
                "question": f"When approaching a new complex problem in {subject}, which aspect usually creates the most friction?",
                "options": [
                    "Translating high-level logic into syntax",
                    "Choosing the most efficient algorithm or design pattern",
                    "Debugging edge cases and resource consumption",
                    "Architecting modular, extensible abstractions"
                ],
                "misconception_checked": "Identifies primary friction layer"
            },
            {
                "id": "diag_2",
                "question": "How do you typically verify the correctness and performance of your solution?",
                "options": [
                    "Manual testing with sample inputs",
                    "Formal asymptotic complexity calculation (Big-O)",
                    "Automated unit testing with corner cases",
                    "Profiling memory allocations and execution latency"
                ],
                "misconception_checked": "Verification rigor"
            }
        ]
