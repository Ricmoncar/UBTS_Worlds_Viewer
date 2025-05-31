// Worlds Management Module
import { database } from './firebase-config.js';
import { currentUser, isAdmin } from './auth.js';
import { 
    ref, 
    push, 
    set, 
    get, 
    remove, 
    onValue,
    off 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// World data structure
export const createEmptyWorld = () => ({
    name: '',
    backstory: '',
    currentState: '',
    colorScheme: '#6366f1',
    imageUrl: '',
    wikiUrl: '',
    characters: [],
    soundtracks: [],
    storyIdeas: [],
    conflicts: [],
    places: [],
    themes: [],
    cultures: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: currentUser?.email || 'anonymous'
});

// Character data structure
export const createEmptyCharacter = () => ({
    name: '',
    bio: '',
    stats: {
        AT: 10,
        DEF: 10,
        HP: 20
    }
});

// Soundtrack data structure
export const createEmptySoundtrack = () => ({
    name: '',
    description: '',
    url: '',
    type: 'url' // 'url' or 'file'
});

// Place data structure
export const createEmptyPlace = () => ({
    name: '',
    description: '',
    significance: ''
});

// Initialize worlds display
export function initWorlds() {
    loadAndDisplayWorlds();
    updateStats();
    
    // Set up sorting
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', loadAndDisplayWorlds);
    }
}

