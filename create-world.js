// Create World JavaScript
import { currentUser, showNotification } from './auth.js';
import { saveWorld, createEmptyWorld, createEmptyCharacter } from './worlds.js';

// Global variables
let currentStep = 1;
let totalSteps = 4;
let characterCounter = 0;
let worldData = createEmptyWorld();

// Initialize create world page
function initCreateWorld() {
    setupEventListeners();
    updateAuthState();
    updateProgress();
}

// Setup event listeners
function setupEventListeners() {
    // Character management
    document.getElementById('addCharacterBtn')?.addEventListener('click', addCharacter);
    
    // Color scheme preview
    document.getElementById('worldColorScheme')?.addEventListener('input', updateColorPreview);
    
    // Form submission
    document.getElementById('createWorldForm')?.addEventListener('submit', handleFormSubmit);
    
    // Login required buttons
    document.getElementById('loginRequiredBtn')?.addEventListener('click', () => {
        document.getElementById('loginBtn')?.click();
    });
    
    document.getElementById('signupRequiredBtn')?.addEventListener('click', () => {
        document.getElementById('signupBtn')?.click();
    });
    
    document.getElementById('continueAnonymousBtn')?.addEventListener('click', () => {
        const loginRequired = document.getElementById('loginRequired');
        const createForm = document.getElementById('createWorldForm');
        if (loginRequired) loginRequired.style.display = 'none';
        if (createForm) createForm.style.display = 'block';
    });
    
    // Input validation
    setupInputValidation();
}

// Setup input validation
function setupInputValidation() {
    const worldNameInput = document.getElementById('worldName');
    if (worldNameInput) {
        worldNameInput.addEventListener('input', validateStep1);
    }
}

// Update authentication state
function updateAuthState() {
    const loginRequired = document.getElementById('loginRequired');
    const createForm = document.getElementById('createWorldForm');
    
    // Always show the form - creation is open to everyone
    if (loginRequired) loginRequired.style.display = 'none';
    if (createForm) createForm.style.display = 'block';
}

// Navigation functions
window.nextStep = function() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStepDisplay();
            updateProgress();
            
            // Generate preview on final step
            if (currentStep === totalSteps) {
                generatePreview();
            }
        }
    }
};

window.prevStep = function() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        updateProgress();
    }
};

// Update step display
function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // Update progress steps
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentStep);
    });
}

// Update progress bar
function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const percentage = (currentStep / totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

// Validate current step
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        case 4:
            return true; // Review step
        default:
            return true;
    }
}

// Validate step 1
function validateStep1() {
    const worldName = document.getElementById('worldName')?.value.trim();
    
    if (!worldName) {
        showNotification('Please enter a world name.', 'error');
        document.getElementById('worldName')?.focus();
        return false;
    }
    
    if (worldName.length < 3) {
        showNotification('World name must be at least 3 characters long.', 'error');
        document.getElementById('worldName')?.focus();
        return false;
    }
    
    return true;
}

// Validate step 2
function validateStep2() {
    // Characters are optional, so always valid
    return true;
}

// Validate step 3
function validateStep3() {
    // All fields in step 3 are optional
    return true;
}

// Add character
function addCharacter(characterData = null) {
    const container = document.getElementById('charactersContainer');
    if (!container) return;
    
    const character = characterData || createEmptyCharacter();
    characterCounter++;
    
    const characterDiv = document.createElement('div');
    characterDiv.className = 'character-item fade-in';
    characterDiv.innerHTML = `
        <div class="character-header">
            <span class="character-number">Character ${characterCounter}</span>
            <button type="button" class="remove-character" onclick="removeCharacter(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="form-group">
            <label>Character Name *</label>
            <input type="text" class="character-name-input" value="${escapeHtml(character.name)}" placeholder="Enter character name" required>
        </div>
        
        <div class="form-group">
            <label>Character Bio</label>
            <textarea class="character-bio-input" rows="3" placeholder="Describe your character's background, personality, and role in the world">${escapeHtml(character.bio)}</textarea>
        </div>
        
        <div class="character-stats">
            <div class="stat-input">
                <label>AT (Attack)</label>
                <input type="number" class="character-at-input" value="${character.stats.AT}" min="1" max="999">
            </div>
            <div class="stat-input">
                <label>DEF (Defense)</label>
                <input type="number" class="character-def-input" value="${character.stats.DEF}" min="1" max="999">
            </div>
            <div class="stat-input">
                <label>HP (Health)</label>
                <input type="number" class="character-hp-input" value="${character.stats.HP}" min="1" max="999">
            </div>
        </div>
    `;
    
    container.appendChild(characterDiv);
    
    // Focus on the name input for new characters
    if (!characterData) {
        const nameInput = characterDiv.querySelector('.character-name-input');
        if (nameInput) {
            nameInput.focus();
        }
    }
}

// Remove character
window.removeCharacter = function(button) {
    const characterItem = button.closest('.character-item');
    if (characterItem) {
        characterItem.style.transform = 'translateX(-100%)';
        characterItem.style.opacity = '0';
        setTimeout(() => {
            characterItem.remove();
        }, 300);
    }
};

// Update color preview
function updateColorPreview() {
    const colorInput = document.getElementById('worldColorScheme');
    const preview = document.getElementById('colorPreview');
    
    if (colorInput && preview) {
        preview.style.backgroundColor = colorInput.value;
    }
}

