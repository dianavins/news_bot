"""FastAPI backend for the news bot web application."""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Any
import sys
import os

# Import from proper paths when run from lite root
from src.synthesis.processor import StoryProcessor

app = FastAPI(title="News Bot API", description="Anti-echo chamber news aggregation API")

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

# Initialize processor
processor = StoryProcessor()

@app.get("/")
async def serve_homepage():
    """Serve the main HTML page."""
    return FileResponse("src/web/static/index.html")

@app.get("/stories")
async def serve_stories_page():
    """Serve the main HTML page for stories route."""
    return FileResponse("src/web/static/index.html")

@app.get("/story/{story_id}")
async def serve_story_page(story_id: str):
    """Serve the main HTML page for individual story route."""
    return FileResponse("src/web/static/index.html")

@app.get("/api/stories")
async def get_all_stories() -> List[Dict[str, Any]]:
    """Get all processed stories for the stories screen."""
    try:
        stories = processor.get_processed_stories(20)  # Get up to 20 stories
        
        # Transform for frontend consumption
        story_list = []
        for i, story in enumerate(stories, 1):
            # Generate subtitle from news sources
            references = story['references']  # Already parsed in get_processed_stories
            sources = [ref['source'] for ref in references]
            
            # Remove duplicates while preserving order
            unique_sources = []
            for source in sources:
                if source not in unique_sources:
                    unique_sources.append(source)
            
            # Format sources nicely
            if len(unique_sources) == 1:
                subtitle = unique_sources[0]
            elif len(unique_sources) == 2:
                subtitle = f"{unique_sources[0]} & {unique_sources[1]}"
            else:
                subtitle = ", ".join(unique_sources[:-1]) + f" & {unique_sources[-1]}"
            
            story_item = {
                'id': story['id'],
                'number': i,
                'title': story['event_headline'],
                'subtitle': subtitle,
                'source_count': story['source_count'],
                'political_balance_score': story['political_balance_score']
            }
            story_list.append(story_item)
        
        return story_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stories: {str(e)}")

@app.get("/api/story/{story_id}")
async def get_story_details(story_id: str) -> Dict[str, Any]:
    """Get detailed story information for summary/details screens."""
    try:
        stories = processor.get_processed_stories(50)  # Get more to find the specific one
        
        # Find the story by ID
        target_story = None
        story_number = 0
        for i, story in enumerate(stories, 1):
            if story['id'] == story_id:
                target_story = story
                story_number = i
                break
        
        if not target_story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        # Generate subtitle from news sources
        references = target_story['references']
        sources = [ref['source'] for ref in references]
        
        # Remove duplicates while preserving order
        unique_sources = []
        for source in sources:
            if source not in unique_sources:
                unique_sources.append(source)
        
        # Format sources nicely
        if len(unique_sources) == 1:
            subtitle = unique_sources[0]
        elif len(unique_sources) == 2:
            subtitle = f"{unique_sources[0]} & {unique_sources[1]}"
        else:
            subtitle = ", ".join(unique_sources[:-1]) + f" & {unique_sources[-1]}"
        
        # Process context section into bullet points
        context_sentences = target_story['background_context'].split('. ')
        context_bullets = [sentence.strip() + ('.' if not sentence.endswith('.') else '') 
                          for sentence in context_sentences if sentence.strip()]
        
        # Process impact sections into bullet points
        def split_into_bullets(text):
            # Simple split by sentences, max 4 bullets
            sentences = text.split('. ')
            bullets = []
            for sentence in sentences[:4]:
                if sentence.strip():
                    bullet = sentence.strip()
                    if not bullet.endswith('.'):
                        bullet += '.'
                    bullets.append(bullet)
            return bullets
        
        economic_bullets = split_into_bullets(target_story['economic_impact'])
        social_bullets = split_into_bullets(target_story['social_values'])
        practical_bullets = split_into_bullets(target_story['practical_solutions'])
        
        # Process political perspectives
        conservative_text = target_story['conservative_view']
        progressive_text = target_story['progressive_view']
        
        story_details = {
            'id': target_story['id'],
            'number': story_number,
            'title': target_story['event_headline'],
            'subtitle': subtitle,
            'unified_summary': target_story['unified_summary'],
            'background_context': {
                'bullets': context_bullets
            },
            'economic_impact': {
                'bullets': economic_bullets
            },
            'social_values': {
                'bullets': social_bullets
            },
            'practical_solutions': {
                'bullets': practical_bullets
            },
            'political_perspectives': {
                'conservative': conservative_text,
                'progressive': progressive_text
            },
            'references': target_story['references'],
            'metadata': {
                'source_count': target_story['source_count'],
                'political_balance_score': target_story['political_balance_score'],
                'created_date': target_story['created_date']
            }
        }
        
        return story_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching story details: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "News Bot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)