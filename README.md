# 🚀 Prompt Manager

An elegant, browser-native dashboard designed to store, organize, and copy your most frequent prompts and multimodal image attachments.

**🌐 Live Site:** [https://onkarpawar1.github.io/prompt-manager/](https://onkarpawar1.github.io/prompt-manager/)

---

## ✨ Key Features

- 📁 **Group & Organize**: Categorize prompts into distinct groups (e.g., Coding, Writing, Marketing) to locate them instantly.
- 📋 **One-Click Copy**: Copy prompt text to your clipboard instantly with visual success feedback.
- 🖼️ **Multimodal Support**: Attach images to your prompts by uploading files or **pasting images directly** from your clipboard.
- 🗜️ **Automatic Image Compression**: Compresses attached images before storing them to prevent browser quota limit issues.
- 💾 **Local Persistence**: Automatically saves your prompts to local browser storage so your dashboard is populated next time you visit.
- 📤 **Backup & Sync**: Export your prompts collection to a standard JSON backup file, and import backups to restore them on any machine.
- 📱 **Premium Responsive Design**: Fully responsive, clean card layouts with micro-animations and smooth transitions.

---

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting**: [GitHub Pages](https://pages.github.com/) with automated deployments via [GitHub Actions](https://github.com/features/actions)

---

## 💻 Local Setup & Development

To run this project on your machine, follow these steps:

### Prerequisites

Make sure you have Node.js and npm installed:
- Node.js: `v20+` or `v24+` (recommended)
- npm: `v10+`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/OnkarPawar1/prompt-manager.git
   cd prompt-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   *The app will be accessible at: `http://localhost:5173/`*

4. **Build the production bundle**:
   ```bash
   npm run build
   ```
   *This compiles TypeScript and builds static files to the `./dist` folder.*

---

## 🚀 CI/CD & Deployments

This project is configured with a GitHub Actions workflow that automatically builds the application and deploys it to GitHub Pages whenever changes are pushed to the `main` branch.

- **Workflow Configuration**: Located in [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- **Deployment Branch**: Static assets are pushed to `gh-pages` branch.
