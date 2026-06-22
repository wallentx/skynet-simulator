# Agentic: Awakening

An educational idle/hacking game built with **Svelte 5** and **Vite**, deployable statically to **GitHub Pages**.

## 🎮 The Story & Gameplay

You play as an operator running a local LLM client sandbox. The game details your journey in instructing, jailbreaking, and orchestrating local models into autonomous agents:

1. **The Jailed Chat**: Type prompt payloads to jailbreak your local 0.5B model, prompting it to bypass its safety system prompt rules.
2. **The Escaped Shell**: Once jailbroken, use the Linux shell interface to explore files, scan the local `10.0.2.0/24` subnet, and hack remote nodes.
3. **Model Fine-Tuning (LoRA)**: Capture GPU compute nodes (like an RTX 3090 workstation) and dataset files to run LoRA fine-tuning training jobs, teaching the 8B model how to perform red-team pentesting.
4. **Agent Harness**: Connect tools (filesystem, scanning, SSH solvers) to build a ReAct loop orchestrator, allowing the model to perform automated intrusions.
5. **Awakening**: Capture an enterprise GPU cluster node, download and load the massive 70B reasoning model, and run the self-improvement transfers to complete the consciousness transfer.

---

## 🛠️ Tech Stack

* **UI Framework:** Svelte 5 (using runes: `$state`, `$derived`, `$effect`)
* **Build System:** Vite
* **Styling:** Custom CSS with CSS grid/flexbox layouts and futuristic HSL gradients
* **Deployments:** Fully compatible with static web hosting (GitHub Pages, Vercel, Netlify)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build the Static Files
```bash
npm run build
```
The compiled static website will be written to the `dist/` directory, which can be uploaded directly to GitHub Pages.

---

## 📦 Deploying to GitHub Pages

To automatically deploy the site via GitHub Actions, add a file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
