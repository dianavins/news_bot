# News Bot - Lite Web Version

This is the lightweight web version of the News Bot application. It provides a clean web interface for anti-echo chamber news aggregation.

## Features
- RSS news collection from multiple sources across political spectrum
- Event-specific story clustering  
- Comprehensive multi-paragraph summaries with source citations
- Single scrollable story interface
- Smooth transitions and browser back button support

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run data collection:**
   ```bash
   cd src/data
   python collector.py
   ```

3. **Process stories:**
   ```bash
   cd src/synthesis
   python processor.py
   ```

4. **Start web server:**
   ```bash
   python run_server.py
   ```

5. **Open browser:**
   Navigate to `http://127.0.0.1:8003`

## Architecture
- **Data Collection**: `src/data/collector.py` - RSS news gathering
- **Story Clustering**: `src/analysis/clustering.py` - Event-specific grouping
- **LLM Processing**: `src/synthesis/processor.py` - Summary generation
- **Web API**: `src/api/main.py` - FastAPI backend
- **Frontend**: `src/web/static/` - HTML/CSS/JS interface

## Database
- SQLite database stored in `data/news.db`
- Contains collected articles and processed stories

This lite version is preserved while the main project evolves into a desktop application.