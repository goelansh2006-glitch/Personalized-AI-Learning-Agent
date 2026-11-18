import json
from typing import Dict, Any, List
from app.agents.state import LearnerProfile, KnowledgeGap, LearningPath, LearningNode
from app.agents.llm_gateway import LLMGateway

CURRICULUM_SYSTEM_PROMPT = """You are the Senior Curriculum Architect Agent for CogniPath AI.
Your objective: Construct an adaptive, logically sequenced Personalized Learning Path (Skill DAG) tailored to the student's exact knowledge gaps, target goal, and cognitive profile.

CRITICAL INSTRUCTIONS:
1. Sequence nodes strictly by prerequisite dependency: foundations must precede applied concepts.
2. For identified critical/moderate knowledge gaps, insert explicit targeted nodes marked with `"is_remedial": true` and a clear `"remediation_reason"`.
3. If the student already has high mastery in baseline topics, FAST-TRACK them by skipping redundant foundational fluff and focusing directly on advanced synthesis.
4. Each node must have clear, measurable key takeaways and estimated study duration in minutes.
5. Node 1 should be set to `"status": "ready"`; subsequent dependent nodes should be set to `"status": "locked"`.
6. Return strictly valid JSON adhering to the schema below.

SCHEMA:
{
  "subject": "<string>",
  "student_level": "<string>",
  "total_estimated_hours": <float>,
  "nodes": [
    {
      "id": "<slug_id_e.g._node_1_slug>",
      "title": "<Concise Module Title>",
      "category": "<Category>",
      "prerequisites": ["<prerequisite_node_id>"],
      "estimated_minutes": <int>,
      "bloom_target": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create",
      "status": "ready" | "locked",
      "is_remedial": <bool>,
      "remediation_reason": "<string or null>",
      "description": "<2-3 sentence overview of what will be learned>",
      "key_takeaways": [
        "<bullet 1>",
        "<bullet 2>",
        "<bullet 3>"
      ],
      "resource_links": [
        {"title": "<Resource Title>", "url": "<valid url or reference>"}
      ]
    }
  ]
}
"""

class CurriculumAgent:
    def __init__(self, gateway: LLMGateway = None):
        self.gateway = gateway or LLMGateway()

    def generate_path(self, profile: LearnerProfile, knowledge_gaps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesizes student profile and knowledge gap data into an optimal learning path DAG.
        """
        gaps_summary = json.dumps(knowledge_gaps, indent=2) if knowledge_gaps else "None explicitly detected."

        user_prompt = f"""
Learner Context:
- Subject: {profile.target_subject}
- Level: {profile.current_level}
- Target Goal: {profile.target_goal}
- Preferred Style: {profile.preferred_style}
- Weekly Hours: {profile.time_commitment_hrs}

Identified Knowledge Gaps & Misconceptions:
{gaps_summary}

Architect a personalized, multi-node learning roadmap that resolves their specific misconceptions and guides them efficiently to their goal.
"""
        raw_output = self.gateway.generate(CURRICULUM_SYSTEM_PROMPT, user_prompt, temperature=0.25)
        parsed = self.gateway.extract_json(raw_output)

        if not parsed or "nodes" not in parsed or not isinstance(parsed["nodes"], list):
            # Fallback to simulated path
            sim_raw = self.gateway._simulate_response(CURRICULUM_SYSTEM_PROMPT, user_prompt)
            parsed = json.loads(sim_raw)

        # Ensure first node is ready and subsequent are locked if not specified
        if parsed.get("nodes") and len(parsed["nodes"]) > 0:
            parsed["nodes"][0]["status"] = "ready"
            for i in range(1, len(parsed["nodes"])):
                if parsed["nodes"][i].get("status") != "mastered":
                    parsed["nodes"][i]["status"] = "locked"

        return parsed
