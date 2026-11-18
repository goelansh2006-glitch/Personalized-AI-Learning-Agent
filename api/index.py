import os
import sys

# Ensure root directory is in python path for Vercel Serverless environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel WSGI entry point
# Exports 'app' for @vercel/python
if __name__ == "__main__":
    app.run()
