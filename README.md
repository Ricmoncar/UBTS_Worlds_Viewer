# TRAVELERS 🌍

A comprehensive world-building web application for the UBTS universe where users can create, manage, and explore rich fictional worlds complete with characters, stories, places, and detailed lore.

## 🚀 Features

### For Everyone
- **Explore Worlds**: Browse through official UBTS worlds with rich backstories and characters
- **World Details**: View detailed information including images, wiki links, and characters with Undertale-style stats (AT, DEF, HP)
- **Responsive Design**: Beautiful, dark-themed interface that works on all devices
- **Real-time Data**: All content stored and retrieved from Firebase Realtime Database

### For Registered Users
- **Create Worlds**: Multi-step world creation form with intuitive interface
- **Character Builder**: Add characters with stats, bios, and detailed information
- **Fanon Sharing**: Submit worlds to the fanon gallery
- **Account Management**: Secure email/password authentication

### For Admins
- **Full CRUD Operations**: Create, read, update, and delete worlds
- **Admin Panel**: Dedicated interface for managing all content
- **User Management**: View and manage fanon-submitted worlds
- **Data Export**: Export all world data for backup purposes
- **Advanced Editing**: Rich form interface for detailed world editing

## 🎮 World Elements

Each world can contain:
- **Basic Info**: Name, backstory, current state, custom color scheme, image, wiki link
- **Characters**: With AT/DEF/HP stats (Undertale-inspired) and detailed bios
- **Places**: Important locations and points of interest
- **Story Ideas**: Plot concepts and narrative elements
- **Conflicts**: Tensions and challenges within the world
- **Soundtracks**: Music and audio themes
- **Themes**: Central concepts and ideas
- **Cultures**: Societies and civilizations

## 🔧 Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Email/Password)
- **Styling**: Custom CSS with CSS Variables for theming
- **Icons**: Font Awesome 6
- **No Build Process**: Runs directly in the browser

## 📁 File Structure

```
TRAVELERS/
├── index.html              # Main page showing official worlds
├── admin.html              # Admin panel for CRUD operations
├── create-world.html       # Multi-step world creation form
├── world-detail.html       # Detailed world view
├── submitted-worlds.html   # Fanon worlds gallery
├── travelers.html          # Links to UBTS character viewer
├── talent-tree.html        # Links to UBTS talent tree
├── style.css              # Main stylesheet with dark theme
├── firebase-config.js     # Firebase configuration
├── auth.js               # Authentication management
├── worlds.js             # World data operations
├── admin.js              # Admin panel functionality
├── create-world.js       # World creation form logic
├── world-detail.js       # World detail page logic
├── submitted-worlds.js   # Fanon worlds logic
└── README.md             # This file
```

## 🚀 Setup Instructions

### 1. Firebase Setup
The application is already configured with Firebase, but if you need to set up your own:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database and Authentication
3. Update the configuration in `firebase-config.js`

### 2. Database Structure
The app uses this Firebase Realtime Database structure:
```
{
  "adminWorlds": {
    "worldId1": { /* world data */ },
    "worldId2": { /* world data */ }
  },
  "userWorlds": {
    "worldId1": { /* world data */ },
    "worldId2": { /* world data */ }
  }
}
```

### 3. Running the Application
1. Download all files to a local directory
2. Serve the files using any web server (Python's `http.server`, Live Server extension, etc.)
3. Open `index.html` in your browser

## 👨‍💼 Admin Account

The admin account has full access to:
- Create/edit/delete any world
- Access the admin panel
- Manage fanon submissions
- Export data

## 🌐 Pages Overview

### Home Page (`index.html`)
- Displays official UBTS worlds
- Hero section with statistics
- Grid layout with world cards
- Filter and sort options

### Admin Panel (`admin.html`)
- Full CRUD interface for worlds
- Character management with stats
- Image and wiki URL support
- Bulk operations and data export
- Fanon world moderation

### Create World (`create-world.html`)
- 4-step creation process
- Progressive form validation
- Character builder with stats
- Image and wiki URL fields
- Preview before submission

### World Detail (`world-detail.html`)
- Comprehensive world information
- Image display and wiki links
- Character showcase with stats
- Admin edit/delete controls
- Responsive design

### Fanon Worlds (`submitted-worlds.html`)
- User-created worlds gallery
- Filter by creator
- Fanon statistics
- Creation prompts

### Character Viewer (`travelers.html`)
- Links to UBTS Character Viewer
- External application integration

### Talent Tree (`talent-tree.html`)
- Links to UBTS Talent Tree
- Build planning tools

## 🎯 UBTS Integration

TRAVELERS is designed specifically for the UBTS (Undertale: Back to Square One) roleplay universe:
- **Character Viewer**: https://ricmoncar.github.io/ubts-characters-viewer/
- **Talent Tree**: https://ricmoncar.github.io/UBTS_TALENT_TREE/
- **Fanon Support**: Community-driven world creation
- **Official Content**: Admin-curated canonical worlds

## 📱 Mobile Responsive

The application is fully responsive with:
- Mobile-first CSS approach
- Touch-friendly interactions
- Optimized layouts for all screen sizes
- Hamburger navigation on mobile
- Flexible grid systems

## 🚀 Performance

- Efficient Firebase queries
- Lazy loading of world data
- Optimized CSS with modern properties
- Minimal JavaScript bundle size
- Progressive image loading

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Font Awesome for icons
- Undertale for character stat inspiration
- UBTS community for the roleplay universe

---

**Built for UBTS travelers, by UBTS travelers.**
