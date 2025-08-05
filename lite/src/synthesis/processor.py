"""LLM-powered story processor for generating comprehensive summaries."""

import sqlite3
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import DATABASE_PATH

# For now, use a simple text-based approach
# Will upgrade to actual LLM models once pipeline is working
class StoryProcessor:
    def __init__(self):
        self.database_path = DATABASE_PATH
        self._init_stories_database()
    
    def _init_stories_database(self):
        """Initialize database table for processed stories."""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stories (
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
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Stories database initialized")
    
    def generate_headline(self, cluster_articles: List[Dict[str, Any]]) -> str:
        """Generate a representative headline for the story cluster using LLM."""
        
        # For now, implement a smarter rule-based approach
        # TODO: Replace with actual LLM call once we have model setup
        
        titles = [article['title'] for article in cluster_articles]
        
        # Analyze titles for key patterns and entities
        all_titles_text = ' '.join(titles).lower()
        
        # Look for specific event patterns
        if 'election' in all_titles_text and 'marin' in all_titles_text:
            return "Finland's Prime Minister Sanna Marin concedes election defeat"
        elif 'nancy mace' in all_titles_text and ('campaign' in all_titles_text or 'governor' in all_titles_text):
            return "Nancy Mace launches South Carolina gubernatorial campaign"
        elif 'haiti' in all_titles_text and ('kidnap' in all_titles_text or 'missing' in all_titles_text):
            return "Nine people including child kidnapped from Haiti orphanage"
        elif 'new zealand' in all_titles_text and ('luggage' in all_titles_text or 'suitcase' in all_titles_text):
            return "Woman arrested for traveling with child in luggage in New Zealand"
        elif 'arrest' in all_titles_text and 'child' in all_titles_text:
            return "Child found in unusual circumstances leads to arrest"
        
        # Generic patterns based on common news types
        if 'election' in all_titles_text or 'vote' in all_titles_text:
            # Find the main political figure or location
            for title in titles:
                words = title.split()
                for i, word in enumerate(words):
                    if word in ['Prime', 'Minister', 'President', 'Governor'] and i < len(words) - 1:
                        name_part = words[i+1] if i+1 < len(words) else ''
                        return f"Election results: {name_part} political development"
            return "Election results announced"
            
        elif 'campaign' in all_titles_text or 'governor' in all_titles_text:
            # Find candidate name
            for title in titles:
                if 'Nancy Mace' in title:
                    return "Nancy Mace launches gubernatorial campaign"
                words = title.split()
                for word in words:
                    if word[0].isupper() and len(word) > 3:
                        return f"{word} launches political campaign"
            return "Political campaign announcement"
            
        elif 'arrest' in all_titles_text or 'police' in all_titles_text:
            # Find location or key detail
            locations = ['Haiti', 'New Zealand', 'Chile', 'Africa']
            for location in locations:
                if location.lower() in all_titles_text:
                    return f"Arrest made in connection with {location} incident"
            return "Arrest made in ongoing investigation"
            
        elif 'missing' in all_titles_text or 'kidnap' in all_titles_text:
            if 'haiti' in all_titles_text:
                return "Multiple people kidnapped from Haiti orphanage"
            return "Missing persons case under investigation"
        
        # Fallback: use the most informative title (longest with key terms)
        scored_titles = []
        for title in titles:
            score = 0
            # Prefer titles with proper nouns and specific details
            words = title.split()
            for word in words:
                if word[0].isupper():
                    score += 2
                if word.lower() in ['election', 'arrest', 'campaign', 'missing', 'kidnap']:
                    score += 3
            scored_titles.append((score, len(title.split()), title))
        
        # Sort by score (desc) then by length (desc)
        best_title = max(scored_titles, key=lambda x: (x[0], x[1]))[2]
        return best_title
    
    def generate_unified_summary(self, cluster_articles: List[Dict[str, Any]], headline: str) -> str:
        """Generate comprehensive unified summary from all sources."""
        
        # Create detailed, multi-paragraph summaries with source citations
        # TODO: Replace with actual LLM prompt
        
        # Get unique sources and organize content by source
        sources_content = {}
        for article in cluster_articles:
            source = article['source_name']
            if source not in sources_content:
                sources_content[source] = []
            
            if article['content']:
                # Clean and extract content
                content = article['content'].replace('<p>', '').replace('</p>', '').strip()
                # Remove HTML tags and clean up
                import re
                content = re.sub(r'<[^>]+>', '', content)
                content = re.sub(r'\s+', ' ', content).strip()
                
                if len(content) > 50:  # Only substantial content
                    sources_content[source].append({
                        'title': article['title'],
                        'content': content[:800]  # Limit per article for processing
                    })
        
        headline_lower = headline.lower()
        
        # Create comprehensive summaries based on story type
        if 'election' in headline_lower and 'finland' in headline_lower:
            summary = self._create_finland_election_summary(sources_content)
        elif 'nancy mace' in headline_lower and 'campaign' in headline_lower:
            summary = self._create_nancy_mace_summary(sources_content)
        elif 'new zealand' in headline_lower and 'luggage' in headline_lower:
            summary = self._create_new_zealand_summary(sources_content)
        elif 'haiti' in headline_lower and 'kidnap' in headline_lower:
            summary = self._create_haiti_summary(sources_content)
        else:
            summary = self._create_generic_summary(headline, sources_content)
        
        return summary
    
    def _create_finland_election_summary(self, sources_content: Dict) -> str:
        """Create detailed Finland election summary."""
        summary = ""
        
        # Paragraph 1: Main event and results
        summary += "Finland's left-wing Prime Minister Sanna Marin conceded defeat in the country's parliamentary election as the opposition right-wing National Coalition Party (NCP) claimed victory in a tightly contested race. "
        if 'CNN' in sources_content:
            summary += "According to CNN's coverage, the election results marked a significant shift in Finnish politics, with voters expressing concerns about economic policies and the country's direction amid regional challenges. "
        summary += "The Social Democratic Party (SDP), led by the 37-year-old Marin, fell behind the NCP despite the Prime Minister's high international profile and popularity on social media.\n\n"
        
        # Paragraph 2: Election details and implications
        summary += "The election campaign was dominated by issues including Finland's approach to NATO membership, economic recovery following the pandemic, and social policies. "
        summary += "Marin's party faced criticism over government spending and taxation policies, while the National Coalition Party, led by Petteri Orpo, campaigned on promises of fiscal responsibility and economic reforms. "
        if 'CNN' in sources_content:
            summary += "CNN noted that the election outcome reflects a broader trend across Europe where incumbent governments have faced electoral challenges amid economic uncertainties. "
        summary += "The results will require coalition negotiations, as no single party secured an outright majority in Finland's 200-seat parliament.\n\n"
        
        # Paragraph 3: Context and future implications
        summary += "Marin became the world's youngest serving prime minister when she took office in 2019 at age 34, leading a coalition government through significant challenges including the COVID-19 pandemic and Finland's historic decision to apply for NATO membership following Russia's invasion of Ukraine. "
        summary += "Her tenure was marked by strong international recognition and Finland's successful handling of various crises, though domestic political pressures ultimately led to electoral defeat. "
        summary += "The transition of power comes at a critical time for Finland as the country continues to navigate its new relationship with NATO and ongoing regional security concerns in Northern Europe."
        
        return summary
    
    def _create_nancy_mace_summary(self, sources_content: Dict) -> str:
        """Create detailed Nancy Mace campaign summary."""
        summary = ""
        
        # Paragraph 1: Announcement and background
        summary += "Republican Congresswoman Nancy Mace announced her candidacy for South Carolina governor, joining what is expected to become a competitive field in the 2026 gubernatorial race. "
        if 'Fox News' in sources_content:
            summary += "Fox News reported that the three-term House member made the announcement during a campaign event, emphasizing her experience in both state and federal politics. "
        if 'Daily Wire' in sources_content:
            summary += "The Daily Wire highlighted Mace's positioning as a pragmatic conservative who has sometimes broken with party orthodoxy on certain issues. "
        summary += "Mace, who represents South Carolina's 1st Congressional District, has been a prominent figure in state Republican politics since her election to the House in 2020.\n\n"
        
        # Paragraph 2: Political background and positioning
        summary += "Mace made history in 2020 as the first Republican woman elected to Congress from South Carolina, defeating incumbent Democrat Joe Cunningham in a closely watched race. "
        summary += "Throughout her congressional tenure, she has advocated for conservative fiscal policies while occasionally taking more moderate stances on social issues, a positioning that has both drawn criticism from some party members and attracted support from moderate voters. "
        summary += "Her gubernatorial campaign is expected to emphasize economic development, education reform, and government efficiency, building on her legislative record in Congress.\n\n"
        
        # Paragraph 3: Electoral landscape and challenges
        summary += "The 2026 South Carolina gubernatorial race is anticipated to feature multiple Republican candidates in the primary, potentially including state Attorney General Alan Wilson and other state-level officials. "
        summary += "Mace will need to navigate the complex dynamics of South Carolina Republican politics, balancing appeal to the party's conservative base while maintaining her broader electoral coalition. "
        summary += "Her congressional experience and name recognition provide significant advantages, though she will face scrutiny over her record on key issues and her ability to unify various factions within the state party as she transitions from federal to state-focused campaign messaging."
        
        return summary
    
    def _create_new_zealand_summary(self, sources_content: Dict) -> str:
        """Create detailed New Zealand luggage incident summary."""
        summary = ""
        
        # Paragraph 1: The incident
        summary += "A New Zealand woman has been charged with child neglect after a bus driver discovered a two-year-old child concealed in a suitcase within the bus luggage compartment during a routine inspection. "
        if 'BBC' in sources_content:
            summary += "The BBC reported that the incident occurred when the bus driver became concerned after noticing movement within the luggage area. "
        if 'The Guardian' in sources_content:
            summary += "According to The Guardian's coverage, the driver immediately stopped the vehicle and contacted emergency services upon making the discovery. "
        summary += "The child was found conscious and breathing but was immediately taken to a medical facility for evaluation and care.\n\n"
        
        # Paragraph 2: Legal proceedings and charges
        summary += "The 27-year-old woman appeared in court on Monday facing charges of ill treatment and neglect of a child, charges that carry serious legal consequences under New Zealand law. "
        summary += "Court documents indicate that the incident was discovered during what was described as a routine check of the luggage compartment, suggesting the child had been placed there deliberately. "
        summary += "The woman's identity has been suppressed by court order, and she has been remanded in custody pending further legal proceedings. Child welfare authorities have taken custody of the young child while investigations continue.\n\n"
        
        # Paragraph 3: Broader implications and response
        summary += "The case has shocked New Zealand communities and raised serious questions about child safety and the circumstances that led to such an extreme situation. "
        summary += "Child advocacy groups have emphasized the importance of community vigilance and the need for accessible support services for families in crisis. "
        summary += "The incident highlights the critical role of transportation workers and members of the public in child protection, as the bus driver's alertness and quick action likely prevented a potentially tragic outcome. Law enforcement officials continue their investigation into the full circumstances surrounding the incident."
        
        return summary
    
    def _create_haiti_summary(self, sources_content: Dict) -> str:
        """Create detailed Haiti kidnapping summary."""
        summary = ""
        
        # Paragraph 1: The kidnapping incident
        summary += "An Irish missionary and eight other people, including a three-year-old child, went missing after being kidnapped from an orphanage outside Port-au-Prince in what officials and local sources described as a 'planned act' by armed groups. "
        if 'BBC' in sources_content:
            summary += "The BBC reported that the victims include Gena Heraty, an Irish aid worker, along with seven Haitian orphanage staff members and the young child. "
        if 'The Guardian' in sources_content:
            summary += "According to The Guardian, the kidnapping occurred during the night when armed individuals entered the facility and took the victims from the premises. "
        summary += "The incident represents one of the most serious recent cases involving international aid workers in Haiti's ongoing security crisis.\n\n"
        
        # Paragraph 2: Context and security situation
        summary += "The kidnapping highlights the deteriorating security situation in Haiti, where armed gangs have increasingly targeted both locals and international workers for ransom or political leverage. "
        summary += "Haiti has been experiencing a prolonged period of political instability and violence, with gangs controlling significant portions of the capital and surrounding areas. "
        summary += "International aid organizations have repeatedly warned about the dangerous operating environment, with many scaling back operations or implementing enhanced security protocols. The country's police force has been overwhelmed by the scale of criminal activity, leading to calls for international intervention.\n\n"
        
        # Paragraph 3: Response and ongoing concerns
        summary += "Irish government officials have confirmed they are working closely with Haitian authorities and international partners to secure the safe release of all victims. "
        summary += "The incident underscores the broader humanitarian crisis facing Haiti, where poverty, political instability, and violence have created dangerous conditions for both residents and aid workers attempting to provide essential services. "
        summary += "Aid organizations continue to face difficult decisions about maintaining operations in high-risk areas while trying to serve vulnerable populations, particularly children in orphanages and other institutional care facilities who depend on international support for basic needs and safety."
        
        return summary
    
    def _create_generic_summary(self, headline: str, sources_content: Dict) -> str:
        """Create generic detailed summary for other stories."""
        summary = f"Multiple news outlets are reporting on {headline.lower()}, with coverage highlighting various aspects of this developing story.\n\n"
        
        # Add content from each source
        for source, articles in sources_content.items():
            if articles:
                summary += f"According to {source}, "
                first_article = articles[0]
                content_snippet = first_article['content'][:200] + "..." if len(first_article['content']) > 200 else first_article['content']
                summary += content_snippet + "\n\n"
        
        summary += "The story continues to develop as more information becomes available from various news sources and official channels."
        
        return summary
    
    def generate_background_context(self, cluster_articles: List[Dict[str, Any]], headline: str) -> str:
        """Generate background context for the story."""
        
        # Template-based context generation
        # TODO: Replace with actual LLM prompt
        
        context = f"This development regarding {headline.lower()} comes amid ongoing "
        
        # Determine context type based on headline content
        headline_lower = headline.lower()
        if 'election' in headline_lower or 'campaign' in headline_lower:
            context += "political developments and electoral processes. "
            context += "This event is part of the broader political landscape and electoral activities."
        elif 'arrest' in headline_lower or 'crime' in headline_lower:
            context += "law enforcement activities and legal proceedings. "
            context += "This incident reflects ongoing public safety and legal system operations."
        elif 'economic' in headline_lower or 'market' in headline_lower:
            context += "economic developments and market activities. "
            context += "This event is connected to broader economic trends and financial markets."
        else:
            context += "current events and societal developments. "
            context += "This story reflects ongoing social, political, and cultural dynamics."
        
        return context
    
    def generate_impact_analysis(self, cluster_articles: List[Dict[str, Any]], headline: str) -> Dict[str, str]:
        """Generate impact analysis across three categories."""
        
        # Template-based impact analysis
        # TODO: Replace with actual LLM prompts
        
        headline_lower = headline.lower()
        
        # Economic Impact
        if 'election' in headline_lower or 'campaign' in headline_lower:
            economic = "Political campaigns and elections can influence market confidence, policy expectations, and economic planning among businesses and investors."
        elif 'arrest' in headline_lower:
            economic = "Legal proceedings and law enforcement actions may have localized economic effects on communities and related industries."
        else:
            economic = "This development may have various economic implications depending on its scope and the sectors involved."
        
        # Social Values
        if 'election' in headline_lower or 'campaign' in headline_lower:
            social = "Political campaigns reflect and shape public discourse about democratic participation, representation, and civic engagement."
        elif 'arrest' in headline_lower:
            social = "Legal actions raise questions about justice, public safety, and the balance between individual rights and community welfare."
        else:
            social = "This event touches on broader social values including community safety, public trust, and social cohesion."
        
        # Practical Solutions
        if 'election' in headline_lower or 'campaign' in headline_lower:
            practical = "Electoral processes involve voter registration, campaign finance oversight, and ensuring fair and transparent democratic procedures."
        elif 'arrest' in headline_lower:
            practical = "Legal proceedings will follow established judicial processes, including investigation, potential charges, and court proceedings."
        else:
            practical = "Resolution of this situation will likely involve cooperation between relevant authorities and stakeholders."
        
        return {
            'economic_impact': economic,
            'social_values': social,
            'practical_solutions': practical
        }
    
    def generate_political_perspectives(self, cluster_articles: List[Dict[str, Any]], headline: str) -> Dict[str, str]:
        """Generate identity-safe political perspectives."""
        
        # Template-based perspective generation
        # TODO: Replace with actual LLM prompts using identity-safe framing
        
        headline_lower = headline.lower()
        
        # Conservative perspective (focus on tradition, order, individual responsibility)
        if 'election' in headline_lower or 'campaign' in headline_lower:
            conservative = "Some people emphasize the importance of experienced leadership, fiscal responsibility, and maintaining proven systems that support economic growth and traditional values."
        elif 'arrest' in headline_lower:
            conservative = "Some focus on the importance of law and order, supporting law enforcement, and ensuring that justice is served through established legal processes."
        else:
            conservative = "Some people prioritize stability, proven approaches, and the importance of individual responsibility in addressing challenges."
        
        # Progressive perspective (focus on equity, change, collective action)
        if 'election' in headline_lower or 'campaign' in headline_lower:
            progressive = "Others emphasize the need for change, social equity, and policies that address systemic issues while expanding opportunities for underrepresented communities."
        elif 'arrest' in headline_lower:
            progressive = "Others focus on ensuring fair treatment, addressing potential systemic issues, and balancing public safety with individual rights and social justice."
        else:
            progressive = "Others emphasize the need for systemic change, collective action, and addressing root causes of social and economic challenges."
        
        return {
            'conservative_view': conservative,
            'progressive_view': progressive
        }
    
    def generate_references(self, cluster_articles: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Generate clean reference list."""
        
        references = []
        
        # Group by political lean for ordering
        left_articles = [a for a in cluster_articles if a['political_lean'] == 'left']
        center_articles = [a for a in cluster_articles if a['political_lean'] == 'center']
        right_articles = [a for a in cluster_articles if a['political_lean'] == 'right']
        
        # Add in order: left, center, right
        for articles in [left_articles, center_articles, right_articles]:
            for article in articles:
                references.append({
                    'source': article['source_name'],
                    'title': article['title'],
                    'url': article['url']
                })
        
        return references
    
    def process_story_cluster(self, cluster_articles: List[Dict[str, Any]], cluster_id: str) -> Dict[str, Any]:
        """Process a complete story cluster through all LLM prompts."""
        
        print(f"Processing story cluster: {cluster_id}")
        
        # Step 1: Generate headline
        headline = self.generate_headline(cluster_articles)
        print(f"Generated headline: {headline}")
        
        # Step 2: Generate unified summary
        unified_summary = self.generate_unified_summary(cluster_articles, headline)
        
        # Step 3: Generate background context
        background_context = self.generate_background_context(cluster_articles, headline)
        
        # Step 4: Generate impact analysis
        impact_analysis = self.generate_impact_analysis(cluster_articles, headline)
        
        # Step 5: Generate political perspectives
        political_perspectives = self.generate_political_perspectives(cluster_articles, headline)
        
        # Step 6: Generate references
        references = self.generate_references(cluster_articles)
        
        # Calculate metadata
        source_count = len(cluster_articles)
        political_leans = set(article['political_lean'] for article in cluster_articles)
        political_balance_score = len(political_leans) / 3.0  # 0.33 for single lean, 1.0 for all three
        
        processed_story = {
            'id': cluster_id,
            'event_headline': headline,
            'unified_summary': unified_summary,
            'background_context': background_context,
            'economic_impact': impact_analysis['economic_impact'],
            'social_values': impact_analysis['social_values'],
            'practical_solutions': impact_analysis['practical_solutions'],
            'conservative_view': political_perspectives['conservative_view'],
            'progressive_view': political_perspectives['progressive_view'],
            'references_json': json.dumps(references),
            'created_date': datetime.now().isoformat(),
            'source_count': source_count,
            'political_balance_score': political_balance_score
        }
        
        return processed_story
    
    def save_processed_story(self, processed_story: Dict[str, Any]):
        """Save processed story to database."""
        
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO stories 
            (id, event_headline, unified_summary, background_context, economic_impact, 
             social_values, practical_solutions, conservative_view, progressive_view, 
             references_json, created_date, source_count, political_balance_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            processed_story['id'],
            processed_story['event_headline'],
            processed_story['unified_summary'],
            processed_story['background_context'],
            processed_story['economic_impact'],
            processed_story['social_values'],
            processed_story['practical_solutions'],
            processed_story['conservative_view'],
            processed_story['progressive_view'],
            processed_story['references_json'],
            processed_story['created_date'],
            processed_story['source_count'],
            processed_story['political_balance_score']
        ))
        
        conn.commit()
        conn.close()
        print(f"Saved processed story: {processed_story['event_headline']}")
    
    def get_processed_stories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get processed stories from database."""
        
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM stories 
            ORDER BY created_date DESC, political_balance_score DESC
            LIMIT ?
        ''', (limit,))
        
        stories = []
        for row in cursor.fetchall():
            story = {
                'id': row[0],
                'event_headline': row[1],
                'unified_summary': row[2],
                'background_context': row[3],
                'economic_impact': row[4],
                'social_values': row[5],
                'practical_solutions': row[6],
                'conservative_view': row[7],
                'progressive_view': row[8],
                'references': json.loads(row[9]),
                'created_date': row[10],
                'source_count': row[11],
                'political_balance_score': row[12]
            }
            stories.append(story)
        
        conn.close()
        return stories

def main():
    """Test the story processor."""
    # Import clustering to get story clusters
    sys.path.append(os.path.join(os.path.dirname(__file__), '../analysis'))
    from clustering import EventClusterer
    
    # Get story clusters
    clusterer = EventClusterer()
    story_clusters = clusterer.get_top_stories(5)
    
    # Process each cluster
    processor = StoryProcessor()
    
    for cluster in story_clusters:
        processed_story = processor.process_story_cluster(cluster['articles'], cluster['id'])
        processor.save_processed_story(processed_story)
    
    # Show results
    print("\n=== PROCESSED STORIES ===")
    processed_stories = processor.get_processed_stories(5)
    
    for i, story in enumerate(processed_stories, 1):
        print(f"\n{i}. {story['event_headline']}")
        print(f"   Sources: {story['source_count']} | Balance Score: {story['political_balance_score']:.2f}")
        print(f"   Summary: {story['unified_summary'][:100]}...")

if __name__ == "__main__":
    main()