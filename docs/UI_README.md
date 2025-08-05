# News Bot UI Design Specification

## Main Page Layout

### Header
- **Top Right**: ⚙️ Settings button
  - Refresh frequency options: 1h, 4h, 12h, 24h
  - Categories to display
  - Detail level preferences

### Main Content Area
- **Clean, minimalistic design**
- **Bullet point format** for top stories of the day/week
- Each bullet point is **clickable** to expand into full article view
- No sidebar clutter, focus on content

```
Today's Important News
• Climate policy changes affect energy sector
• Tech companies announce AI safety measures  
• Economic indicators show mixed signals
• International trade negotiations continue
```

## Expanded Article View

### Structure (appears when bullet point is clicked):

#### 1. Unified Summary Paragraph
- **Single paragraph** synthesizing coverage across all news outlets
- Factual, neutral tone combining multiple source perspectives
- Focus on verifiable information and key developments

#### 2. Context & Recent History
- **📚 Background Context**: Recent history, previous developments, why this matters now
- Essential context so users don't need to research background themselves

#### 3. Impact Analysis (Paragraph Format)
- **🏢 Economic Impact**: Financial implications, market effects, job impacts
- **❤️ Social Values**: Community effects, cultural implications, human impact  
- **⚖️ Practical Solutions**: Implementation details, proposed compromises, next steps

#### 4. Perspective Understanding
- **📰 How Different Groups See This**:
  - Conservative perspective: [Identity-safe framing, avoid trigger words]
  - Progressive perspective: [Identity-safe framing, avoid trigger words]
  - Presented as "Some focus on..." / "Others emphasize..." format
  - Goal: Understanding, not judgment

#### 5. References
- **📚 References** section at bottom
- Clean list of all source articles used
- Format: • [Source Name]: "[Article Title]" - [URL]
- Ordered: Left-leaning, center, right-leaning sources
- Click to open original article in new tab

## Design Principles

### Anti-Echo Chamber Features
1. **Lead with neutral facts** before perspectives
2. **Identity-safe language** throughout
3. **Common ground emphasis** in impact sections
4. **Understanding over agreement** in perspective sections

### User Experience
- **One-click access** to full context
- **Progressive disclosure** of information depth
- **Minimal cognitive load** on main page
- **Optional deep-dive** for interested users

### Technical Requirements
- **Responsive design** for mobile/desktop
- **Fast loading** - prioritize speed over fancy animations
- **Clean typography** for easy reading
- **No persistent data** - fresh content each session

## Information Architecture

```
Main Page (Bullet Points)
    ↓ [Click]
Expanded Article
    ├── Unified Summary
    ├── Context & Recent History
    ├── Impact Analysis  
    ├── Perspective Understanding
    └── References
```

## Technical Implementation

### Backend API (FastAPI)
- **`/api/stories`** - Returns all processed stories with titles, subtitles, and metadata
- **`/api/story/{id}`** - Returns detailed story information including all sections
- **`/api/health`** - Health check endpoint

### Frontend Architecture
- **Single Page Application** with screen-based navigation
- **Vanilla JavaScript** for optimal performance and simplicity  
- **CSS Grid & Flexbox** for responsive layout
- **Smooth scrolling transitions** between summary → details → references

### Screen Flow Implementation
```
Home Screen → [Button Click] → Stories Screen
    ↓ [Story Click]
Summary Screen → [Scroll Down] → Details Screen → [Scroll More] → References
```

### Color Scheme Applied
- **Primary Background**: `#f4f1eb` (Home, Stories, Summary, References)
- **Secondary Background**: `#efe9e1` (Details screen)
- **Text & Buttons**: `#493641` (Dark purple-brown)
- **Font**: Hanken Grotesk (HK Grotesk equivalent)

## Future Considerations
- Story archiving system (Phase 2)
- User preference learning (Phase 2)  
- Cross-story connection mapping (Phase 3)
- Bias detection visualization (Phase 3)
- Chat discussion feature (Phase 4)
- Mobile app version (Phase 5)