// Generate preview for step 4
function generatePreview() {
    const previewContainer = document.getElementById('worldPreview');
    if (!previewContainer) return;
    
    // Collect current form data
    const formData = collectFormData();
    
    const previewHTML = `
        <div class="preview-section">
            <h3><i class="fas fa-globe"></i> ${escapeHtml(formData.name) || 'Untitled World'}</h3>
            <div class="preview-content">
                <strong>Current State:</strong> ${escapeHtml(formData.currentState) || 'Not specified'}
            </div>
        </div>
        
        <div class="preview-section">
            <h3><i class="fas fa-book"></i> Backstory</h3>
            <div class="preview-content">
                ${escapeHtml(formData.backstory) || 'No backstory provided.'}
            </div>
        </div>
        
        ${formData.characters.length > 0 ? `
        <div class="preview-section">
            <h3><i class="fas fa-users"></i> Characters (${formData.characters.length})</h3>
            <div class="preview-content">
                ${formData.characters.map(char => `
                    <div class="preview-character">
                        <div class="preview-character-name">${escapeHtml(char.name)}</div>
                        <div class="preview-content">${escapeHtml(char.bio) || 'No bio provided.'}</div>
                        <div class="preview-character-stats">
                            <div class="preview-stat">
                                <span class="preview-stat-value">${char.stats.AT}</span>
                                <span class="preview-stat-label">AT</span>
                            </div>
                            <div class="preview-stat">
                                <span class="preview-stat-value">${char.stats.DEF}</span>
                                <span class="preview-stat-label">DEF</span>
                            </div>
                            <div class="preview-stat">
                                <span class="preview-stat-value">${char.stats.HP}</span>
                                <span class="preview-stat-label">HP</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${formData.places.length > 0 ? `
        <div class="preview-section">
            <h3><i class="fas fa-map-marked-alt"></i> Places</h3>
            <div class="preview-tags">
                ${formData.places.map(place => `<span class="preview-tag">${escapeHtml(place)}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${formData.themes.length > 0 ? `
        <div class="preview-section">
            <h3><i class="fas fa-heart"></i> Themes</h3>
            <div class="preview-tags">
                ${formData.themes.map(theme => `<span class="preview-tag">${escapeHtml(theme)}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${formData.storyIdeas.length > 0 ? `
        <div class="preview-section">
            <h3><i class="fas fa-lightbulb"></i> Story Ideas</h3>
            <div class="preview-content">
                ${formData.storyIdeas.map(idea => `<div class="content-item">${escapeHtml(idea)}</div>`).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="preview-section">
            <h3><i class="fas fa-palette"></i> Color Scheme</h3>
            <div class="preview-content">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 30px; height: 30px; background: ${formData.colorScheme}; border-radius: 50%; border: 2px solid var(--border-color);"></div>
                    <span>${formData.colorScheme}</span>
                </div>
            </div>
        </div>
    `;
    
    previewContainer.innerHTML = previewHTML;
}

// Collect form data
function collectFormData() {
    return {
        name: document.getElementById('worldName')?.value.trim() || '',
        backstory: document.getElementById('worldBackstory')?.value.trim() || '',
        currentState: document.getElementById('worldCurrentState')?.value.trim() || '',
        colorScheme: document.getElementById('worldColorScheme')?.value || '#6366f1',
        imageUrl: document.getElementById('worldImageUrl')?.value.trim() || '',
        wikiUrl: document.getElementById('worldWikiUrl')?.value.trim() || '',
        places: stringToArray(document.getElementById('worldPlaces')?.value || ''),
        soundtracks: stringToArray(document.getElementById('worldSoundtracks')?.value || ''),
        storyIdeas: stringToArray(document.getElementById('worldStoryIdeas')?.value || ''),
        conflicts: stringToArray(document.getElementById('worldConflicts')?.value || ''),
        themes: stringToArray(document.getElementById('worldThemes')?.value || ''),
        cultures: stringToArray(document.getElementById('worldCultures')?.value || ''),
        characters: collectCharacters()
    };
}

// Collect characters from form
function collectCharacters() {
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

// Convert string to array
function stringToArray(str) {
    return str.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (currentStep !== totalSteps) {
        // If not on final step, just proceed to next step
        nextStep();
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating World...';
        submitBtn.disabled = true;
        
        // Collect final data
        const finalWorldData = collectFormData();
        
        // Add metadata
        finalWorldData.createdAt = Date.now();
        finalWorldData.updatedAt = Date.now();
        finalWorldData.createdBy = currentUser?.email || 'Anonymous';
        
        // Save to user worlds (fanon submissions)
        await saveWorld(finalWorldData, true);
        
        showNotification('World created successfully! 🎉', 'success');
        
        // Redirect to fanon worlds page after short delay
        setTimeout(() => {
            window.location.href = 'submitted-worlds.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error creating world:', error);
        showNotification('Error creating world. Please try again.', 'error');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-magic"></i> Create World';
        submitBtn.disabled = false;
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
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

// Auth state change handler
function handleAuthStateChange() {
    updateAuthState();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCreateWorld);

// Listen for auth state changes
export { handleAuthStateChange };