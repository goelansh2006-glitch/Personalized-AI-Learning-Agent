import json
from typing import Dict, Any, List
from app.agents.state import AssessmentQuestion
from app.agents.llm_gateway import LLMGateway

ASSESSMENT_SYSTEM_PROMPT = """You are the Senior Psychometrician & Adaptive Assessment Agent for CogniPath AI.
Your objective: Construct high-discrimination diagnostic assessment questions targeting a specific learning node and its underlying concepts.

CRITICAL ASSESSMENT RULES:
1. Every incorrect distractor MUST represent a common, authentic misconception or cognitive error (not a trivial typo or silly trick).
2. For every option, provide a `misconception_tag` and a `feedback_rationale` explaining why a student would pick it and how to steer them right.
3. Align questions with Bloom's Taxonomy cognitive depths (prefer Analyze, Apply, and Evaluate over rote Remember).
4. Frame realistic real-world or code scenarios where appropriate.
5. Return strictly valid JSON adhering to the schema below.

SCHEMA:
{
  "node_id": "<string>",
  "concept_name": "<string>",
  "questions": [
    {
      "id": "q1",
      "node_id": "<string>",
      "concept_name": "<string>",
      "question_text": "<Clear, challenging scenario or question>",
      "question_type": "mcq",
      "bloom_level": "Understand" | "Apply" | "Analyze" | "Evaluate",
      "difficulty": "Easy" | "Medium" | "Hard",
      "options": [
        {
          "id": "A",
          "text": "<Option text>",
          "is_correct": false,
          "misconception_tag": "<flawed mental model tag, e.g. off_by_one_error>",
          "feedback_rationale": "<Pedagogical feedback explaining the mistake>"
        },
        {
          "id": "B",
          "text": "<Option text>",
          "is_correct": true,
          "misconception_tag": null,
          "feedback_rationale": "<Reinforcement of correct reasoning>"
        },
        {
          "id": "C",
          "text": "<Option text>",
          "is_correct": false,
          "misconception_tag": "<tag>",
          "feedback_rationale": "<feedback>"
        },
        {
          "id": "D",
          "text": "<Option text>",
          "is_correct": false,
          "misconception_tag": "<tag>",
          "feedback_rationale": "<feedback>"
        }
      ],
      "correct_answer": "B",
      "detailed_explanation": "<Comprehensive explanation connecting theory to practice>"
    }
  ]
}
"""

class AssessmentAgent:
    def __init__(self, gateway: LLMGateway = None):
        self.gateway = gateway or LLMGateway()

    def generate_assessment(self, node: Dict[str, Any], count: int = 2) -> Dict[str, Any]:
        """
        Generates tailored assessment questions for a learning node.
        """
        user_prompt = f"""
Target Learning Node:
- Node ID: {node.get('id', 'node_1')}
- Title: {node.get('title', 'Core Concept')}
- Description: {node.get('description', '')}
- Bloom Target Level: {node.get('bloom_target', 'Apply')}
- Key Takeaways: {', '.join(node.get('key_takeaways', []))}
- Is Remedial: {node.get('is_remedial', False)}
- Remediation Reason: {node.get('remediation_reason', 'Standard progression')}

Number of Questions Requested: {count}

Generate a precision diagnostic assessment that rigorously tests conceptual understanding and detects subtle misconceptions.
"""
        raw_output = self.gateway.generate(ASSESSMENT_SYSTEM_PROMPT, user_prompt, temperature=0.3)
        parsed = self.gateway.extract_json(raw_output)

        if not parsed or "questions" not in parsed or not isinstance(parsed["questions"], list):
            # Fallback to simulated questions
            sim_raw = self.gateway._simulate_response(ASSESSMENT_SYSTEM_PROMPT, user_prompt)
            parsed = json.loads(sim_raw)

        return parsed
