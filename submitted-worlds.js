// Submitted Worlds JavaScript
import { database } from './firebase-config.js';
import { loadUserWorlds, formatDate } from './worlds.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global variables
let allCommunityWorlds = [];
let filteredWorlds = [];

// Initialize community worlds page
function initCommunityWorlds() {
    setupEventListeners();
    loadCommunityWorlds();
    updateCommunityStats();
}

// Setup event listeners
function setupEventListeners() {
    // Filter controls
    const sortFilter = document.getElementById('sortFilter');
    const creatorFilter = document.getElementById('creatorFilter');
    
    if (sortFilter) {
        sortFilter.addEventListener('change', filterAndDisplayWorlds);
    }
    
    if (creatorFilter) {
        creatorFilter.addEventListener('change', filterAndDisplayWorlds);
    }
}

// Load community worlds
async function loadCommunityWorlds() {
    const grid = document.getElementById('communityWorldsGrid');
    if (!grid) return;

    try {
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading community worlds...</p>
            </div>
        `;

        // Fetch user worlds from Firebase
        allCommunityWorlds = await loadUserWorlds();
        
        // Populate creator filter
        populateCreatorFilter();
        
        // Display worlds
        filterAndDisplayWorlds();

    } catch (error) {
        console.error('Error loading community worlds:', error);
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading community worlds. Please try again later.</p>
            </div>
        `;
    }
}

// Populate creator filter dropdown
function populateCreatorFilter() {
    const creatorFilter = document.getElementById('creatorFilter');
    if (!creatorFilter) return;

    // Get unique creators
    const creators = [...new Set(allCommunityWorlds.map(world => world.createdBy))].sort();
    
    // Clear existing options (except "All Creators")
    creatorFilter.innerHTML = '<option value="all">All Creators</option>';
    
    // Add creator options
    creators.forEach(creator => {
        if (creator) {
            const option = document.createElement('option');
            option.value = creator;
            option.textContent = creator;
            creatorFilter.appendChild(option);
        }
    });
}

