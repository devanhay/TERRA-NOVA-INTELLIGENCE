import os
import sys

# Get the absolute paths for project root and backend folder
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

# Insert directories into python module search path
sys.path.insert(0, root_dir)
sys.path.insert(0, backend_dir)

# Import the FastAPI instance
from app.main import app
