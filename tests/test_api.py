import unittest
import json
from app.main import app

class TestCogniPathAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("active_providers", data)

    def test_presets_endpoint(self):
        res = self.client.get("/api/presets")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("presets", data)
        self.assertGreater(len(data["presets"]), 0)

    def test_diagnostic_probes_endpoint(self):
        res = self.client.get("/api/diagnostic-probes?subject=Python&level=Intermediate")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("probes", data)

    def test_diagnose_api(self):
        payload = {
            "profile": {
                "name": "Test Learner",
                "target_subject": "Python",
                "current_level": "Beginner",
                "target_goal": "Learn loops",
                "preferred_style": "Hands-on & Code-First",
                "time_commitment_hrs": 5.0
            },
            "answers": "Sample probe answers"
        }
        res = self.client.post("/api/diagnose", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("diagnosis", data)

    def test_curriculum_api(self):
        payload = {
            "profile": {
                "name": "Test Learner",
                "target_subject": "Python",
                "current_level": "Intermediate",
                "target_goal": "Learn DP",
                "preferred_style": "Hands-on & Code-First",
                "time_commitment_hrs": 5.0
            },
            "gaps": []
        }
        res = self.client.post("/api/curriculum", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("learning_path", data)

    def test_socratic_tutor_api(self):
        payload = {
            "message": "What is Big-O notation?",
            "history": [],
            "style": "Visual"
        }
        res = self.client.post("/api/tutor", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("reply", data)

    def test_security_headers(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(res.headers.get("X-XSS-Protection"), "1; mode=block")

if __name__ == "__main__":
    unittest.main()
