# LLM Processing Pipeline Documentation

## Overview
The LLM system processes collected news articles through event-specific clustering and multi-stage analysis to create balanced, comprehensive summaries that combat echo chambers.

## Processing Pipeline

### Stage 1: Event-Specific Story Clustering

#### Purpose
Group articles covering the same specific event (not broad topics) into coherent story clusters.

#### Technology Stack
- **Embeddings**: Sentence-transformers for semantic similarity
- **Clustering**: High similarity threshold (0.8+) for same events
- **Validation**: Named entity matching (dates, people, places, organizations)

#### Input
```python
# Raw articles from database
articles = [
    {"id": "123", "title": "Biden signs infrastructure bill", "content": "...", "source": "CNN", "political_lean": "left"},
    {"id": "124", "title": "Infrastructure package becomes law", "content": "...", "source": "Fox News", "political_lean": "right"},
    # ... more articles
]
```

#### Output
```python
# Event-specific story clusters
story_clusters = [
    {
        "event_id": "infra_bill_signing_2024",
        "headline": "Biden signs $1.2 trillion infrastructure bill into law",
        "articles": [list of related articles],
        "sources_by_lean": {"left": ["CNN", "Guardian"], "center": ["NPR"], "right": ["Fox News"]}
    }
]
```

#### Algorithm Details
```python
# 1. Generate embeddings for headline + first paragraph
# 2. Calculate pairwise similarity matrix
# 3. Apply clustering with event-specific thresholds:
#    - Same event: similarity > 0.8
#    - Related events: similarity 0.6-0.8 (keep separate)
# 4. Validate clusters with named entity overlap
# 5. Rank clusters by importance (source count + recency)
```

---

### Stage 2: Multi-Prompt LLM Analysis

For each story cluster, run three sequential prompts to generate comprehensive, balanced content.

#### Prompt 1: Unified Summary
**Purpose**: Create comprehensive single-paragraph summary including all sources

```python
UNIFIED_SUMMARY_PROMPT = """
Create a comprehensive summary covering ALL these sources about the same event:

Event: {event_headline}

Sources to include:
{source_list_with_titles}

Requirements:
- Include information from EVERY source listed above
- If sources disagree on facts, note "Sources report conflicting information about..."
- Don't omit any major claims or details from any source
- One paragraph, 4-6 sentences maximum
- Use neutral, factual language
- Verify: Have you included perspectives from all {source_count} sources?

Unified Summary:
"""
```

**Output Location**: `stories.unified_summary` (TEXT)

#### Prompt 2: Context & Recent History
**Purpose**: Provide essential background context so users understand the full story

```python
CONTEXT_PROMPT = """
Provide essential background context for this event so readers understand the full story without needing to research elsewhere.

Event: {event_headline}
Sources: {source_list}

Requirements:
- Explain recent history leading up to this event (past 6 months)
- Key players, organizations, or policies involved
- Why this development matters now
- Previous related events or decisions that led to this
- One focused paragraph, 4-6 sentences
- Use neutral, informative tone

Background Context:
"""
```

**Output Location**: `stories.background_context` (TEXT)

#### Prompt 3: Impact Analysis
**Purpose**: Extract three key impact categories from all sources

```python
IMPACT_ANALYSIS_PROMPT = """
Based on ALL sources provided for this event, analyze the following impacts.
You must reference claims from each source in your analysis.

Event: {event_headline}
Sources: {source_list}

Analyze these three areas:

🏢 Economic Impact: Financial implications, market effects, job impacts, business consequences
❤️ Social Values: Community effects, cultural implications, human impact, societal concerns  
⚖️ Practical Solutions: Implementation details, proposed compromises, next steps, policy mechanisms

Requirements:
- Each section should be one focused paragraph
- Include perspectives from left-leaning, center, and right-leaning sources
- If sources disagree, present both views: "While [source A] emphasizes X, [source B] focuses on Y"
- Use identity-safe language that doesn't trigger political defensiveness

Verification checklist: Have you included perspectives from all sources in each section?

Economic Impact:

Social Values:

Practical Solutions:
"""
```

