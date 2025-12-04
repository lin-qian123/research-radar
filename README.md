# Research Farm 🌱

**Research Farm** is a personalized AI research assistant designed to help researchers "cultivate" knowledge. It automatically harvests the latest scientific breakthroughs, stores them in your local "Barn," and provides an AI "Agronomist" to help you analyze and discuss the literature.

[English Documentation](#english-documentation) | [中文文档](#中文文档)

---

# English Documentation

## ✨ Key Features

*   **Daily Harvest**: Background retrieval of papers based on your specific research interests (e.g., "Laser Plasma", "LLM Quantization").
*   **Knowledge Barn**: A local database to save, categorize, and manage your essential reading list.
*   **The Agronomist**: An AI chatbot that answers questions **strictly based on the papers in your Barn**, preventing hallucinations.
*   **Dual-Mode Search**:
    *   *Local Filter*: Instantly find papers in your library.
    *   *Web Scout*: Use AI to search the live internet for new papers.
*   **Multi-Provider Support**:
    *   **Google Gemini**: Uses native Search Grounding.
    *   **OpenAI/Compatible**: Uses **Semantic Scholar** API for real data, then uses the LLM for translation/analysis.
*   **Cross-Platform (PWA)**: Installable on Windows, macOS, Linux, Android, and iOS.

## 📲 Installation (For Users)

Research Farm is a **Progressive Web App (PWA)**. You can install it directly from your browser without an app store.

### Windows / macOS / Linux (Desktop)
1.  Open the application in **Google Chrome** or **Microsoft Edge**.
2.  Look for the **Install icon** (usually a computer screen with a downward arrow) in the right side of the address bar.
3.  Click **"Install Research Farm"**.
4.  The app will launch in its own window and appear in your Start Menu or Dock.

### Android
1.  Open the application in **Chrome**.
2.  Tap the **Menu** (three dots) in the top-right corner.
3.  Tap **"Add to Home screen"** or **"Install app"**.
4.  The app will appear on your home screen like a native app.

### iOS (iPhone / iPad)
1.  Open the application in **Safari**.
2.  Tap the **Share** button (box with an arrow pointing up) at the bottom.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Confirm the name and tap **Add**.

---

## 🛠️ Configuration (API Keys)

To fetch papers and chat, you need to configure an AI Provider.

1.  Click **"Farm Tools"** in the sidebar settings.
2.  **Google Gemini (Recommended)**:
    *   Get a key from [Google AI Studio](https://aistudio.google.com/).
    *   Paste it into the API Key field.
    *   This mode supports "Search Grounding" for live Google results.
3.  **OpenAI Compatible**:
    *   Enter your API Key (OpenAI, DeepSeek, etc.) and Base URL.
    *   In this mode, the app uses **Semantic Scholar** to find papers (ensuring valid DOIs and PDFs) and uses the LLM only for translation and summarization.

---

## 🚜 Usage Guide

1.  **Onboarding**: Enter your **Role** (e.g., "PhD Student") and **Crops** (Research Topics).
2.  **Daily Harvest**:
    *   Go to the **Daily Harvest** tab.
    *   Click **"Harvest Now"**. The app will search for papers related to all your topics.
    *   These papers are temporary (Inbox).
3.  **Storing Knowledge**:
    *   Find a paper you like in the Harvest feed.
    *   Click **"Add to Lib"**.
    *   It is now moved to your **Knowledge Barn** (Database).
4.  **Consult The Agronomist**:
    *   Go to the **The Agronomist** tab.
    *   Ask questions like "What are the key findings in the plasma papers?".
    *   The AI will answer using *only* the papers you have saved in your Barn.

---

# 中文文档

## ✨ 核心功能

*   **每日收割 (Daily Harvest)**：根据您的科研兴趣（如“激光等离子体”、“大模型量化”）自动后台检索最新论文。
*   **知识谷仓 (Knowledge Barn)**：本地数据库，用于保存、分类和管理您的核心文献。
*   **农学家 (The Agronomist)**：AI 助手，**仅基于您谷仓中的文献**进行回答，杜绝幻觉。
*   **双模搜索**：
    *   *本地筛选*：实时查找已保存的文献。
    *   *全网侦察*：利用 AI 实时联网搜索新文献。
*   **多模型支持**：
    *   **Google Gemini**：使用原生搜索落地 (Search Grounding)。
    *   **OpenAI/兼容模型**：使用 **Semantic Scholar** API 获取真实数据，再由 LLM 进行翻译和分析。
*   **跨平台 (PWA)**：支持在 Windows, macOS, Linux, Android 和 iOS 上安装。

## 📲 安装指南 (用户版)

Research Farm 是一个 **渐进式 Web 应用 (PWA)**。无需应用商店，您可以直接从浏览器安装。

### Windows / macOS / Linux (桌面端)
1.  使用 **Google Chrome** 或 **Microsoft Edge** 打开网页。
2.  点击地址栏右侧的 **安装图标**（通常是一个带下载箭头的小电脑图标）。
3.  点击 **"安装 Research Farm"**。
4.  应用将以独立窗口启动，并出现在您的开始菜单或程序坞中。

### Android (安卓)
1.  使用 **Chrome** 打开网页。
2.  点击右上角的 **菜单**（三个点）。
3.  点击 **"添加到主屏幕"** 或 **"安装应用"**。
4.  应用图标将出现在您的手机桌面上，体验与原生 App 一致。

### iOS (iPhone / iPad)
1.  使用 **Safari** 打开网页。
2.  点击底部的 **分享按钮**（带有向上箭头的方框）。
3.  向下滑动并点击 **"添加到主屏幕"**。
4.  确认名称后点击 **添加**。

---

## 🛠️ 配置说明 (API Key)

为了搜索论文和对话，您需要配置 AI 提供商。

1.  点击侧边栏的 **"Farm Tools"** (设置)。
2.  **Google Gemini (推荐)**:
    *   从 [Google AI Studio](https://aistudio.google.com/) 获取 API Key。
    *   填入 API Key 字段。
    *   此模式支持 Google 搜索落地，可直接联网。
3.  **OpenAI Compatible (通用模型)**:
    *   输入您的 API Key (如 OpenAI, DeepSeek 等) 和 Base URL。
    *   在此模式下，应用会自动调用 **Semantic Scholar** 接口查找文献（确保 DOI 和 PDF 链接真实有效），LLM 仅负责翻译和总结。

---

## 🚜 使用指南

1.  **初始化 (Onboarding)**：输入您的 **角色** (如 "博士生") 和 **作物** (科研兴趣词条)。
2.  **每日收割**:
    *   进入 **Daily Harvest** 页面。
    *   点击 **"Harvest Now"**。应用会自动遍历您的所有兴趣词条并搜索最新文献。
    *   这里的文献是临时的（收件箱）。
3.  **存储知识**:
    *   在收割列表中找到感兴趣的论文。
    *   点击 **"Add to Lib"**。
    *   该论文将被永久保存到您的 **Knowledge Barn** (知识谷仓) 中。
4.  **咨询农学家**:
    *   进入 **The Agronomist** 页面。
    *   提问（例如：“帮我总结一下已保存的关于等离子体的论文”）。
    *   AI 将仅根据您谷仓里的文献进行回答。

---

## 💻 Developer Setup (开发环境)

Run locally:

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Icons**: Lucide React
*   **AI SDK**: Google GenAI SDK
*   **Data Sources**: Google Search Grounding, Semantic Scholar Graph API
*   **Storage**: LocalStorage (Persisted in browser)
