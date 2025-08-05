#!/usr/bin/env python3
"""
Run the News Bot lite web server from the proper directory.
This ensures all paths resolve correctly.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append('src')

# Import and run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    from src.api.main import app
    
    print("Starting News Bot Lite Web Server...")
    print("Open your browser to: http://127.0.0.1:8003")
    
    uvicorn.run(app, host="127.0.0.1", port=8003, reload=False)