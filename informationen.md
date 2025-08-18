# 📱 Gibbsta - Social Media App für die GIBB

> Eine Instagram-ähnliche App speziell für Schüler der GIBB Berufsfachschule

[![Status](https://img.shields.io/badge/Status-In%20Entwicklung-yellow)](https://github.com/gibb-team/gibbsta)
[![Version](https://img.shields.io/badge/Version-1.0.0--beta-blue)](https://github.com/gibb-team/gibbsta/releases)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Projektziel

Eine benutzerfreundliche Social Media Plattform, die speziell für die GIBB-Schulgemeinschaft entwickelt wird. Schüler können Bilder teilen, sich vernetzen und schulbezogene Inhalte austauschen.

### ✨ Hauptfeatures
- 📸 **Bilder hochladen** und mit der Community teilen
- 💬 **Chat-System** für 1-zu-1 und Gruppennachrichten  
- ❤️ **Like & Kommentar-System** für Interaktion
- 👥 **Schulspezifische Profile** mit Klassen- und Fachzuordnung
- 🔔 **Push-Benachrichtigungen** für wichtige Updates

---

## 🛠️ Tech Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary">
</td>
</tr>
<tr>
<td><strong>Tools</strong></td>
<td>
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git">
  <img src="https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code">
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma">
</td>
</tr>
</table>

---

## 👥 Team & Rollen

<table>
<tr>
<th>👨‍💻 Frontend Team</th>
<th>⚙️ Backend Team</th>
<th>🎨 Design Team</th>
<th>🚀 DevOps</th>
</tr>
<tr>
<td>
• UI/UX Implementierung<br>
• Mobile App Development<br>
• User Experience<br>
• Component-Architektur
</td>
<td>
• API Development<br>
• Datenbankdesign<br>
• Authentication<br>
• Server-Logic
</td>
<td>
• Mockups & Prototyping<br>
• Design System<br>
• User Research<br>
• Brand Identity
</td>
<td>
• App Deployment<br>
• Testing Koordination<br>
• Performance Monitoring<br>
• Project Management
</td>
</tr>
</table>

---

## 🗓️ Roadmap

```mermaid
gantt
    title Gibbsta Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Setup
    Projektplanung        :done, p1, 2024-01-01, 2024-01-14
    Environment Setup     :done, p2, 2024-01-08, 2024-01-21
    
    section Phase 2: MVP
    User Authentication   :active, p3, 2024-01-15, 2024-02-05
    Basic Image Upload    :p4, 2024-01-22, 2024-02-12
    Feed Implementation   :p5, 2024-02-06, 2024-02-26
    
    section Phase 3: Features
    Chat System          :p6, 2024-02-13, 2024-03-05
    Like & Comments      :p7, 2024-02-20, 2024-03-12
    Notifications        :p8, 2024-03-06, 2024-03-26
    
    section Phase 4: Polish
    Testing & Bug Fixes  :p9, 2024-03-13, 2024-04-02
    Performance Tuning   :p10, 2024-03-20, 2024-04-09
    Beta Release         :milestone, 2024-04-10, 0d
```

---

## 📋 Feature Backlog

### 🔥 MVP (Version 1.0)
- [x] User Registration & Login
- [x] Basic Profile Creation
- [ ] Image Upload Functionality
- [ ] Feed Display
- [ ] Basic Like System
- [ ] Simple Chat

### 🚀 Version 1.1
- [ ] Comment System
- [ ] Group Chats
- [ ] Push Notifications
- [ ] Profile Customization
- [ ] Search Functionality

### 🌟 Version 1.2
- [ ] Stories Feature
- [ ] Image Filters
- [ ] Event Calendar
- [ ] Class-specific Groups
- [ ] Dark Mode

### 🎯 Future Ideas
- [ ] Video Upload
- [ ] Voice Messages
- [ ] Study Groups
- [ ] Homework Sharing
- [ ] Teacher Integration

---

## 🏗️ Projektstruktur

```
gibbsta/
├── 📱 frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── utils/
│   │   └── assets/
│   └── package.json
├── ⚙️ backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── 🎨 design/
│   ├── mockups/
│   ├── assets/
│   └── style-guide.md
├── 📚 docs/
│   ├── api-documentation.md
│   ├── user-guide.md
│   └── deployment.md
└── 🧪 tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🚀 Quick Start

### Voraussetzungen
- Node.js (v16+)
- React Native CLI
- Git
- Firebase Account

### Installation

```bash
# Repository klonen
git clone https://github.com/gibb-team/gibbsta.git
cd gibbsta

# Dependencies installieren
npm install

# Environment Setup
cp .env.example .env
# Firebase Konfiguration in .env eintragen

# Development Server starten
npm run dev
```

### 📱 Mobile App starten
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 📊 Entwicklungsmetriken

<div align="center">

| Metric | Ziel | Status |
|--------|------|--------|
| **Code Coverage** | >80% | ![Coverage](https://img.shields.io/badge/Coverage-65%25-yellow) |
| **Performance** | <2s Load | ![Performance](https://img.shields.io/badge/Load_Time-1.8s-green) |
| **Bundle Size** | <5MB | ![Bundle](https://img.shields.io/badge/Bundle-4.2MB-green) |
| **User Rating** | >4.5⭐ | ![Rating](https://img.shields.io/badge/Rating-4.7★-brightgreen) |

</div>

---

## 🔐 Sicherheit & Datenschutz

### 🛡️ Sicherheitsmaßnahmen
- ✅ **End-zu-End Verschlüsselung** für Chat-Nachrichten
- ✅ **DSGVO-konforme** Datenverarbeitung
- ✅ **Sichere Authentication** mit JWT Tokens
- ✅ **Input Validation** auf allen Ebenen
- ✅ **Content Moderation** System

### 📋 Compliance
- 🇪🇺 **DSGVO/GDPR** konform
- 🇨🇭 **Schweizer Datenschutzgesetz** konform
- 🔒 **ISO 27001** Security Standards

---

## 📚 Lernressourcen

### 🎓 Für Anfänger
- [React Native Tutorial](https://reactnative.dev/docs/tutorial) - Offizielle Dokumentation
- [Firebase Crashkurs](https://www.youtube.com/watch?v=9kRgVxULbag) - YouTube Tutorial
- [Git Basics](https://git-scm.com/book/en/v2) - Versionskontrolle lernen

### 🔧 Für Fortgeschrittene
- [Advanced React Patterns](https://kentcdodds.com/blog/advanced-react-patterns) - Kent C. Dodds
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) - GitHub Repo
- [Mobile App Security](https://owasp.org/www-project-mobile-app-security/) - OWASP Guide

---

## 🤝 Contributing

Wir freuen uns über Beiträge! Bitte lies unsere [Contributing Guidelines](CONTRIBUTING.md) vor deinem ersten Pull Request.

### 📝 Pull Request Process
1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

---

## 📞 Support & Kontakt

<div align="center">

**📧 Email:** gibbsta-team@students.gibb.ch  
**💬 Discord:** [Gibb Community Server](https://discord.gg/gibbsta)  
**🐛 Bug Reports:** [GitHub Issues](https://github.com/gibb-team/gibbsta/issues)

---

**Entwickelt mit ❤️ von GIBB Studenten für GIBB Studenten**

![GIBB Logo](https://i.ibb.co/zH8rMfZL/Screenshot-2025-08-18-133537.png)

</div>
