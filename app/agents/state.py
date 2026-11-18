from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class LearnerProfile(BaseModel):
    id: str = "learner_default"
    name: str = "Learner"
    target_subject: str = "Python & Data Structures"
    current_level: str = "Intermediate"  # Beginner, Intermediate, Advanced
    target_goal: str = "Master dynamic programming and graph algorithms for tech interviews"
    preferred_style: str = "Hands-on & Code-First"  # Visual, Hands-on & Code-First, Theoretical & Mathematical, Socratic & Conversational
    time_commitment_hrs: float = 5.0
    prior_knowledge_summary: Optional[str] = None

class KnowledgeGap(BaseModel):
    concept_id: str
    concept_name: str
    category: str
    mastery_score: int = Field(ge=0, le=100) # 0 to 100
    bloom_level: str = "Apply" # Remember, Understand, Apply, Analyze, Evaluate, Create
    status: str = "gap_identified" # gap_identified, in_progress, mastered
    misconception: Optional[str] = None
    severity: str = "moderate" # critical, moderate, minor
    recommended_remedy: str = ""

class LearningNode(BaseModel):
    id: str
    title: str
    description: str
    category: str
    prerequisites: List[str] = Field(default_factory=list)
    estimated_minutes: int = 30
    bloom_target: str = "Understand"
    status: str = "ready" # locked, ready, in_progress, mastered, remediation
    is_remedial: bool = False
    remediation_reason: Optional[str] = None
    key_takeaways: List[str] = Field(default_factory=list)
    resource_links: List[Dict[str, str]] = Field(default_factory=list)

class LearningPath(BaseModel):
    subject: str
    student_level: str
    nodes: List[LearningNode] = Field(default_factory=list)
    total_estimated_hours: float = 0.0
    current_node_id: Optional[str] = None
    adaptation_history: List[Dict[str, Any]] = Field(default_factory=list)
    last_updated: Optional[str] = None

class QuestionOption(BaseModel):
    id: str # A, B, C, D
    text: str
    is_correct: bool = False
    misconception_tag: Optional[str] = None
    feedback_rationale: str = ""

class AssessmentQuestion(BaseModel):
    id: str
    node_id: str
    concept_name: str
    question_text: str
    question_type: str = "mcq" # mcq, code_analysis, scenario
    options: List[QuestionOption] = Field(default_factory=list)
    code_snippet: Optional[str] = None
    correct_answer: str
    detailed_explanation: str
    bloom_level: str = "Apply"
    difficulty: str = "Medium" # Easy, Medium, Hard

class AssessmentSubmission(BaseModel):
    question_id: str
    selected_option_id: str
    time_taken_seconds: Optional[int] = 0
    confidence_level: Optional[str] = "High" # Low, Medium, High

class AssessmentResult(BaseModel):
    score: int
    total_questions: int
    percentage: float
    passed: bool
    concept_mastery_delta: Dict[str, int]
    detected_misconceptions: List[Dict[str, str]]
    feedback_summary: str
    adaptation_applied: bool = False
    path_change_description: Optional[str] = None
    next_recommended_node_id: Optional[str] = None
