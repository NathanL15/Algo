# Algo!

A Chrome extension and Node.js backend for LeetCode hints with semantic retrieval.

## Features

- Real-time problem analysis
- Smart hint generation with Google Gemini Flash
- RAG retrieval with Gemini embeddings and Redis HNSW vector indexing
- Top-k similar problem injection into prompts
- Clean and modern UI
- Cloud Run deployment via Docker and GitHub Actions

## Development

### Prerequisites

- Node.js (v18 or higher)
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
cd algo-backend && npm install
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

- Backend tests:
```bash
cd algo-backend
npm test
```

- Run backend benchmark:
```bash
cd algo-backend
npm run benchmark
```

### Project Structure

```
algo/
├── src/
│   ├── content.ts      # Content script
│   ├── background.ts   # Background script
│   ├── popup.ts        # Popup script
│   ├── config.ts       # API base URL config
│   ├── types.ts        # Shared types
│   └── test/           # Test files
├── algo-backend/
│   ├── server.js       # Express API
│   ├── src/services/cache.js       # Redis hint cache
│   ├── src/services/vectorStore.js # Redis HNSW vector search
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── scripts/benchmark.js
├── dist/               # Compiled files
├── manifest.json       # Extension manifest
├── popup.html         # Popup HTML
├── styles.css         # Styles
└── icons/             # Extension icons
```

## Environment

### Extension

Set the backend API URL at build time.

```bash
ALGO_API_BASE_URL=https://YOUR_CLOUD_RUN_URL npm run build
```

### Backend

Required backend environment variables:

- GEMINI_API_KEY
- REDIS_HOST
- REDIS_PORT

Optional backend environment variables:

- REDIS_PASSWORD
- EMBEDDING_DIM (default: 3072)
- RAG_TOP_K (default: 3)

## Backend API

- GET /healthz
- GET /readyz
- POST /api/index-problem
- POST /api/rag/search
- POST /api/hints

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