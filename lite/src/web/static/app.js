// News Bot Frontend Application
class NewsApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentStory = null;
        this.stories = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleInitialRoute();
    }

    bindEvents() {
        // View news button
        document.getElementById('view-news-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToStories();
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange(event.state);
        });

        // Smooth scrolling is now natural with the single page layout
    }

    handleInitialRoute() {
        // Set initial state for home page
        if (window.location.pathname === '/') {
            history.replaceState({ screen: 'home' }, '', '/');
            this.showScreen('home');
        }
        // Check URL path and show appropriate screen
        else if (window.location.pathname === '/stories') {
            this.loadStories();
        } else if (window.location.pathname.startsWith('/story/')) {
            const storyId = window.location.pathname.split('/')[2];
            this.loadStoryDetails(storyId);
        } else {
            // Fallback to home for any unrecognized route
            history.replaceState({ screen: 'home' }, '', '/');
            this.showScreen('home');
        }
    }

    handleRouteChange(state) {
        if (state) {
            if (state.screen === 'stories') {
                this.showScreen('stories');
            } else if (state.screen === 'story') {
                this.loadStoryDetails(state.storyId);
            } else {
                this.showScreen('home');
            }
        } else {
            this.showScreen('home');
        }
    }

    navigateToStories() {
        history.pushState({ screen: 'stories' }, '', '/stories');
        this.loadStories();
    }

    navigateToStory(storyId) {
        history.pushState({ screen: 'story', storyId: storyId }, '', `/story/${storyId}`);
        this.loadStoryDetails(storyId);
    }

    showScreen(screenName) {
        const currentScreen = document.querySelector('.screen.active');
        const targetScreen = document.getElementById(`${screenName}-screen`);
        
        if (currentScreen === targetScreen) return;

        // Reset scroll position immediately
        window.scrollTo(0, 0);
        
        // Clear any previous story content when leaving story screen
        if (currentScreen && currentScreen.id === 'story-screen') {
            this.clearStoryContent();
        }

        if (!currentScreen) {
            // First load - no transition needed
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            return;
        }

        // Prepare target screen for crossfade
        targetScreen.style.position = 'fixed';
        targetScreen.style.top = '0';
        targetScreen.style.left = '0';
        targetScreen.style.width = '100%';
        targetScreen.style.opacity = '0';
        targetScreen.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
        targetScreen.style.zIndex = '1';
        
        // Show target screen behind current screen
        targetScreen.classList.add('active');
        
        // Force reflow
        targetScreen.offsetHeight;
        
        // Start crossfade
        currentScreen.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
        currentScreen.style.opacity = '0';
        targetScreen.style.opacity = '1';
        
        // Clean up after transition
        setTimeout(() => {
            // Hide old screen
            currentScreen.classList.remove('active');
            currentScreen.style.transition = '';
            currentScreen.style.opacity = '';
            
            // Reset target screen positioning
            targetScreen.style.position = '';
            targetScreen.style.top = '';
            targetScreen.style.left = '';
            targetScreen.style.width = '';
            targetScreen.style.transition = '';
            targetScreen.style.opacity = '';
            targetScreen.style.zIndex = '';
            
        }, 500);

        this.currentScreen = screenName;
    }

    async loadStories() {
        try {
            this.showScreen('stories');
            
            const response = await fetch('/api/stories');
            if (!response.ok) {
                throw new Error('Failed to fetch stories');
            }
            
            this.stories = await response.json();
            this.renderStories();
            
        } catch (error) {
            console.error('Error loading stories:', error);
            document.getElementById('stories-list').innerHTML = 
                '<div class="loading">Error loading stories. Please try again.</div>';
        }
    }

    renderStories() {
        const storiesList = document.getElementById('stories-list');
        
        if (this.stories.length === 0) {
            storiesList.innerHTML = '<div class="loading">No stories available.</div>';
            return;
        }

        const storiesHTML = this.stories.map(story => `
            <div class="story-item" data-story-id="${story.id}">
                <span class="story-number">${story.number}.</span>
                <div class="story-content">
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-subtitle">${story.subtitle}</p>
                </div>
            </div>
        `).join('');

        storiesList.innerHTML = storiesHTML;

        // Bind click events to story items
        document.querySelectorAll('.story-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const storyId = item.dataset.storyId;
                this.navigateToStory(storyId);
            });
        });
    }

    async loadStoryDetails(storyId) {
        try {
            // Step 1: Prepare story screen with loading state BEFORE transition
            this.resetStoryToLoading();
            
            // Step 2: Now transition to story screen (already in loading state)
            this.showScreen('story');
            
            // Step 3: Fetch data
            const response = await fetch(`/api/story/${storyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch story details');
            }
            
            // Step 4: Process data
            this.currentStory = await response.json();
            this.renderStoryDetails();
            
            // Step 5: Show content with smooth transition
            this.showStoryContent();
            
        } catch (error) {
            console.error('Error loading story details:', error);
            alert('Error loading story details. Please try again.');
        }
    }

    resetStoryToLoading() {
        // Ensure loading screen is visible and content is hidden
        const loadingEl = document.getElementById('story-loading');
        const contentEl = document.getElementById('story-content');
        
        // Show loading, hide content
        loadingEl.classList.remove('hidden');
        contentEl.classList.remove('loaded');
        
        // Force immediate state
        loadingEl.style.opacity = '1';
        contentEl.style.opacity = '0';
    }

    showStoryContent() {
        // Smooth transition from loading to content
        setTimeout(() => {
            const loadingEl = document.getElementById('story-loading');
            const contentEl = document.getElementById('story-content');
            
            // Start the crossfade
            loadingEl.classList.add('hidden');
            contentEl.classList.add('loaded');
            
            // Clean up inline styles after CSS transition completes
            setTimeout(() => {
                loadingEl.style.opacity = '';
                contentEl.style.opacity = '';
            }, 300);
            
        }, 200); // Show loading briefly before transitioning
    }
    
    clearStoryContent() {
        // Clear story content and reset to clean state
        const loadingEl = document.getElementById('story-loading');
        const contentEl = document.getElementById('story-content');
        
        // Reset to loading state
        loadingEl.classList.remove('hidden');
        contentEl.classList.remove('loaded');
        
        // Clear any inline styles
        loadingEl.style.opacity = '';
        contentEl.style.opacity = '';
        
        // Clear content to prevent scroll bleeding
        this.currentStory = null;
    }

    renderStoryDetails() {
        if (!this.currentStory) return;

        // Render summary section
        document.getElementById('summary-number').textContent = `${this.currentStory.number}.`;
        document.getElementById('summary-title').textContent = this.currentStory.title;
        document.getElementById('summary-subtitle').textContent = this.currentStory.subtitle;
        document.getElementById('summary-content').textContent = this.currentStory.unified_summary;

        // Render details section
        this.renderDetailBullets('context-bullets', this.currentStory.background_context.bullets);
        this.renderDetailBullets('practical-bullets', this.currentStory.practical_solutions.bullets);
        this.renderDetailBullets('social-bullets', this.currentStory.social_values.bullets);
        this.renderDetailBullets('economic-bullets', this.currentStory.economic_impact.bullets);

        // Render political perspectives
        document.getElementById('conservative-perspective').textContent = 
            this.currentStory.political_perspectives.conservative;
        document.getElementById('progressive-perspective').textContent = 
            this.currentStory.political_perspectives.progressive;

        // Render references section
        document.getElementById('references-number').textContent = `${this.currentStory.number}.`;
        this.renderReferences();
    }

    renderDetailBullets(elementId, bullets) {
        const element = document.getElementById(elementId);
        const bulletsHTML = bullets.map(bullet => `<li>${bullet}</li>`).join('');
        element.innerHTML = bulletsHTML;
    }

    renderReferences() {
        const referencesList = document.getElementById('references-list');
        
        if (!this.currentStory.references || this.currentStory.references.length === 0) {
            referencesList.innerHTML = '<div class="reference-item">No references available.</div>';
            return;
        }

        const referencesHTML = this.currentStory.references.map(ref => `
            <div class="reference-item">
                <span class="reference-source">${ref.source}</span>:
                <span class="reference-title">"${ref.title}"</span> - 
                <a href="${ref.url}" target="_blank" class="reference-link">${this.getDomainFromUrl(ref.url)}</a>
            </div>
        `).join('');

        referencesList.innerHTML = referencesHTML;
    }

    getDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.newsApp = new NewsApp();
});