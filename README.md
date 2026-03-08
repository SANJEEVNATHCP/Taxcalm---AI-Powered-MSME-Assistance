# TaxCalm 

**Your comprehensive, privacy-first companion for MSME GST management.**

The **TaxClam** is a web-based application designed to help Micro, Small, and Medium Enterprises (MSMEs) in India manage their Goods and Services Tax (GST) obligations without the stress. It combines a powerful calculator with compliance tools, financial insights, and expert-level resources—all without requiring a login or storing sensitive data on a server.

---

## 🚀 Key Features

### 📊 Core Calculation & Insights
*   **Simple GST Calculator**: Instantly calculate Output, Input, and Net GST.
*   **Visual Expense Breakdown**: Dynamic doughnut charts showing Cost, Profit, and Tax distribution.
*   **Scenario Comparison**: Compare multiple calculation scenarios (e.g., "What if sales increase by 10%?") side-by-side.
*   **Calculation History**: Automatically saves your last 50 calculations locally for quick reference.

### 🛡️ Compliance & Safety
*   **Compliance Checklist**: Track your registration, invoicing, and filing status with a persistent checklist.
*   **Filing Deadlines**: Stay updated with dynamic deadlines for GSTR-1, GSTR-3B, and Annual Returns.
*   **Privacy-First**: No database, no login. ALL financial data is stored securely in your browser's LocalStorage.

### 📱 Usability & Productivity
*   **Dark Mode**: Toggle between Light and Dark themes for comfortable working at any time.
*   **PDF Export**: clear, professional PDF reports of your calculations for your records or CA.
*   **Business Templates**: One-click presets for Retail, E-commerce, Service, and Manufacturing sectors.
*   **PWA (Offline Support)**: Install as an app on your phone or desktop and use it completely offline.

### 🤝 Advanced Integrations
*   **Zoom Scheduler**: Integrated module to schedule compliance meetings or consultations.
*   **Finance Module**: Extended financial calculation capabilities.

---

## 🛠️ Tech Stack

**Current (Frontend-First):**
*   **Frontend**: React 18 + Vite
*   **Build Tool**: Vite (Lightning-fast bundler)
*   **Styling**: Tailwind CSS
*   **UI Components**: Custom React components
*   **State Management**: React Context API

**Legacy (Archived):**
*   **Backend**: Python (Flask) - *in `legacy_backend/` folder*
*   **Hardware Acceleration**: AMD Radeon, NVIDIA GeForce, Intel integrated graphics support

---

## 🎮 AMD GPU Acceleration

TaxCalm now includes **GPU.js** for hardware-accelerated calculations that work seamlessly with:
- **AMD Radeon** Graphics Cards (RX 6000/7000 series, Vega, etc.)
- **AMD Ryzen** Processors with integrated Radeon Graphics
- NVIDIA GeForce GPUs
- Intel integrated graphics

### Benefits:
- ⚡ **10-100x faster** batch GST calculations
- 🚀 Parallel processing for scenario comparisons
- 💰 Energy-efficient computations
- 📊 Accelerated chart rendering

### Try it:
Visit `/static/gpu-demo.html` to test GPU acceleration and see your hardware specs!

---

## 📂 Project Structure

```
taxcalm-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── IntroAnimation.jsx
│   │   ├── BulkDataImporter.jsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── FinancePage.jsx
│   │   ├── TrendsPage.jsx
│   │   ├── GSTCalculator.jsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── ThemeContext.jsx
│   │   └── ToastContext.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css           # Global styles
├── public/
│   └── audio/              # Media assets
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
└── package.json            # Dependencies

legacy_backend/             # Archived backend code
├── app/                    # Flask application
├── blender_addon/          # Blender integration (legacy)
├── static_old/             # Old static files
├── rag_data/               # RAG system data
├── flask_app.py
├── unified_server.py
├── requirements.txt
└── ...

.gitignore
README.md                   # This file
```

---

⚡ Quick Start

### System Requirements
**Minimum:**
- Node.js: 16 or higher
- npm or yarn package manager
- Browser: Chrome 90+, Edge 90+, Firefox 88+

### Prerequisites
*   Node.js 16+ with npm/yarn

### Installation & Running

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/SANJEEVNATHCP/Taxcalm---AI-Powered-MSME-Assistance.git
    cd Taxcalm---AI-Powered-MSME-Assistance
    ```

2.  **Navigate to the dashboard folder**:
    ```bash
    cd taxcalm-dashboard
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  **Open in Browser**:
    Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Running Legacy Backend (Optional)

If you need to run the legacy Flask backend for API integration:

1.  **Navigate to legacy backend**:
    ```bash
    cd legacy_backend
    ```

2.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the Flask server**:
    ```bash
    python flask_app.py
    ```

## 📦 Building & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview  # Preview the production build locally
```

### Environment Setup
Create a `.env` file in `taxcalm-dashboard/` if you need to configure any environment variables:
```
VITE_API_URL=http://localhost:8000  # For legacy backend integration
```

---

## 🗂️ Legacy Backend

The original Flask backend and related integrations (Blender addon, RAG system, etc.) have been archived in the `legacy_backend/` folder for reference and potential future use.

**Legacy components:**
- Flask REST API
- Zoom scheduler integration  
- Finance calculations engine
- Blender addon for 3D visualizations
- RAG (Retrieval-Augmented Generation) system
- Database configurations

To use legacy code, refer to `legacy_backend/README` (if available) or documentation in that folder.

---

## 🎮 Performance & GPU Acceleration

The current Vite-based frontend is optimized for performance:
- ⚡ **Lightning-fast builds** with Vite
- 🚀 **React optimization** with lazy loading
- 📊 **Smooth animations** with CSS & JS transitions
- 💻 **Browser-native hardware acceleration** via WebGL

For extreme computational workload requirements, GPU.js integration is available in the legacy backend.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and free to use for personal and educational purposes.

---

**Built with ❤️ for Indian MSMEs.**
