# הקלות והטבות בעקבות מבצע עם כלביא

## AM-Kelavi Benefits Platform - Node.js Full-Stack

A comprehensive Node.js/Express full-stack platform for discovering and accessing benefits, assistance programs, and services available to the Israeli community during wartime and beyond.

## 🌟 Features

- **Real-time Data**: Connected to live Google Sheets for up-to-date information
- **Smart Search**: AI-powered search with Hebrew keyword recognition
- **Category Filtering**: Organized by relevant categories for easy navigation
- **Mobile Responsive**: Optimized for all devices with RTL Hebrew support
- **Single Server**: One Express.js application serving both API and frontend
- **Easy Deployment**: Simple Vercel deployment with Node.js

## 🏗️ Project Structure

```
am-kelavi-benefits/
├── server.js              # Main Express server
├── package.json           # Node.js dependencies and scripts
├── public/                # Static files served by Express
│   ├── index.html         # Complete React application (CDN-based)
│   └── favicon.ico        # Icon
├── routes/                # API route handlers
│   ├── benefits.js        # Google Sheets integration
│   ├── categories.js      # Category filtering
│   └── ai.js             # AI-powered suggestions
├── utils/                 # Helper utilities
│   └── sheets.js         # Google Sheets CSV processing
├── vercel.json           # Simple Vercel deployment config
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (>=18.0.0)
- npm (>=9.0.0)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/assafakiva/am-kelavi-benefits.git
   cd am-kelavi-benefits
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   npm start
   ```

4. **Access the application**
   - Frontend & API: http://localhost:5000

## 📱 Mobile Responsiveness

The application maintains consistent mobile layout with:

- **Responsive Grid**: Category buttons adapt from 2 columns (mobile) to 6 columns (desktop)
- **Touch-Optimized**: Large touch targets for mobile interaction
- **RTL Support**: Proper right-to-left layout for Hebrew content
- **Clean Design**: Minimal borders and calm color palette

## 🛠️ Technology Stack

### Backend
- **Express.js** - Fast, unopinionated web framework
- **Node.js** - JavaScript runtime
- **Axios** - HTTP client for Google Sheets integration
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - Modern React via CDN (no build process)
- **Tailwind CSS** - Utility-first CSS framework via CDN
- **Vanilla JavaScript** - Clean, simple implementation

### Deployment
- **Vercel** - Serverless deployment platform
- **Google Sheets** - Live data source

## 📊 API Endpoints

### Benefits
- `GET /api/benefits` - Get all benefits
- `GET /api/benefits/enhanced` - Get benefits with enhanced display data
- `GET /api/benefits/search` - Search benefits with filters
- `GET /api/benefits/{id}` - Get specific benefit details

### Categories
- `GET /api/categories` - Get all categories with counts

### AI
- `POST /api/ai/suggest` - Get AI-powered suggestions

### Health
- `GET /api/health` - API health check

## 🎨 Design System

### Colors
- **Calm Blue**: `#3B82F6` - Primary actions and highlights
- **Calm Green**: `#10B981` - Success states and secondary actions
- **Calm Purple**: `#8B5CF6` - Accent elements
- **Calm Orange**: `#F59E0B` - Warnings and notifications
- **Calm Red**: `#EF4444` - Errors and alerts
- **Calm Gray**: `#6B7280` - Text and borders

### Typography
- **Primary Font**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- **Direction**: RTL (Right-to-left) for Hebrew content

## 🌐 Deployment

### Vercel Deployment

The application is configured for simple Vercel deployment:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Automatic Deployment**: Vercel automatically detects Node.js and deploys
3. **Simple Configuration**: Uses the minimal `vercel.json` setup

### Environment Variables

No environment variables are required for basic functionality as the application uses public Google Sheets data.

## 🚀 Benefits of Node.js Full-Stack Approach

- ✅ **One Language**: JavaScript for both frontend and backend
- ✅ **One Server**: Express serves both API and static files
- ✅ **Simple Development**: `npm start` runs everything
- ✅ **Easy Deployment**: Single Vercel build process
- ✅ **No Build Complexity**: CDN-based React, no webpack/vite
- ✅ **Maintained Features**: All existing functionality preserved

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test thoroughly
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Standards

- **ESLint**: Code linting for JavaScript
- **Prettier**: Code formatting
- **Commits**: Conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Credits

### Data Source
**מוֹרָן תְּסַדֵּר** - Data curator and content maintainer
- 📱 [Telegram](https://t.me/haravotbe)
- 📘 [Facebook](https://www.facebook.com/moranfixit/)
- 💬 [WhatsApp](https://wa.me/972524244298)

### Development
**אסף עקיבא (Assaf Akiva)** - Full-stack development
- 💼 [LinkedIn](https://www.linkedin.com/in/assafakiva)

## 🆘 Support

For technical issues, please open an issue on GitHub.
For content updates, contact מוֹרָן תְּסַדֵּר through the links above.

---

🤝 **פרויקט קהילתי למען הציבור - מידע מעודכן ונגיש לכל אזרח**

*A community project for the public - updated and accessible information for every citizen*

## 🔄 Migration Notes

This project was migrated from a complex Python/React separation to a clean Node.js full-stack application for:
- Easier development and maintenance
- Simplified deployment to Vercel
- Better performance and reliability
- Single-language development workflow