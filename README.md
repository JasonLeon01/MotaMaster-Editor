# MotaMaster Editor
[中文](README_CN.md) | [English](README.md)

A specialized game editor for creating Magic Tower (Mota) type games using the MotaMaster engine.

## Features

- Visual map editor
- Character editor
- Item and equipment management
- Enemy configuration
- Animation editor
- Event system editor
- System settings configuration

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/JasonLeon01/MotaMaster-Editor.git
```
2. Install dependencies
```bash
cd MotaMaster-Editor
npm install
```

3. Start the development environment
```bash
npm start
npm run electron
```

## Development
- `npm run electron-dev` : Start the development environment
- `npm start` : Start only the React development server
- `npm run build` : Build the production version
- `npm run electron` : Start Electron without development mode
- `npm run package:win` : Package Windows program only
- `npm run package:mac` : Package macOS program only

## Project Structure
- `/src` : React source code
- `/electron` : Electron main process code
- `/public` : Static assets
- `/assets` : Game assets (after project creation)

## License
This project is licensed under the zlib License - see the [LICENSE](LICENSE) file for details.
