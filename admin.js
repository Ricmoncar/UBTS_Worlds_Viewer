// Admin Panel JavaScript
import { database } from './firebase-config.js';
import { currentUser, isAdmin, showNotification } from './auth.js';
import { 
    saveWorld, 
    updateWorld, 
    deleteWorld, 
    getWorld,
    loadUserWorlds,
    createEmptyWorld, 
    createEmptyCharacter,
    createEmptyPlace,
    createEmptySoundtrack,
    formatDate 
} from './worlds.js';
import { 
    ref, 
    get, 
    onValue,
    off 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global variables
let currentEditingWorldId = null;
let currentEditingIsUserWorld = false;
let characterCounter = 0;
let placeCounter = 0;
let soundtrackCounter = 0;

// Initialize admin panel
function initAdminPanel() {
    // Check if user is admin
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize event listeners
    setupEventListeners();
    
    // Load worlds
    loadAdminWorlds();
    loadCommunityWorlds();
}

// Setup event listeners
function setupEventListeners() {
    // Quick action buttons
    document.getElementById('createWorldBtn')?.addEventListener('click', () => openWorldModal());
    document.getElementById('refreshWorldsBtn')?.addEventListener('click', refreshAllWorlds);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);

    // Modal events
    document.getElementById('worldForm')?.addEventListener('submit', handleWorldSubmit);
    document.getElementById('addCharacterBtn')?.addEventListener('click', addCharacterToForm);
    document.getElementById('addPlaceBtn')?.addEventListener('click', addPlaceToForm);
    document.getElementById('addSoundtrackBtn')?.addEventListener('click', addSoundtrackToForm);
    
    // Color scheme preview
    document.getElementById('worldColorScheme')?.addEventListener('input', updateColorPreview);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    // Sort filter
    document.getElementById('sortFilter')?.addEventListener('change', loadAdminWorlds);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

// Load admin worlds
async function loadAdminWorlds() {
    const grid = document.getElementById('adminWorldsGrid');
    if (!grid) return;

    try {
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading admin worlds...</p>
            </div>
        `;

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
        const sortBy = document.getElementById('sortFilter')?.value || 'newest';
        sortWorlds(worlds, sortBy);

        // Display worlds
        if (worlds.length === 0) {
            grid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-globe"></i>
                    <p>No admin worlds created yet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = worlds.map(world => createAdminWorldCard(world, false)).join('');
        
        // Add event listeners to action buttons
        setupWorldCardEvents(grid, false);

    } catch (error) {
        console.error('Error loading admin worlds:', error);
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading worlds.</p>
            </div>
        `;
    }
}

// Load community worlds
async function loadCommunityWorlds() {
    const grid = document.getElementById('userWorldsGrid');
    if (!grid) return;

    try {
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading community worlds...</p>
            </div>
        `;

        const worlds = await loadUserWorlds();

        if (worlds.length === 0) {
            grid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-users"></i>
                    <p>No community worlds submitted yet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = worlds.map(world => createAdminWorldCard(world, true)).join('');
        
        // Add event listeners to action buttons
        setupWorldCardEvents(grid, true);

    } catch (error) {
        console.error('Error loading community worlds:', error);
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading community worlds.</p>
            </div>
        `;
    }
}

// Create admin world card
function createAdminWorldCard(world, isUserWorld) {
    const characterCount = world.characters ? world.characters.length : 0;
    const createdDate = formatDate(world.createdAt);
    
    return `
        <div class="admin-world-card" data-world-id="${world.id}" style="--world-color: ${world.colorScheme}">
            <div class="admin-world-header">
                <div>
                    <h3 class="admin-world-title">${escapeHtml(world.name || 'Untitled World')}</h3>
                    <p class="text-muted">${escapeHtml(world.currentState || 'Unknown State')}</p>
                    <p class="text-muted small">
                        Created: ${createdDate} by ${escapeHtml(world.createdBy || 'Unknown')}
                    </p>
                </div>
                <div class="admin-world-actions">
                    <button class="btn btn-outline view-world" data-world-id="${world.id}" data-is-user="${isUserWorld}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline edit-world" data-world-id="${world.id}" data-is-user="${isUserWorld}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger delete-world" data-world-id="${world.id}" data-is-user="${isUserWorld}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="admin-world-body">
                <p class="world-backstory">${escapeHtml((world.backstory || '').substring(0, 150))}${world.backstory && world.backstory.length > 150 ? '...' : ''}</p>
                
                <div class="world-stats">
                    <div class="world-stat">
                        <span class="world-stat-number">${characterCount}</span>
                        <span class="world-stat-label">Characters</span>
                    </div>
                    <div class="world-stat">
                        <span class="world-stat-number">${world.places ? world.places.length : 0}</span>
                        <span class="world-stat-label">Places</span>
                    </div>
                    <div class="world-stat">
                        <span class="world-stat-number">${world.storyIdeas ? world.storyIdeas.length : 0}</span>
                        <span class="world-stat-label">Stories</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Setup world card events
function setupWorldCardEvents(container, isUserWorld) {
    // View buttons
    container.querySelectorAll('.view-world').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const worldId = btn.dataset.worldId;
            const suffix = isUserWorld ? '&user=true' : '';
            window.open(`world-detail.html?id=${worldId}${suffix}`, '_blank');
        });
    });

    // Edit buttons
    container.querySelectorAll('.edit-world').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const worldId = btn.dataset.worldId;
            editWorld(worldId, isUserWorld);
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-world').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const worldId = btn.dataset.worldId;
            confirmDeleteWorld(worldId, isUserWorld);
        });
    });
}

// Open world modal for creation or editing
function openWorldModal(worldData = null, isEdit = false, isUserWorld = false) {
    const modal = document.getElementById('worldModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('worldForm');
    
    if (!modal || !form) return;

    // Set modal title
    title.textContent = isEdit ? 'Edit World' : 'Create New World';
    
    // Store editing state
    currentEditingWorldId = isEdit ? worldData.id : null;
    currentEditingIsUserWorld = isUserWorld;
    
    // Reset form
    form.reset();
    clearCharacters();
    clearPlaces();
    clearSoundtracks();
    
    // If editing, populate form with world data
    if (isEdit && worldData) {
        populateWorldForm(worldData);
    } else {
        // Set default color
        document.getElementById('worldColorScheme').value = '#6366f1';
        updateColorPreview();
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Populate world form with data
function populateWorldForm(world) {
    document.getElementById('worldName').value = world.name || '';
    document.getElementById('worldBackstory').value = world.backstory || '';
    document.getElementById('worldCurrentState').value = world.currentState || '';
    document.getElementById('worldColorScheme').value = world.colorScheme || '#6366f1';
    document.getElementById('worldImageUrl').value = world.imageUrl || '';
    document.getElementById('worldWikiUrl').value = world.wikiUrl || '';
    
    // Populate array fields (only text-based fields now)
    document.getElementById('worldStoryIdeas').value = world.storyIdeas ? world.storyIdeas.join(', ') : '';
    document.getElementById('worldConflicts').value = world.conflicts ? world.conflicts.join(', ') : '';
    document.getElementById('worldThemes').value = world.themes ? world.themes.join(', ') : '';
    document.getElementById('worldCultures').value = world.cultures ? world.cultures.join(', ') : '';
    
    // Populate characters
    if (world.characters && world.characters.length > 0) {
        world.characters.forEach(character => {
            addCharacterToForm(character);
        });
    }
    
    // Populate places
    if (world.places && world.places.length > 0) {
        world.places.forEach(place => {
            addPlaceToForm(place);
        });
    }
    
    // Populate soundtracks
    if (world.soundtracks && world.soundtracks.length > 0) {
        world.soundtracks.forEach(soundtrack => {
            addSoundtrackToForm(soundtrack);
        });
    }
    
    updateColorPreview();
}

// Handle world form submission
async function handleWorldSubmit(e) {
    e.preventDefault();
    
    try {
        // Collect form data
        const worldData = collectWorldFormData();
        
        if (currentEditingWorldId) {
            // Update existing world
            await updateWorld(currentEditingWorldId, worldData, currentEditingIsUserWorld);
            showNotification('World updated successfully!', 'success');
        } else {
            // Create new world
            await saveWorld(worldData, false); // Admin worlds are always saved as admin worlds
            showNotification('World created successfully!', 'success');
        }
        
        // Close modal and refresh
        closeModals();
        refreshAllWorlds();
        
    } catch (error) {
        console.error('Error saving world:', error);
        showNotification('Error saving world. Please try again.', 'error');
    }
}

// Collect world form data
function collectWorldFormData() {
    const worldData = createEmptyWorld();
    
    // Basic information
    worldData.name = document.getElementById('worldName').value.trim();
    worldData.backstory = document.getElementById('worldBackstory').value.trim();
    worldData.currentState = document.getElementById('worldCurrentState').value.trim();
    worldData.colorScheme = document.getElementById('worldColorScheme').value;
    worldData.imageUrl = document.getElementById('worldImageUrl').value.trim();
    worldData.wikiUrl = document.getElementById('worldWikiUrl').value.trim();
    
    // Convert comma-separated strings to arrays (only for remaining text fields)
    worldData.storyIdeas = stringToArray(document.getElementById('worldStoryIdeas').value);
    worldData.conflicts = stringToArray(document.getElementById('worldConflicts').value);
    worldData.themes = stringToArray(document.getElementById('worldThemes').value);
    worldData.cultures = stringToArray(document.getElementById('worldCultures').value);
    
    // Collect characters, places, and soundtracks
    worldData.characters = collectCharactersFromForm();
    worldData.places = collectPlacesFromForm();
    worldData.soundtracks = collectSoundtracksFromForm();
    
    return worldData;
}

// Convert string to array
function stringToArray(str) {
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

// Collect characters from form
function collectCharactersFromForm() {
    const characters = [];
    const characterItems = document.querySelectorAll('.character-item');
    
    characterItems.forEach(item => {
        const nameInput = item.querySelector('.character-name-input');
        const bioInput = item.querySelector('.character-bio-input');
        const atInput = item.querySelector('.character-at-input');
        const defInput = item.querySelector('.character-def-input');
        const hpInput = item.querySelector('.character-hp-input');
        
        if (nameInput && nameInput.value.trim()) {
            characters.push({
                name: nameInput.value.trim(),
                bio: bioInput ? bioInput.value.trim() : '',
                stats: {
                    AT: parseInt(atInput?.value) || 10,
                    DEF: parseInt(defInput?.value) || 10,
                    HP: parseInt(hpInput?.value) || 20
                }
            });
        }
    });
    
    return characters;
}

// Collect places from form
function collectPlacesFromForm() {
    const places = [];
    const placeItems = document.querySelectorAll('.place-item');
    
    placeItems.forEach(item => {
        const nameInput = item.querySelector('.place-name-input');
        const descriptionInput = item.querySelector('.place-description-input');
        const significanceInput = item.querySelector('.place-significance-input');
        
        if (nameInput && nameInput.value.trim()) {
            places.push({
                name: nameInput.value.trim(),
                description: descriptionInput ? descriptionInput.value.trim() : '',
                significance: significanceInput ? significanceInput.value.trim() : ''
            });
        }
    });
    
    return places;
}

// Collect soundtracks from form
function collectSoundtracksFromForm() {
    const soundtracks = [];
    const soundtrackItems = document.querySelectorAll('.soundtrack-item');
    
    soundtrackItems.forEach(item => {
        const nameInput = item.querySelector('.soundtrack-name-input');
        const descriptionInput = item.querySelector('.soundtrack-description-input');
        const urlInput = item.querySelector('.soundtrack-url-input');
        
        if (nameInput && nameInput.value.trim()) {
            soundtracks.push({
                name: nameInput.value.trim(),
                description: descriptionInput ? descriptionInput.value.trim() : '',
                url: urlInput ? urlInput.value.trim() : '',
                type: 'url'
            });
        }
    });
    
    return soundtracks;
}

// Add character to form
function addCharacterToForm(characterData = null) {
    const container = document.getElementById('charactersContainer');
    if (!container) return;
    
    const character = characterData || createEmptyCharacter();
    characterCounter++;
    
    const characterDiv = document.createElement('div');
    characterDiv.className = 'character-item';
    characterDiv.innerHTML = `
        <div class="character-header">
            <h4>Character ${characterCounter}</h4>
            <button type="button" class="remove-character-btn" onclick="removeCharacter(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="form-group">
            <label>Name *</label>
            <input type="text" class="character-name-input" value="${escapeHtml(character.name || '')}" required>
        </div>
        
        <div class="form-group">
            <label>Bio</label>
            <textarea class="character-bio-input" rows="3">${escapeHtml(character.bio || '')}</textarea>
        </div>
        
        <div class="character-stats">
            <div class="stat-input">
                <label>AT</label>
                <input type="number" class="character-at-input" value="${(character.stats && character.stats.AT) || 10}" min="1" max="99999">
            </div>
            <div class="stat-input">
                <label>DEF</label>
                <input type="number" class="character-def-input" value="${(character.stats && character.stats.DEF) || 10}" min="1" max="99999">
            </div>
            <div class="stat-input">
                <label>HP</label>
                <input type="number" class="character-hp-input" value="${(character.stats && character.stats.HP) || 20}" min="1" max="99999">
            </div>
        </div>
    `;
    
    container.appendChild(characterDiv);
}

// Add place to form
function addPlaceToForm(placeData = null) {
    const container = document.getElementById('placesContainer');
    if (!container) return;
    
    const place = placeData || createEmptyPlace();
    placeCounter++;
    
    const placeDiv = document.createElement('div');
    placeDiv.className = 'place-item';
    placeDiv.innerHTML = `
        <div class="place-header">
            <h4>Place ${placeCounter}</h4>
            <button type="button" class="remove-place-btn" onclick="removePlace(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="form-group">
            <label>Name *</label>
            <input type="text" class="place-name-input" value="${escapeHtml(place.name || '')}" required>
        </div>
        
        <div class="form-group">
            <label>Description</label>
            <textarea class="place-description-input" rows="3">${escapeHtml(place.description || '')}</textarea>
        </div>
        
        <div class="form-group">
            <label>Significance</label>
            <input type="text" class="place-significance-input" value="${escapeHtml(place.significance || '')}" placeholder="What makes this place important?">
        </div>
    `;
    
    container.appendChild(placeDiv);
}

// Add soundtrack to form
function addSoundtrackToForm(soundtrackData = null) {
    const container = document.getElementById('soundtracksContainer');
    if (!container) return;
    
    const soundtrack = soundtrackData || createEmptySoundtrack();
    soundtrackCounter++;
    
    const soundtrackDiv = document.createElement('div');
    soundtrackDiv.className = 'soundtrack-item';
    soundtrackDiv.innerHTML = `
        <div class="soundtrack-header">
            <h4>Soundtrack ${soundtrackCounter}</h4>
            <button type="button" class="remove-soundtrack-btn" onclick="removeSoundtrack(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="form-group">
            <label>Name *</label>
            <input type="text" class="soundtrack-name-input" value="${escapeHtml(soundtrack.name || '')}" required>
        </div>
        
        <div class="form-group">
            <label>Description</label>
            <textarea class="soundtrack-description-input" rows="2">${escapeHtml(soundtrack.description || '')}</textarea>
        </div>
        
        <div class="form-group">
            <label>URL</label>
            <input type="url" class="soundtrack-url-input" value="${escapeHtml(soundtrack.url || '')}" placeholder="https://youtube.com/watch?v=...">
            <small>Link to YouTube, Spotify, SoundCloud, or other music platform</small>
        </div>
    `;
    
    container.appendChild(soundtrackDiv);
}

// Remove character from form
window.removeCharacter = function(button) {
    const characterItem = button.closest('.character-item');
    if (characterItem) {
        characterItem.remove();
    }
};

// Remove place from form
window.removePlace = function(button) {
    const placeItem = button.closest('.place-item');
    if (placeItem) {
        placeItem.remove();
    }
};

// Remove soundtrack from form
window.removeSoundtrack = function(button) {
    const soundtrackItem = button.closest('.soundtrack-item');
    if (soundtrackItem) {
        soundtrackItem.remove();
    }
};

// Clear all characters
function clearCharacters() {
    const container = document.getElementById('charactersContainer');
    if (container) {
        container.innerHTML = '';
    }
    characterCounter = 0;
}

// Clear all places
function clearPlaces() {
    const container = document.getElementById('placesContainer');
    if (container) {
        container.innerHTML = '';
    }
    placeCounter = 0;
}

// Clear all soundtracks
function clearSoundtracks() {
    const container = document.getElementById('soundtracksContainer');
    if (container) {
        container.innerHTML = '';
    }
    soundtrackCounter = 0;
}

// Update color preview
function updateColorPreview() {
    const colorInput = document.getElementById('worldColorScheme');
    const preview = document.getElementById('colorPreview');
    
    if (colorInput && preview) {
        preview.style.backgroundColor = colorInput.value;
    }
}

// Edit world
async function editWorld(worldId, isUserWorld) {
    try {
        const world = await getWorld(worldId, isUserWorld);
        if (world) {
            openWorldModal(world, true, isUserWorld);
        } else {
            showNotification('World not found!', 'error');
        }
    } catch (error) {
        console.error('Error loading world for editing:', error);
        showNotification('Error loading world!', 'error');
    }
}

// Confirm delete world
function confirmDeleteWorld(worldId, isUserWorld) {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;
    
    // Store the world ID for deletion
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => handleDeleteWorld(worldId, isUserWorld);
    }
    
    modal.style.display = 'block';
}

// Handle world deletion
async function handleDeleteWorld(worldId, isUserWorld) {
    try {
        await deleteWorld(worldId, isUserWorld);
        showNotification('World deleted successfully!', 'success');
        closeModals();
        refreshAllWorlds();
    } catch (error) {
        console.error('Error deleting world:', error);
        showNotification('Error deleting world!', 'error');
    }
}

// Close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Close delete modal specifically
window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
};

// Close world modal specifically
window.closeWorldModal = function() {
    const modal = document.getElementById('worldModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
};

// Refresh all worlds
function refreshAllWorlds() {
    loadAdminWorlds();
    loadCommunityWorlds();
}

// Export data
async function exportData() {
    try {
        showNotification('Preparing export...', 'info');
        
        // Get all admin worlds
        const adminWorldsRef = ref(database, 'adminWorlds');
        const adminSnapshot = await get(adminWorldsRef);
        
        // Get all user worlds
        const userWorldsRef = ref(database, 'userWorlds');
        const userSnapshot = await get(userWorldsRef);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            adminWorlds: adminSnapshot.exists() ? adminSnapshot.val() : {},
            userWorlds: userSnapshot.exists() ? userSnapshot.val() : {}
        };
        
        // Create and download file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `worldcrafters-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data!', 'error');
    }
}

// Sort worlds
function sortWorlds(worlds, sortBy) {
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
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    setTimeout(initAdminPanel, 500);
});