**Output Location**: 
- `stories.economic_impact` (TEXT)
- `stories.social_values` (TEXT) 
- `stories.practical_solutions` (TEXT)

#### Prompt 3: Identity-Safe Political Perspectives
**Purpose**: Present different political viewpoints without triggering identity threats

```python
POLITICAL_PERSPECTIVES_PROMPT = """
Based on the sources provided, explain how different political groups view this event.
Use identity-safe framing that encourages understanding rather than defensiveness.

Event: {event_headline}
Left-leaning sources: {left_sources}
Right-leaning sources: {right_sources}
Center sources: {center_sources}

Requirements:
- Use "Some people focus on..." / "Others emphasize..." format
- Avoid loaded terms: "liberals/conservatives", "radical", "extremist"
- Present as legitimate different priorities, not right/wrong
- Focus on underlying values and concerns
- Each perspective should be one paragraph
- Goal: Help readers understand why people think differently

Conservative Perspective (focus on traditional values, economic concerns, individual responsibility):

Progressive Perspective (focus on social equity, collective action, systemic change):
"""
```

**Output Location**:
- `stories.conservative_view` (TEXT)
- `stories.progressive_view` (TEXT)

#### Prompt 5: References Generation
**Purpose**: Create clean, organized reference list

```python
REFERENCES_PROMPT = """
Create a clean reference list for all sources used in the analysis above.

Sources used:
{source_details_with_urls}

Requirements:
- Format: • [Source Name]: "[Article Title]" - [URL]
- Only include sources that were actually referenced
- Order: Left-leaning sources first, then center, then right-leaning
- Maximum 10 references to keep manageable

References:
"""
```

**Output Location**: `stories.references_json` (JSON array)

---

## Data Flow Architecture

```
Raw Articles (30+)
    ↓
[Clustering Algorithm]
    ↓
Event Clusters (5-10)
    ↓
[Prompt 1: Unified Summary]
    ↓
[Prompt 2: Impact Analysis]  
    ↓
[Prompt 3: Political Perspectives]
    ↓
[Prompt 4: References]
    ↓
Structured Stories → Database → API → UI
```

## Database Schema

```sql
CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    event_headline TEXT NOT NULL,
    unified_summary TEXT NOT NULL,
    background_context TEXT NOT NULL,
    economic_impact TEXT NOT NULL,
    social_values TEXT NOT NULL,
    practical_solutions TEXT NOT NULL,
    conservative_view TEXT NOT NULL,
    progressive_view TEXT NOT NULL,
    references_json TEXT NOT NULL,
    created_date TEXT NOT NULL,
    source_count INTEGER,
    political_balance_score REAL
);
```

## Model Configuration

### Primary Model Options
1. **Development**: Flan-T5-base (lightweight, fast)
2. **Production**: SmolLM3-3B (better quality, requires more resources)
3. **Fallback**: OpenAI API calls (if local models fail)

### Prompt Engineering Settings
- **Temperature**: 0.3 (balance creativity with consistency)
- **Max tokens**: 512 per prompt
- **Retry logic**: 3 attempts with exponential backoff
- **Validation**: Check output completeness before saving

## Quality Assurance

### Automated Checks
1. **Source coverage**: Verify all input sources mentioned in output
2. **Length validation**: Summary 4-6 sentences, impacts 1 paragraph each
3. **Bias detection**: Flag overly partisan language
4. **Reference accuracy**: Validate URLs and titles match

### Monitoring Metrics
- Processing time per story cluster
- Source balance (left/center/right representation)
- User engagement with different perspectives
- Error rates and retry frequency

## Error Handling

### Common Issues & Solutions
1. **Missing sources**: Retry with explicit source inclusion prompts
2. **Biased language**: Re-run with stronger neutrality instructions
3. **Incomplete analysis**: Validate against checklist, retry if needed
4. **Clustering failures**: Fall back to keyword-based grouping

### Fallback Strategies
- If clustering fails: Process articles individually
- If LLM unavailable: Use template-based summaries
- If quality too low: Mark stories for manual review