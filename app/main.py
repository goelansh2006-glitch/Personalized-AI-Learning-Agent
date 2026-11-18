import os
import json
from flask import Flask, request, jsonify, render_template, send_from_directory
from app.config import Config
from app.agents.state import LearnerProfile
from app.agents.diagnostic_agent import DiagnosticAgent
from app.agents.curriculum_agent import CurriculumAgent
from app.agents.assessment_agent import AssessmentAgent
from app.agents.adaptation_agent import AdaptationAgent
from app.agents.socratic_tutor import SocraticTutorAgent
from app.agents.llm_gateway import LLMGateway

def create_app():
    # Configure template and static directories
    base_dir = os.path.abspath(os.path.dirname(__file__))
    template_dir = os.path.join(base_dir, "templates")
    static_dir = os.path.join(base_dir, "static")

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(Config)

    # Initialize shared agents
    gateway = LLMGateway()
    diagnostic_agent = DiagnosticAgent(gateway)
    curriculum_agent = CurriculumAgent(gateway)
    assessment_agent = AssessmentAgent(gateway)
    adaptation_agent = AdaptationAgent(gateway)
    socratic_tutor = SocraticTutorAgent(gateway)

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/health", methods=["GET"])
    def health():
        active_providers = []
        if Config.GROQ_API_KEY:
            active_providers.append("Groq (Llama-3.3-70B)")
        if Config.GEMINI_API_KEY:
            active_providers.append("Google Gemini")
        if Config.OPENAI_API_KEY:
            active_providers.append("OpenAI")
        active_providers.append("High-Fidelity Offline Engine (Active)")

        return jsonify({
            "status": "healthy",
            "system": "CogniPath AI - Multi-Agent Personalized Learning System",
            "active_providers": active_providers,
            "version": "2.0.0-hackathon"
        })

    @app.route("/api/diagnostic-probes", methods=["GET"])
    def get_probes():
        subject = request.args.get("subject", "Python & Algorithms")
        level = request.args.get("level", "Intermediate")
        probes = diagnostic_agent.get_sample_diagnostic_questions(subject, level)
        return jsonify({"subject": subject, "level": level, "probes": probes})

    @app.route("/api/diagnose", methods=["POST"])
    def run_diagnose():
        try:
            data = request.get_json() or {}
            profile_data = data.get("profile", {})
            profile = LearnerProfile(
                name=profile_data.get("name", "Learner"),
                target_subject=profile_data.get("target_subject", "Python & Algorithms"),
                current_level=profile_data.get("current_level", "Intermediate"),
                target_goal=profile_data.get("target_goal", "Master complex problem solving"),
                preferred_style=profile_data.get("preferred_style", "Hands-on & Code-First"),
                time_commitment_hrs=float(profile_data.get("time_commitment_hrs", 5.0)),
                prior_knowledge_summary=profile_data.get("prior_knowledge_summary", "")
            )
            answers = data.get("answers", "")
            diagnosis = diagnostic_agent.diagnose(profile, answers)
            return jsonify({"status": "success", "diagnosis": diagnosis})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @app.route("/api/curriculum", methods=["POST"])
    def generate_curriculum():
        try:
            data = request.get_json() or {}
            profile_data = data.get("profile", {})
            profile = LearnerProfile(
                name=profile_data.get("name", "Learner"),
                target_subject=profile_data.get("target_subject", "Python & Algorithms"),
                current_level=profile_data.get("current_level", "Intermediate"),
                target_goal=profile_data.get("target_goal", "Master complex problem solving"),
                preferred_style=profile_data.get("preferred_style", "Hands-on & Code-First"),
                time_commitment_hrs=float(profile_data.get("time_commitment_hrs", 5.0))
            )
            gaps = data.get("gaps", [])
            path = curriculum_agent.generate_path(profile, gaps)
            return jsonify({"status": "success", "learning_path": path})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @app.route("/api/generate-quiz", methods=["POST"])
    def generate_quiz():
        try:
            data = request.get_json() or {}
            node = data.get("node", {})
            count = int(data.get("count", 2))
            assessment = assessment_agent.generate_assessment(node, count=count)
            return jsonify({"status": "success", "assessment": assessment})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @app.route("/api/evaluate-quiz", methods=["POST"])
    def evaluate_quiz():
        try:
            data = request.get_json() or {}
            node = data.get("node", {})
            questions = data.get("questions", [])
            answers = data.get("answers", {})
            current_path = data.get("current_path", {})

            result = adaptation_agent.evaluate_and_adapt(node, questions, answers, current_path)
            return jsonify({"status": "success", "result": result})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @app.route("/api/tutor", methods=["POST"])
    def tutor_chat():
        try:
            data = request.get_json() or {}
            message = data.get("message", "")
            history = data.get("history", [])
            current_node = data.get("current_node", None)
            style = data.get("style", "Hands-on & Code-First")

            reply = socratic_tutor.chat(message, history, current_node, style)
            return jsonify({"status": "success", "reply": reply})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    @app.route("/api/presets", methods=["GET"])
    def get_presets():
        return jsonify({
            "presets": [
                {
                    "title": "Python & Algorithmic Problem Solving",
                    "subject": "Python & Data Structures",
                    "level": "Intermediate",
                    "goal": "Master dynamic programming and graph state traversal for technical coding interviews",
                    "style": "Hands-on & Code-First",
                    "hours": 6
                },
                {
                    "title": "Distributed Systems & System Design",
                    "subject": "System Design & Distributed Architecture",
                    "level": "Advanced",
                    "goal": "Design high-availability distributed key-value stores with Raft consensus and partition tolerance",
                    "style": "Theoretical & Architectural",
                    "hours": 8
                },
                {
                    "title": "Machine Learning & Neural Networks",
                    "subject": "Deep Learning & Transformer Models",
                    "level": "Intermediate",
                    "goal": "Understand attention mechanisms, self-attention math, and fine-tuning LLMs",
                    "style": "Hands-on & Code-First",
                    "hours": 10
                },
                {
                    "title": "Cloud-Native Microservices with Docker & K8s",
                    "subject": "DevOps & Cloud Architecture",
                    "level": "Beginner",
                    "goal": "Containerize full-stack apps and deploy with Kubernetes ingress controllers",
                    "style": "Visual & Hands-on",
                    "hours": 5
                }
            ]
        })

    return app

app = create_app()
