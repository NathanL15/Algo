# Algo! - Your LeetCode Assistant

A Chrome extension that provides AI-powered hints and guidance for LeetCode problems.

## Features

- Real-time problem analysis
- Smart hint generation
- Clean and modern UI
- TypeScript support

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/algo.git
cd algo
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory

### Development Workflow

- Run in development mode with hot reloading:
```bash
npm run dev
```

- Type checking:
```bash
npm run type-check
```

- Linting:
```bash
npm run lint
```

- Testing:
```bash
npm run test
```

### Project Structure

```
algo/
├── src/
│   ├── content.ts      # Content script
│   ├── background.ts   # Background script
│   ├── popup.ts        # Popup script
│   ├── types.ts        # Shared types
│   └── test/           # Test files
├── dist/               # Compiled files
├── manifest.json       # Extension manifest
├── popup.html         # Popup HTML
├── styles.css         # Styles
└── icons/             # Extension icons
```

### TypeScript Migration

The project has been migrated to TypeScript for better type safety and developer experience. Key changes include:

1. Added TypeScript configuration (`tsconfig.json`)
2. Added type definitions for Chrome API (`@types/chrome`)
3. Converted JavaScript files to TypeScript
4. Added shared types in `types.ts`
5. Updated build process with webpack and ts-loader
6. Added ESLint configuration for TypeScript
7. Added Jest configuration for TypeScript testing

### Building for Production

1. Clean the build directory:
```bash
npm run clean
```

2. Build the extension:
```bash
npm run build
```

The compiled files will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 