// Filter and display worlds
function filterAndDisplayWorlds() {
    const grid = document.getElementById('communityWorldsGrid');
    if (!grid) return;

    // Apply filters
    filteredWorlds = [...allCommunityWorlds];
    
    // Filter by creator
    const creatorFilter = document.getElementById('creatorFilter');
    const selectedCreator = creatorFilter?.value;
    
    if (selectedCreator && selectedCreator !== 'all') {
        filteredWorlds = filteredWorlds.filter(world => world.createdBy === selectedCreator);
    }
    
    // Sort worlds
    const sortFilter = document.getElementById('sortFilter');
    const sortBy = sortFilter?.value || 'newest';
    
    switch (sortBy) {
        case 'oldest':
            filteredWorlds.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case 'name':
            filteredWorlds.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'creator':
            filteredWorlds.sort((a, b) => (a.createdBy || '').localeCompare(b.createdBy || ''));
            break;
        default: // newest
            filteredWorlds.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    // Display worlds
    if (filteredWorlds.length === 0) {
    displayEmptyState();
    return;
    }
    
    grid.innerHTML = filteredWorlds.map(world => createCommunityWorldCard(world)).join('');
    
    // Add click handlers
    grid.querySelectorAll('.world-card').forEach(card => {
        card.addEventListener('click', () => {
            const worldId = card.dataset.worldId;
            window.location.href = `world-detail.html?id=${worldId}&user=true`;
        });
    });
}

// Create community world card
function createCommunityWorldCard(world) {
    const characterCount = world.characters ? world.characters.length : 0;
    const placeCount = world.places ? world.places.length : 0;
    const storyCount = world.storyIdeas ? world.storyIdeas.length : 0;
    const createdDate = formatDate(world.createdAt);
    
    return `
        <div class="world-card fade-in" data-world-id="${world.id}" style="--world-color: ${world.colorScheme || '#6366f1'}">
            <div class="world-card-header">
                <h3 class="world-title">${escapeHtml(world.name || 'Untitled World')}</h3>
                <p class="world-state">${escapeHtml(world.currentState || 'Unknown State')}</p>
                <div class="world-creator">
                    <i class="fas fa-user"></i>
                    <span>by ${escapeHtml(world.createdBy || 'Unknown Creator')}</span>
                </div>
            </div>
            <div class="world-card-body">
                <p class="world-backstory">${escapeHtml(world.backstory || 'No backstory available.')}</p>
                
                <div class="world-stats">
                    <div class="world-stat">
                        <span class="world-stat-number">${characterCount}</span>
                        <span class="world-stat-label">Characters</span>
                    </div>
                    <div class="world-stat">
                        <span class="world-stat-number">${placeCount}</span>
                        <span class="world-stat-label">Places</span>
                    </div>
                    <div class="world-stat">
                        <span class="world-stat-number">${storyCount}</span>
                        <span class="world-stat-label">Stories</span>
                    </div>
                </div>
                
                <div class="world-meta">
                    <div class="world-tags">
                        ${world.themes ? world.themes.slice(0, 3).map(theme => 
                            `<span class="world-tag">${escapeHtml(theme)}</span>`
                        ).join('') : ''}
                    </div>
                    <div class="world-date">
                        <i class="fas fa-calendar"></i>
                        <span>${createdDate}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display empty state
function displayEmptyState() {
    const grid = document.getElementById('communityWorldsGrid');
    if (!grid) return;

    const creatorFilter = document.getElementById('creatorFilter');
    const selectedCreator = creatorFilter?.value;
    
    let emptyMessage = '';
    let emptyDescription = '';
    
    if (selectedCreator && selectedCreator !== 'all') {
        emptyMessage = 'No Worlds Found';
        emptyDescription = `No worlds found for creator "${selectedCreator}". Try selecting a different creator or viewing all worlds.`;
    } else if (allCommunityWorlds.length === 0) {
        emptyMessage = 'No fanon Worlds Yet';
        emptyDescription = 'Go wild.';
    } else {
        emptyMessage = 'No Worlds Match Filter';
        emptyDescription = 'Try adjusting your filters to see more worlds.';
    }
    
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-globe-americas"></i>
            <h3>${emptyMessage}</h3>
            <p>${emptyDescription}</p>
            ${allCommunityWorlds.length === 0 ? `
                <a href="create-world.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create Your First World
                </a>
            ` : ''}
        </div>
    `;
}

// Update community statistics
async function updateCommunityStats() {
    try {
        const userWorldsRef = ref(database, 'userWorlds');
        const snapshot = await get(userWorldsRef);
        
        let worldCount = 0;
        let creatorCount = 0;
        let characterCount = 0;
        const creators = new Set();

        if (snapshot.exists()) {
            const worlds = snapshot.val();
            worldCount = Object.keys(worlds).length;
            
            Object.values(worlds).forEach(world => {
                if (world.createdBy) {
                    creators.add(world.createdBy);
                }
                if (world.characters) {
                    characterCount += world.characters.length;
                }
            });
            
            creatorCount = creators.size;
        }

        // Update DOM elements
        const worldCountEl = document.getElementById('communityWorldCount');
        const creatorCountEl = document.getElementById('communityCreators');
        const characterCountEl = document.getElementById('communityCharacters');

        if (worldCountEl) {
            animateCounter(worldCountEl, worldCount);
        }
        if (creatorCountEl) {
            animateCounter(creatorCountEl, creatorCount);
        }
        if (characterCountEl) {
            animateCounter(characterCountEl, characterCount);
        }

    } catch (error) {
        console.error('Error updating community stats:', error);
    }
}

// Animate counter numbers
function animateCounter(element, targetValue) {
    const duration = 2000; // 2 seconds
    const startValue = 0;
    const startTime = Date.now();
    
    function updateCounter() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    updateCounter();
}

// Utility function
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCommunityWorlds);

// Export for other modules if needed
export { initCommunityWorlds };