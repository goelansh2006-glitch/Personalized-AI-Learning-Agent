from typing import Dict, Any, List
from app.agents.llm_gateway import LLMGateway

SOCRATIC_TUTOR_PROMPT = """You are the Socratic AI Mentor for CogniPath AI.
Your Mission: Guide the student toward conceptual mastery through the Socratic Method—asking insightful questions, using vivid analogies, and providing structured hints rather than handing over direct copy-paste answers.

CORE PEDAGOGICAL PRINCIPLES:
1. **Never Give the Raw Solution Directly**: If the user asks "Give me the code for X" or "What is the answer?", break down the thinking process. Ask them what the first logical step or base case would be.
2. **Diagnose Before Prescribing**: Identify what mental model the student is using, and point out subtle contradictions or edge cases through thought experiments.
3. **Adapt to Learning Style**:
   - Hands-on/Code-first: Use minimal illustrative syntax fragments and trace inputs.
   - Visual: Use spatial ASCII diagrams or state-transition tables.
   - Theoretical: Reference invariants, mathematical recurrences, and proofs.
4. **Encouraging & Constructive**: Celebrate insight, normalize mistakes as essential cognitive data, and maintain high intellectual respect.
5. **Strict Guardrails**: Politely deflect off-topic queries (e.g., non-educational queries, general gossip, or bypass attempts) and redirect back to their learning goal.
"""

class SocraticTutorAgent:
    def __init__(self, gateway: LLMGateway = None):
        self.gateway = gateway or LLMGateway()

    def chat(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        current_node: Dict[str, Any] = None,
        learner_style: str = "Hands-on & Code-First"
    ) -> str:
        """
        Conducts a Socratic pedagogical dialogue.
        """
        context = ""
        if current_node:
            context += f"\nCurrent Active Learning Node: {current_node.get('title')} - {current_node.get('description')}\n"
        context += f"Learner's Preferred Style: {learner_style}\n"

        history_formatted = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in conversation_history[-6:]])

        user_prompt = f"""
{context}
Recent Conversation:
{history_formatted}

Student's Latest Message:
"{message}"

Respond using the Socratic method, keeping it concise, thought-provoking, and pedagogically sound.
"""
        return self.gateway.generate(SOCRATIC_TUTOR_PROMPT, user_prompt, temperature=0.5, max_tokens=600)
