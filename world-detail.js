// World Detail JavaScript
import { database } from './firebase-config.js';
import { currentUser, isAdmin, showNotification } from './auth.js';
import { getWorld, deleteWorld, formatDate, addCharacterToWorld, addPlaceToWorld, addSoundtrackToWorld } from './worlds.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global variables
let currentWorldId = null;
let currentWorld = null;
let isUserWorld = false;

// Initialize world detail page
function initWorldDetail() {
    // Get world ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentWorldId = urlParams.get('id');
    isUserWorld = urlParams.get('user') === 'true';
    
    if (!currentWorldId) {
        showError();
        return;
    }
    
    loadWorld();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Admin actions
    document.getElementById('editWorldBtn')?.addEventListener('click', editWorld);
    document.getElementById('deleteWorldBtn')?.addEventListener('click', confirmDeleteWorld);
    
    // Contribution actions (available to all logged-in users)
    document.getElementById('addCharacterBtn')?.addEventListener('click', () => showModal('addCharacterModal'));
    document.getElementById('addPlaceBtn')?.addEventListener('click', () => showModal('addPlaceModal'));
    document.getElementById('addSoundtrackBtn')?.addEventListener('click', () => showModal('addSoundtrackModal'));
    
    // Form submissions
    document.getElementById('addCharacterForm')?.addEventListener('submit', handleAddCharacter);
    document.getElementById('addPlaceForm')?.addEventListener('submit', handleAddPlace);
    document.getElementById('addSoundtrackForm')?.addEventListener('submit', handleAddSoundtrack);
}

// Load world data
async function loadWorld() {
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const worldContent = document.getElementById('worldContent');
    
    try {
        // Show loading
        if (loadingSection) loadingSection.style.display = 'flex';
        if (errorSection) errorSection.style.display = 'none';
        if (worldContent) worldContent.style.display = 'none';
        
        // Fetch world data
        currentWorld = await getWorld(currentWorldId, isUserWorld);
        
        if (!currentWorld) {
            showError();
            return;
        }
        
        // Display world
        displayWorld(currentWorld);
        
        // Show admin actions if user is admin
        updateAdminActions();
        
        // Hide loading and show content
        if (loadingSection) loadingSection.style.display = 'none';
        if (worldContent) worldContent.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading world:', error);
        showError();
    }
}

// Display world data
function displayWorld(world) {
    // Set document title
    document.title = `${world.name} - WorldCrafters`;
    
    // Apply color scheme
    if (world.colorScheme) {
        document.documentElement.style.setProperty('--world-color', world.colorScheme);
    }
    
    // Basic information
    const titleEl = document.getElementById('worldTitle');
    const stateEl = document.getElementById('worldCurrentState');
    const createdInfoEl = document.getElementById('worldCreatedInfo');
    
    if (titleEl) titleEl.textContent = world.name || 'Untitled World';
    if (stateEl) stateEl.textContent = world.currentState || 'Current state unknown';
    if (createdInfoEl) {
        const createdDate = formatDate(world.createdAt);
        const creator = world.createdBy || 'Unknown creator';
        createdInfoEl.textContent = `Created on ${createdDate} by ${creator}`;
    }
    
    // Backstory
    displayBackstory(world.backstory);
    
    // Characters
    displayCharacters(world.characters);
    
    // Places
    displayPlaces(world.places);
    
    // Story Ideas
    displayStoryIdeas(world.storyIdeas);
    
    // Conflicts
    displayConflicts(world.conflicts);
    
    // Soundtracks
    displaySoundtracks(world.soundtracks);
    
    // Themes
    displayThemes(world.themes);
    
    // Cultures
    displayCultures(world.cultures);
}

