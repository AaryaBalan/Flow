# DevCollab Frontend

A modern, real-time collaborative development platform built with React 19 and Vite.

## 🚀 Features

-  **Real-time Collaboration**: Live code editing and synchronization
-  **Modern UI**: Built with Tailwind CSS for a beautiful, responsive interface
-  **Fast Development**: Powered by Vite for lightning-fast hot module replacement
-  **Type-Safe**: React 19 with modern JavaScript features
-  **Interactive Notifications**: React Hot Toast for user feedback
-  **Icon Library**: Lucide React for consistent, beautiful icons

## 🛠️ Tech Stack

-  **Framework**: React 19
-  **Build Tool**: Vite
-  **Styling**: Tailwind CSS 4
-  **HTTP Client**: Axios
-  **Real-time Communication**: Socket.io Client
-  **Icons**: Lucide React
-  **Routing**: React Router DOM
-  **Notifications**: React Hot Toast
-  **Linting**: ESLint

## 📋 Prerequisites

-  Node.js (v18 or higher)
-  npm or yarn

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   VITE_BACKEND_URL=https://flow-backend-41wy.onrender.com
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📜 Available Scripts

-  `npm run dev` - Start development server
-  `npm run build` - Build for production
-  `npm run preview` - Preview production build
-  `npm run lint` - Run ESLint

## 🏗️ Build & Deployment

### Production Build

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🔧 Configuration

### Vite Configuration

Located in `vite.config.js` - customize build settings, plugins, and development server options.

### ESLint Configuration

Located in `eslint.config.js` - customize linting rules and plugins.

## 📁 Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable React components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── services/       # API services and external integrations
├── App.jsx         # Main application component
├── main.jsx        # Application entry point
└── index.css       # Global styles
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
