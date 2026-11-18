import os
from app.main import app
from app.config import Config

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    print(f"🚀 CogniPath AI Server running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