// Display backstory
function displayBackstory(backstory) {
    const section = document.getElementById('backstorySection');
    const content = document.getElementById('worldBackstory');
    
    if (!backstory || backstory.trim() === '') {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (content) {
        content.innerHTML = `<p>${escapeHtml(backstory).replace(/\n/g, '</p><p>')}</p>`;
    }
}

// Display characters
function displayCharacters(characters) {
    const section = document.getElementById('charactersSection');
    const grid = document.getElementById('charactersGrid');
    
    if (!characters || characters.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (grid) {
        grid.innerHTML = characters.map(character => `
            <div class="character-card">
                <div class="character-name">${escapeHtml(character.name)}</div>
                <div class="character-bio">${escapeHtml(character.bio || 'No biography available.')}</div>
                <div class="character-stats-display">
                    <div class="character-stat">
                        <span class="character-stat-value">${character.stats?.AT || 10}</span>
                        <span class="character-stat-label">AT</span>
                    </div>
                    <div class="character-stat">
                        <span class="character-stat-value">${character.stats?.DEF || 10}</span>
                        <span class="character-stat-label">DEF</span>
                    </div>
                    <div class="character-stat">
                        <span class="character-stat-value">${character.stats?.HP || 20}</span>
                        <span class="character-stat-label">HP</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Display places
function displayPlaces(places) {
    const section = document.getElementById('placesSection');
    const list = document.getElementById('placesList');
    
    if (!places || places.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = places.map(place => {
            // Handle both old string format and new object format
            if (typeof place === 'string') {
                return `
                    <div class="content-item">
                        <i class="fas fa-map-marker-alt" style="color: var(--world-color, var(--primary-color)); margin-right: 8px;"></i>
                        ${escapeHtml(place)}
                    </div>
                `;
            } else {
                return `
                    <div class="content-item">
                        <div class="place-header">
                            <h4 style="color: var(--text-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: var(--world-color, var(--primary-color));"></i>
                                ${escapeHtml(place.name || 'Unnamed Place')}
                            </h4>
                        </div>
                        ${place.description ? `<p style="color: var(--text-secondary); margin: 8px 0;">${escapeHtml(place.description)}</p>` : ''}
                        ${place.significance ? `<p style="color: var(--text-muted); font-style: italic; font-size: 0.9rem; margin: 8px 0 0 0;"><strong>Significance:</strong> ${escapeHtml(place.significance)}</p>` : ''}
                    </div>
                `;
            }
        }).join('');
    }
}

// Display story ideas
function displayStoryIdeas(storyIdeas) {
    const section = document.getElementById('storyIdeasSection');
    const list = document.getElementById('storyIdeasList');
    
    if (!storyIdeas || storyIdeas.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = storyIdeas.map(idea => `
            <div class="content-item">
                <i class="fas fa-lightbulb" style="color: var(--world-color, var(--primary-color)); margin-right: 8px;"></i>
                ${escapeHtml(idea)}
            </div>
        `).join('');
    }
}

// Display conflicts
function displayConflicts(conflicts) {
    const section = document.getElementById('conflictsSection');
    const list = document.getElementById('conflictsList');
    
    if (!conflicts || conflicts.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = conflicts.map(conflict => `
            <div class="content-item">
                <i class="fas fa-exclamation-triangle" style="color: var(--world-color, var(--primary-color)); margin-right: 8px;"></i>
                ${escapeHtml(conflict)}
            </div>
        `).join('');
    }
}

// Display soundtracks
function displaySoundtracks(soundtracks) {
    const section = document.getElementById('soundtracksSection');
    const list = document.getElementById('soundtracksList');
    
    if (!soundtracks || soundtracks.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = soundtracks.map(soundtrack => {
            // Handle both old string format and new object format
            if (typeof soundtrack === 'string') {
                return `
                    <div class="content-item">
                        <i class="fas fa-music" style="color: var(--world-color, var(--primary-color)); margin-right: 8px;"></i>
                        ${escapeHtml(soundtrack)}
                    </div>
                `;
            } else {
                return `
                    <div class="content-item">
                        <div class="soundtrack-header">
                            <h4 style="color: var(--text-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-music" style="color: var(--world-color, var(--primary-color));"></i>
                                ${escapeHtml(soundtrack.name || 'Unnamed Soundtrack')}
                            </h4>
                        </div>
                        ${soundtrack.description ? `<p style="color: var(--text-secondary); margin: 8px 0;">${escapeHtml(soundtrack.description)}</p>` : ''}
                        ${soundtrack.url ? `
                            <div style="margin-top: 12px;">
                                <a href="${escapeHtml(soundtrack.url)}" target="_blank" class="soundtrack-link" style="
                                    color: var(--primary-color);
                                    text-decoration: none;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    font-weight: 500;
                                    transition: color 0.3s ease;
                                ">
                                    <i class="fas fa-external-link-alt"></i>
                                    Listen
                                </a>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }).join('');
    }
}

// Display themes
function displayThemes(themes) {
    const section = document.getElementById('themesSection');
    const list = document.getElementById('themesList');
    
    if (!themes || themes.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = themes.map(theme => `
            <span class="content-tag" style="background: linear-gradient(135deg, var(--world-color, var(--primary-color)), var(--secondary-color));">
                ${escapeHtml(theme)}
            </span>
        `).join('');
    }
}

// Display cultures
function displayCultures(cultures) {
    const section = document.getElementById('culturesSection');
    const list = document.getElementById('culturesList');
    
    if (!cultures || cultures.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (list) {
        list.innerHTML = cultures.map(culture => `
            <div class="content-item">
                <i class="fas fa-users" style="color: var(--world-color, var(--primary-color)); margin-right: 8px;"></i>
                ${escapeHtml(culture)}
            </div>
        `).join('');
    }
}

// Update admin actions visibility
function updateAdminActions() {
    const adminActions = document.getElementById('adminActions');
    const addCharacterBtn = document.getElementById('addCharacterBtn');
    const addPlaceBtn = document.getElementById('addPlaceBtn');
    const addSoundtrackBtn = document.getElementById('addSoundtrackBtn');
    
    // Show admin actions only for admins
    if (isAdmin && adminActions) {
        adminActions.style.display = 'flex';
    }
    
    // Show contribution buttons for all logged-in users
    if (currentUser) {
        if (addCharacterBtn) addCharacterBtn.style.display = 'block';
        if (addPlaceBtn) addPlaceBtn.style.display = 'block';
        if (addSoundtrackBtn) addSoundtrackBtn.style.display = 'block';
    }
}

// Edit world
function editWorld() {
    if (!isAdmin) {
        showNotification('Only admins can edit worlds.', 'error');
        return;
    }
    
    // Redirect to admin panel with edit mode
    const editUrl = `admin.html?edit=${currentWorldId}&user=${isUserWorld}`;
    window.location.href = editUrl;
}

// Confirm delete world
function confirmDeleteWorld() {
    if (!isAdmin) {
        showNotification('Only admins can delete worlds.', 'error');
        return;
    }
    
    const worldName = currentWorld?.name || 'this world';
    
    if (confirm(`Are you sure you want to delete "${worldName}"? This action cannot be undone.`)) {
        handleDeleteWorld();
    }
}

// Handle world deletion
async function handleDeleteWorld() {
    try {
        await deleteWorld(currentWorldId, isUserWorld);
        showNotification('World deleted successfully!', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = isUserWorld ? 'submitted-worlds.html' : 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error deleting world:', error);
        showNotification('Error deleting world. Please try again.', 'error');
    }
}

// Show error state
function showError() {
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const worldContent = document.getElementById('worldContent');
    
    if (loadingSection) loadingSection.style.display = 'none';
    if (errorSection) errorSection.style.display = 'flex';
    if (worldContent) worldContent.style.display = 'none';
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

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Handle add character
async function handleAddCharacter(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please log in to add characters.', 'error');
        return;
    }
    
    try {
        const character = {
            name: document.getElementById('characterName').value.trim(),
            bio: document.getElementById('characterBio').value.trim(),
            stats: {
                AT: parseInt(document.getElementById('characterAT').value) || 10,
                DEF: parseInt(document.getElementById('characterDEF').value) || 10,
                HP: parseInt(document.getElementById('characterHP').value) || 20
            },
            addedBy: currentUser.email,
            addedAt: Date.now()
        };
        
        if (!character.name) {
            showNotification('Character name is required.', 'error');
            return;
        }
        
        await addCharacterToWorld(currentWorldId, character, isUserWorld);
        
        showNotification('Character added successfully!', 'success');
        closeModal('addCharacterModal');
        
        // Reset form
        document.getElementById('addCharacterForm').reset();
        document.getElementById('characterAT').value = '10';
        document.getElementById('characterDEF').value = '10';
        document.getElementById('characterHP').value = '20';
        
        // Reload world to show new character
        loadWorld();
        
    } catch (error) {
        console.error('Error adding character:', error);
        showNotification('Error adding character. Please try again.', 'error');
    }
}

// Handle add place
async function handleAddPlace(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please log in to add places.', 'error');
        return;
    }
    
    try {
        const place = {
            name: document.getElementById('placeName').value.trim(),
            description: document.getElementById('placeDescription').value.trim(),
            significance: document.getElementById('placeSignificance').value.trim(),
            addedBy: currentUser.email,
            addedAt: Date.now()
        };
        
        if (!place.name) {
            showNotification('Place name is required.', 'error');
            return;
        }
        
        await addPlaceToWorld(currentWorldId, place, isUserWorld);
        
        showNotification('Place added successfully!', 'success');
        closeModal('addPlaceModal');
        
        // Reset form
        document.getElementById('addPlaceForm').reset();
        
        // Reload world to show new place
        loadWorld();
        
    } catch (error) {
        console.error('Error adding place:', error);
        showNotification('Error adding place. Please try again.', 'error');
    }
}

// Handle add soundtrack
async function handleAddSoundtrack(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please log in to add soundtracks.', 'error');
        return;
    }
    
    try {
        const soundtrack = {
            name: document.getElementById('soundtrackName').value.trim(),
            description: document.getElementById('soundtrackDescription').value.trim(),
            url: document.getElementById('soundtrackUrl').value.trim(),
            addedBy: currentUser.email,
            addedAt: Date.now()
        };
        
        if (!soundtrack.name) {
            showNotification('Soundtrack name is required.', 'error');
            return;
        }
        
        await addSoundtrackToWorld(currentWorldId, soundtrack, isUserWorld);
        
        showNotification('Soundtrack added successfully!', 'success');
        closeModal('addSoundtrackModal');
        
        // Reset form
        document.getElementById('addSoundtrackForm').reset();
        
        // Reload world to show new soundtrack
        loadWorld();
        
    } catch (error) {
        console.error('Error adding soundtrack:', error);
        showNotification('Error adding soundtrack. Please try again.', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    setTimeout(initWorldDetail, 500);
});