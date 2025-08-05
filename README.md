# News Bot - Anti-Echo Chamber News Aggregation

An intelligent news aggregation system that combats echo chambers by presenting balanced news from multiple political perspectives. Utilizes identity-safe framing techniques to reduce political defensiveness and promote objective news consumption.

## 🚀 Project Structure

This repository contains two versions:

### 📱 Desktop App (Main) - *In Development*
Professional desktop application with:
- System tray integration
- Configurable refresh notifications (1hr/12hr/1day/1week)  
- Compact popup windows
- Auto-updates and professional distribution
- Built with Electron + React + SQLite

### 🌐 Lite Web Version (`lite/` folder)
Lightweight web interface featuring:
- RSS news collection from 12+ sources across political spectrum
- Event-specific story clustering  
- Comprehensive multi-paragraph summaries with source citations
- Single scrollable story interface with smooth transitions
- FastAPI backend with SQLite database

## 🎯 Core Features

- **Anti-Echo Chamber Design**: Presents news from left, center, and right perspectives
- **Identity-Safe Framing**: Uses techniques to reduce political defensiveness
- **Event-Specific Clustering**: Groups articles by specific events, not broad topics
- **Comprehensive Summaries**: 2-3 paragraph summaries with source citations
- **Political Balance Scoring**: Measures diversity of political perspectives per story

## 🛠 Technology Stack

- **Backend**: Python, FastAPI, SQLite
- **Desktop**: Electron, React, Electron Builder
- **Web**: HTML5, CSS3, Vanilla JavaScript
- **Data Processing**: TF-IDF clustering, RSS parsing
- **Future**: LLM integration (TinyLlama/SmolLM3-3B)

## 📖 Quick Start

For the **lite web version**, see [`lite/README.md`](lite/README.md)

For the **desktop app** - coming soon!
