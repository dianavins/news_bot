"""Configuration settings for the news bot application."""

import os
from pathlib import Path

# Project structure
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
LOGS_DIR = PROJECT_ROOT / "logs"

# Database
DATABASE_PATH = DATA_DIR / "news.db"

# News sources configuration
NEWS_SOURCES = {
    "left": [
        {"name": "CNN", "rss": "http://rss.cnn.com/rss/edition.rss"},
        {"name": "The Guardian", "rss": "https://www.theguardian.com/world/rss"},
        {"name": "NPR", "rss": "https://feeds.npr.org/1001/rss.xml"},
        {"name": "Washington Post", "rss": "https://feeds.washingtonpost.com/rss/politics"},
    ],
    "center": [
        {"name": "Reuters", "rss": "https://feeds.reuters.com/Reuters/worldNews"},
        {"name": "AP News", "rss": "https://feeds.apnews.com/rss/apf-topnews"},
        {"name": "BBC", "rss": "http://feeds.bbci.co.uk/news/world/rss.xml"},
        {"name": "Wall Street Journal", "rss": "https://feeds.a.dj.com/rss/RSSWorldNews.xml"},
    ],
    "right": [
        {"name": "Fox News", "rss": "http://feeds.foxnews.com/foxnews/politics"},
        {"name": "New York Post", "rss": "https://nypost.com/feed/"},
        {"name": "Daily Wire", "rss": "https://www.dailywire.com/feeds/rss.xml"},
        {"name": "Washington Examiner", "rss": "https://www.washingtonexaminer.com/feed"},
    ]
}

# LLM Configuration
DEFAULT_MODEL = "microsoft/DialoGPT-medium"  # Fallback, will use SmolLM3-3B when available
MAX_TOKENS = 512
TEMPERATURE = 0.3

# Update intervals
NEWS_UPDATE_INTERVAL = 14400  # 4 hours in seconds

# User settings defaults
DEFAULT_SETTINGS = {
    "detail_level": "standard",
    "categories": ["politics", "environment", "technology"],
    "max_stories": 10,
    "update_frequency": "4h"
}

# Create directories if they don't exist
for directory in [DATA_DIR, MODELS_DIR, LOGS_DIR]:
    directory.mkdir(exist_ok=True)