// Load and display worlds
export async function loadAndDisplayWorlds() {
    const worldsGrid = document.getElementById('worldsGrid');
    if (!worldsGrid) return;

    try {
        // Show loading spinner
        worldsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading worlds...</p>
            </div>
        `;

        // Get admin worlds
        const adminWorldsRef = ref(database, 'adminWorlds');
        const snapshot = await get(adminWorldsRef);
        const worlds = [];

        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                worlds.push({ id: key, ...data[key] });
            });
        }

        // Sort worlds
        const sortFilter = document.getElementById('sortFilter');
        const sortBy = sortFilter ? sortFilter.value : 'newest';
        
        switch (sortBy) {
            case 'oldest':
                worlds.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'name':
                worlds.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default: // newest
                worlds.sort((a, b) => b.createdAt - a.createdAt);
        }

        // Display worlds
        if (worlds.length === 0) {
            worldsGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-globe"></i>
                    <p>No worlds have been created yet.</p>
                </div>
            `;
            return;
        }

        worldsGrid.innerHTML = worlds.map(world => createWorldCard(world)).join('');
        
        // Add click handlers
        worldsGrid.querySelectorAll('.world-card').forEach(card => {
            card.addEventListener('click', () => {
                const worldId = card.dataset.worldId;
                window.location.href = `world-detail.html?id=${worldId}`;
            });
        });

    } catch (error) {
        console.error('Error loading worlds:', error);
        worldsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading worlds. Please try again.</p>
            </div>
        `;
    }
}

// Create world card HTML
function createWorldCard(world) {
    const characterCount = world.characters ? world.characters.length : 0;
    // Handle both array of objects and array of strings for places
    const placeCount = world.places ? world.places.length : 0;
    const storyCount = world.storyIdeas ? world.storyIdeas.length : 0;
    
    const imageHtml = world.imageUrl ? 
        `<div class="world-image">
            <img src="${escapeHtml(world.imageUrl)}" alt="${escapeHtml(world.name)}" loading="lazy">
        </div>` : '';
    
    const wikiLinkHtml = world.wikiUrl ? 
        `<a href="${escapeHtml(world.wikiUrl)}" class="world-wiki-link" target="_blank" onclick="event.stopPropagation()">
            <i class="fas fa-external-link-alt"></i> Wiki
        </a>` : '';
    
    return `
        <div class="world-card fade-in" data-world-id="${world.id}" style="--world-color: ${world.colorScheme}">
            ${imageHtml}
            <div class="world-card-header">
                <h3 class="world-title">${escapeHtml(world.name || 'Untitled World')}</h3>
                <p class="world-state">${escapeHtml(world.currentState || 'Unknown State')}</p>
                ${wikiLinkHtml}
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
                
                <div class="world-tags">
                    ${world.themes ? world.themes.slice(0, 3).map(theme => 
                        `<span class="world-tag">${escapeHtml(theme)}</span>`
                    ).join('') : ''}
                </div>
            </div>
        </div>
    `;
}

// Save world to database
export async function saveWorld(worldData, isUserWorld = false) {
    // Admin worlds require login, but user worlds can be created anonymously
    if (!currentUser && !isUserWorld) {
        throw new Error('Must be logged in to save admin worlds');
    }

    worldData.updatedAt = Date.now();
    worldData.createdBy = currentUser?.email || 'Anonymous';

    try {
        const worldsRef = isUserWorld ? ref(database, 'userWorlds') : ref(database, 'adminWorlds');
        const newWorldRef = push(worldsRef);
        await set(newWorldRef, worldData);
        return newWorldRef.key;
    } catch (error) {
        console.error('Error saving world:', error);
        throw error;
    }
}

// Update existing world
export async function updateWorld(worldId, worldData, isUserWorld = false) {
    if (!currentUser) {
        throw new Error('Must be logged in to update worlds');
    }

    worldData.updatedAt = Date.now();

    try {
        const worldRef = isUserWorld ? 
            ref(database, `userWorlds/${worldId}`) : 
            ref(database, `adminWorlds/${worldId}`);
        await set(worldRef, worldData);
    } catch (error) {
        console.error('Error updating world:', error);
        throw error;
    }
}

// Delete world
export async function deleteWorld(worldId, isUserWorld = false) {
    if (!currentUser) {
        throw new Error('Must be logged in to delete worlds');
    }

    try {
        const worldRef = isUserWorld ? 
            ref(database, `userWorlds/${worldId}`) : 
            ref(database, `adminWorlds/${worldId}`);
        await remove(worldRef);
    } catch (error) {
        console.error('Error deleting world:', error);
        throw error;
    }
}

// Get single world
export async function getWorld(worldId, isUserWorld = false) {
    try {
        const worldRef = isUserWorld ? 
            ref(database, `userWorlds/${worldId}`) : 
            ref(database, `adminWorlds/${worldId}`);
        const snapshot = await get(worldRef);
        
        if (snapshot.exists()) {
            return { id: worldId, ...snapshot.val() };
        }
        return null;
    } catch (error) {
        console.error('Error getting world:', error);
        throw error;
    }
}

// Update statistics
async function updateStats() {
    try {
        // Get admin worlds
        const adminWorldsRef = ref(database, 'adminWorlds');
        const snapshot = await get(adminWorldsRef);
        
        let worldCount = 0;
        let characterCount = 0;
        let storyCount = 0;

        if (snapshot.exists()) {
            const worlds = snapshot.val();
            worldCount = Object.keys(worlds).length;
            
            Object.values(worlds).forEach(world => {
                if (world.characters) characterCount += world.characters.length;
                if (world.storyIdeas) storyCount += world.storyIdeas.length;
            });
        }

        // Update DOM
        const worldCountEl = document.getElementById('worldCount');
        const characterCountEl = document.getElementById('characterCount');
        const storyCountEl = document.getElementById('storyCount');

        if (worldCountEl) worldCountEl.textContent = worldCount;
        if (characterCountEl) characterCountEl.textContent = characterCount;
        if (storyCountEl) storyCountEl.textContent = storyCount;

    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load user worlds for community page
export async function loadUserWorlds() {
    try {
        const userWorldsRef = ref(database, 'userWorlds');
        const snapshot = await get(userWorldsRef);
        const worlds = [];

        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                worlds.push({ id: key, ...data[key], isUserWorld: true });
            });
        }

        return worlds.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error loading user worlds:', error);
        return [];
    }
}

// Add character to existing world
export async function addCharacterToWorld(worldId, character, isUserWorld = false) {
    if (!currentUser) {
        throw new Error('Must be logged in to add characters');
    }

    try {
        const world = await getWorld(worldId, isUserWorld);
        if (!world) {
            throw new Error('World not found');
        }

        const updatedCharacters = [...(world.characters || []), character];
        const updatedWorld = { ...world, characters: updatedCharacters, updatedAt: Date.now() };

        await updateWorld(worldId, updatedWorld, isUserWorld);
    } catch (error) {
        console.error('Error adding character to world:', error);
        throw error;
    }
}

// Add place to existing world
export async function addPlaceToWorld(worldId, place, isUserWorld = false) {
    if (!currentUser) {
        throw new Error('Must be logged in to add places');
    }

    try {
        const world = await getWorld(worldId, isUserWorld);
        if (!world) {
            throw new Error('World not found');
        }

        const updatedPlaces = [...(world.places || []), place];
        const updatedWorld = { ...world, places: updatedPlaces, updatedAt: Date.now() };

        await updateWorld(worldId, updatedWorld, isUserWorld);
    } catch (error) {
        console.error('Error adding place to world:', error);
        throw error;
    }
}

// Add soundtrack to existing world
export async function addSoundtrackToWorld(worldId, soundtrack, isUserWorld = false) {
    if (!currentUser) {
        throw new Error('Must be logged in to add soundtracks');
    }

    try {
        const world = await getWorld(worldId, isUserWorld);
        if (!world) {
            throw new Error('World not found');
        }

        const updatedSoundtracks = [...(world.soundtracks || []), soundtrack];
        const updatedWorld = { ...world, soundtracks: updatedSoundtracks, updatedAt: Date.now() };

        await updateWorld(worldId, updatedWorld, isUserWorld);
    } catch (error) {
        console.error('Error adding soundtrack to world:', error);
        throw error;
    }
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Format date
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on pages that need it
    if (document.getElementById('worldsGrid')) {
        initWorlds();
    }
});