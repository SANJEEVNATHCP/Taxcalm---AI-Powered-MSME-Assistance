# TaxClam v2.0

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

*   **Backend**: Python (Flask)
*   **Frontend**: HTML5, Vanilla JavaScript
*   **Styling**: Tailwind CSS
*   **Libraries**:
    *   `Chart.js` (Visualizations)
    *   `html2pdf.js` (PDF Generation)
    *   `GPU.js` (Hardware acceleration for AMD/NVIDIA/Intel GPUs)
*   **Infrastructure**: Desktop-ready, Docker-compatible
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
MSME's andvanced/
├── app/
│   ├── finance_routes.py       # Finance & Compliance logic
│   ├── zoom_routes.py          # Zoom Meeting Scheduler logic
│   └── ...
├── static/
│   ├── css/
│   │   └── style.css           # Custom styles & Dark mode
│   ├── js/
│   │   ├── features.js         # Core application logic (History, Charts, PWA)
│   │   └── calculator.js       # Basic calculation logic
│   ├── index.html              # Main Dashboard
│   ├── zoom-scheduler.html     # Meeting Scheduler Interface
│   ├── manifest.json           # PWA Manifest
│   └── service-worker.js       # Offline support
├── flask_app.py                # Main Application Entry Point
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

---

## ⚡ Quick Start

### System Requirements
**Minimum:**
- Processor: Intel Core i3 / AMD Ryzen 3 or equivalent
- RAM: 4GB
- Browser: Chrome 90+, Edge 90+, Firefox 88+
- Python: 3.8 or higher

**Recommended (for GPU acceleration):**
- Processor: Intel Core i5 / **AMD Ryzen 5** or better
- GPU: **AMD Radeon RX 6000/7000 series**, NVIDIA GTX 1650+, or Intel Iris Xe
- RAM: 8GB+
- Browser: Chrome/Edge (latest) for best WebGL support

### Prerequisites
*   Python 3.8 or higher
*   pip (Python package manager)

### Installation

1.  **Clone or Download** the repository.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the Server**:
    ```bash
    python flask_app.py
    ```
2.  **Open in Browser**:
    Navigate to `http://localhost:8000`

---

## 📱 Installing as an App (PWA)

1.  Open `http://localhost:8000` in Chrome/Edge on your desktop or mobile.
2.  Look for the **"Install"** icon in the address bar (Desktop) or select **"Add to Home Screen"** from the browser menu (Mobile).
3.   The app will install and can now be launched directly from your home screen, even without an internet connection!

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and free to use for personal and educational purposes.

---

**Built with ❤️ for Indian MSMEs.**
