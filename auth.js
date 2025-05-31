// Authentication Module
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Admin email
const ADMIN_EMAIL = 'ricardomontescarrasco1@gmail.com';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminBtn = document.getElementById('adminBtn');
const userSection = document.getElementById('userSection');
const userEmail = document.getElementById('userEmail');

// Mobile elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const mobileSignupBtn = document.getElementById('mobileSignupBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const mobileAdminBtn = document.getElementById('mobileAdminBtn');
const mobileUserSection = document.getElementById('mobileUserSection');
const mobileUserEmail = document.getElementById('mobileUserEmail');
const mobileAuthButtons = document.getElementById('mobileAuthButtons');

const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Current user state
export let currentUser = null;
export let isAdmin = false;

// Initialize authentication
export function initAuth() {
    // Auth state observer
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        isAdmin = user && user.email === ADMIN_EMAIL;
        updateUI();
    });
    
    // Auto-create admin account if it doesn't exist
    createAdminIfNeeded();

    // Desktop event listeners
    if (loginBtn) loginBtn.addEventListener('click', () => showModal('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => showModal('signup'));
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (adminBtn) adminBtn.addEventListener('click', () => window.location.href = 'admin.html');

    // Mobile event listeners
    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => {
        closeMobileMenu();
        showModal('login');
    });
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => {
        closeMobileMenu();
        showModal('signup');
    });
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', () => {
        closeMobileMenu();
        handleLogout();
    });
    if (mobileAdminBtn) mobileAdminBtn.addEventListener('click', () => {
        closeMobileMenu();
        window.location.href = 'admin.html';
    });

    // Form submissions
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

// Show modal
function showModal(type) {
    closeModals();
    const modal = type === 'login' ? loginModal : signupModal;
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Close modals
function closeModals() {
    if (loginModal) loginModal.style.display = 'none';
    if (signupModal) signupModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeModals();
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        closeModals();
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        showNotification('Logged out successfully!', 'success');
        // Redirect to home if on admin page
        if (window.location.pathname.includes('admin')) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out!', 'error');
    }
}

// Update UI based on auth state
function updateUI() {
    // Desktop UI
    if (currentUser) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userSection) userSection.style.display = 'flex';
        if (userEmail) {
            userEmail.textContent = currentUser.email;
            userEmail.title = currentUser.email; // Add tooltip for full email
        }
        
        // Show admin button if user is admin
        if (adminBtn) {
            adminBtn.style.display = isAdmin ? 'block' : 'none';
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (signupBtn) signupBtn.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }

    // Mobile UI - sync with desktop state
    if (currentUser) {
        // User is logged in
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'none';
        if (mobileUserSection) mobileUserSection.style.display = 'flex';
        if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email;
        
        // Show admin button if user is admin
        if (mobileAdminBtn) {
            mobileAdminBtn.style.display = isAdmin ? 'block' : 'none';
        }
    } else {
        // User is not logged in
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'flex';
        if (mobileUserSection) mobileUserSection.style.display = 'none';
        if (mobileAdminBtn) mobileAdminBtn.style.display = 'none';
    }
}

// Mobile menu functions
function toggleMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
        
        // Toggle hamburger/close icon
        const icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            if (mobileMenu.classList.contains('active')) {
                icon.className = 'fas fa-times';
                document.body.style.overflow = 'hidden';
            } else {
                icon.className = 'fas fa-bars';
                document.body.style.overflow = 'auto';
            }
        }
    }
}

function closeMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
        const icon = mobileMenuToggle?.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }
        document.body.style.overflow = 'auto';
    }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// Show notification
export function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to document
    document.body.appendChild(notification);

    // Slide in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;

    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Auto-create admin account if needed
async function createAdminIfNeeded() {
    // Only run once per session
    if (sessionStorage.getItem('adminCheckDone')) return;
    sessionStorage.setItem('adminCheckDone', 'true');
    
    try {
        // Try to sign in with admin credentials
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, 'RUSTGPT');
        await signOut(auth); // Sign out immediately
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                // Create admin account
                await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, 'RUSTGPT');
                await signOut(auth); // Sign out after creation
                console.log('Admin account created successfully');
            } catch (createError) {
                console.log('Admin account creation skipped:', createError.message);
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);