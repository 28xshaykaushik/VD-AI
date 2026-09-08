# VyoomDut AI — Intelligent Atmospheric Decision Engine

> **"Don't Just Know the Weather. Know What to Do."**

VyoomDut AI is a full-stack atmospheric decision suite and conversational weather intelligence platform built with React, Vite, Tailwind CSS, Express, and Google Gemini AI.

---

## 🌟 Key Capabilities

1. **Intelligent Mission Decision Suite**:
   - Live ground truth analysis translating weather data into actionable lifestyle, commuting, and gear decisions.
   - Dynamic Feasibility Indices for daily work commutes, cycling, flights, outdoor events, and construction.

2. **Conversational Weather AI (VyoomDut Chatbot)**:
   - Multilingual conversational assistant powered by Google Gemini.
   - Communicates in English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Kannada, Malayalam, and Hinglish.

3. **Event & Wedding Weather Risk Simulator**:
   - 14-day horizon atmospheric simulation for weddings, outdoor sports, terrace galas, and poolside banquets.
   - 5-dimensional risk matrix: Rain ingress, wind gust shear, guest attire thermal comfort, condensation/dew slip risk, and optical haze/AQI.
   - Staging gear checklists, Plan B contractual shift triggers, and smart weekend date finder.

4. **Show Me Your Bag AI (Multimodal Packing Inspector)**:
   - Computer vision packing inspector analyzing user gear against live destination weather conditions.

5. **Disaster Radar & Emergency SOS Beacon**:
   - Real-time disaster alerts (cyclones, flash floods, heatwaves) with one-click GPS coordinate SOS beacons.

6. **Daily Audio Bulletins**:
   - Multilingual text-to-speech audio broadcasts for morning briefings.

7. **Citizen Weather Pulse**:
   - Crowdsourced real-time localized ground reports for microclimate updates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vyoomdut-ai.git

# Navigate to project directory
cd vyoomdut-ai

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### Running Locally
```bash
# Start development server
npm run dev
```
The server will boot on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 🌐 Deploying to Render (as a Web Service)

This application is a **full-stack app** with an Express backend that handles weather proxies and AI integrations.

1. Create a new service on [Render Dashboard](https://dashboard.render.com).
2. Select **Web Service** (do **NOT** select "Static Site").
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**. Render will dynamically assign `PORT` (e.g. 10000), which `server.ts` will automatically listen on.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti
- **Backend**: Node.js, Express, tsx, esbuild
- **AI & Vision**: `@google/genai` (Gemini Flash)
- **Data & APIs**: Open-Meteo API, Geocoding API
