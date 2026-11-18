import json
from typing import Dict, Any, List
from app.agents.state import AssessmentResult, LearningPath
from app.agents.llm_gateway import LLMGateway

ADAPTATION_SYSTEM_PROMPT = """You are the Senior Adaptive Recommender & Learning Optimization Agent for CogniPath AI.
Your objective: Rigorously evaluate a student's assessment performance, diagnose exact misconceptions, calculate mastery shifts, and adaptively modify their ongoing Learning Path in real-time.

CRITICAL INSTRUCTIONS:
1. Examine each question, the student's selected answer, whether it was correct, and the misconception tag of the chosen distractor.
2. If the student passed (score >= 70%):
   - Mark the current node as "mastered".
   - Unlock the immediate subsequent node.
   - Boost mastery delta (+10 to +25 points).
3. If the student struggled (score < 70%):
   - Do NOT simply force them to repeat the exact same test.
   - Adaptively synthesize a targeted Remedial Micro-Node (e.g., 'Remediation: Intuition on [Weak Concept]') and insert it directly into the Learning Path before advanced topics.
   - Set `adaptation_applied: true` and write an encouraging, clear `path_change_description`.
4. Return strictly valid JSON adhering to the schema below.

SCHEMA:
{
  "score": <int>,
  "total_questions": <int>,
  "percentage": <float>,
  "passed": <bool>,
  "concept_mastery_delta": {
    "<Concept Name>": <int shift e.g. +15 or -10>
  },
  "detected_misconceptions": [
    {
      "concept": "<Concept Name>",
      "tag": "<tag>",
      "explanation": "<why this misconception occurred and how to reframe mental model>"
    }
  ],
  "feedback_summary": "<Actionable summary highlighting what was done well and the exact cognitive fix needed>",
  "adaptation_applied": <bool>,
  "path_change_description": "<Clear explanation of how the learning path was dynamically altered>",
  "remedial_node": {
    "id": "<remedial_node_id>",
    "title": "<Remedial: Module Title>",
    "category": "Remediation",
    "prerequisites": [],
    "estimated_minutes": <int 15-30>,
    "bloom_target": "Understand",
    "status": "ready",
    "is_remedial": true,
    "remediation_reason": "<Why this was injected>",
    "description": "<Focused breakdown to repair the specific detected misconception>",
    "key_takeaways": [
      "<focused takeaway 1>",
      "<focused takeaway 2>"
    ],
    "resource_links": [
      {"title": "<Reference>", "url": "https://en.wikipedia.org"}
    ]
  }
}
"""

class AdaptationAgent:
    def __init__(self, gateway: LLMGateway = None):
        self.gateway = gateway or LLMGateway()

    def evaluate_and_adapt(
        self,
        node: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: Dict[str, str], # {question_id: selected_option_id}
        current_path: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Grades student answers, identifies misconception tags, and modifies the learning path.
        """
        # Step 1: Deterministic preliminary scoring
        score = 0
        total = len(questions)
        detected_misconceptions = []

        q_breakdown = []
        for q in questions:
            qid = q.get("id")
            selected_opt_id = answers.get(qid, "").strip().upper()
            correct_opt_id = q.get("correct_answer", "").strip().upper()
            is_correct = (selected_opt_id == correct_opt_id)

            if is_correct:
                score += 1

            # Identify if selected option has misconception tag
            chosen_option = next((opt for opt in q.get("options", []) if opt.get("id") == selected_opt_id), None)
            misconception_tag = chosen_option.get("misconception_tag") if chosen_option else None
            feedback = chosen_option.get("feedback_rationale") if chosen_option else ""

            if not is_correct and misconception_tag:
                detected_misconceptions.append({
                    "concept": q.get("concept_name", node.get("title", "Concept")),
                    "tag": misconception_tag,
                    "explanation": feedback or f"Detected misconception: {misconception_tag}"
                })

            q_breakdown.append({
                "question_id": qid,
                "question_text": q.get("question_text"),
                "selected_option": selected_opt_id,
                "correct_option": correct_opt_id,
                "is_correct": is_correct,
                "misconception_tag": misconception_tag,
                "rationale": feedback
            })

        percentage = round((score / total) * 100, 1) if total > 0 else 0.0
        passed = percentage >= 70.0

        user_prompt = f"""
Assessment Evaluation Request:
- Node: {node.get('title')} ({node.get('id')})
- Raw Score: {score}/{total} ({percentage}%)
- Passed: {passed}
- Question-by-Question Diagnostic:
{json.dumps(q_breakdown, indent=2)}

Adapt the student's ongoing learning path. If passed, advance them smoothly. If failed, synthesize an explicit remedial micro-module to bridge their exact misconception.
"""
        raw_output = self.gateway.generate(ADAPTATION_SYSTEM_PROMPT, user_prompt, temperature=0.25)
        parsed = self.gateway.extract_json(raw_output)

        if not parsed or "score" not in parsed:
            # Fallback deterministic structure
            parsed = {
                "score": score,
                "total_questions": total,
                "percentage": percentage,
                "passed": passed,
                "concept_mastery_delta": {
                    node.get("title", "Core Concept"): 15 if passed else -10
                },
                "detected_misconceptions": detected_misconceptions,
                "feedback_summary": (
                    f"Great job mastering this milestone with {percentage}%!" 
                    if passed else 
                    f"Scored {percentage}%. We've detected an area that needs reinforcement and adaptively updated your roadmap."
                ),
                "adaptation_applied": not passed,
                "path_change_description": (
                    "Milestone achieved! Next advanced node unlocked."
                    if passed else
                    "Dynamic Path Adaptation: Injected targeted remedial micro-module into your roadmap."
                )
            }
            if not passed:
                parsed["remedial_node"] = {
                    "id": f"remedial_{node.get('id', 'mod')}",
                    "title": f"Remediation: Core Intuition on {node.get('title', 'Concept')}",
                    "category": "Remediation",
                    "prerequisites": [],
                    "estimated_minutes": 20,
                    "bloom_target": "Understand",
                    "status": "ready",
                    "is_remedial": True,
                    "remediation_reason": "Automated path adaptation based on assessment diagnostic.",
                    "description": f"Targeted walkthrough and visual counter-examples to address misconceptions in {node.get('title', 'this topic')}.",
                    "key_takeaways": [
                        "Clarify boundary conditions and common pitfalls",
                        "Step-by-step visual trace of subproblem execution"
                    ],
                    "resource_links": [
                        {"title": "Focused Conceptual Deep Dive", "url": "https://en.wikipedia.org"}
                    ]
                }

        # Apply path mutations to current_path
        nodes = current_path.get("nodes", [])
        current_node_id = node.get("id")

        if passed:
            for idx, n in enumerate(nodes):
                if n.get("id") == current_node_id:
                    n["status"] = "mastered"
                    # Unlock next node
                    if idx + 1 < len(nodes):
                        nodes[idx + 1]["status"] = "ready"
        else:
            # Insert remedial node immediately after current node if not already present
            remedial_node = parsed.get("remedial_node")
            if remedial_node:
                existing = any(n.get("id") == remedial_node.get("id") for n in nodes)
                if not existing:
                    # Find index of current node
                    curr_idx = next((i for i, n in enumerate(nodes) if n.get("id") == current_node_id), -1)
                    if curr_idx != -1:
                        nodes.insert(curr_idx + 1, remedial_node)
                    else:
                        nodes.append(remedial_node)

        current_path["nodes"] = nodes
        parsed["updated_path"] = current_path
        return parsed
