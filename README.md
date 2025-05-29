# Algo! - LeetCode Smart Hint Chatbot

A Chrome extension that provides interactive, step-by-step hints to help users solve coding problems on LeetCode.

## Features

- 🤖 AI-powered tutoring that provides personalized hints
- 💡 Step-by-step guidance without giving away solutions
- 🎯 Context-aware hints based on your current code
- 💬 Interactive chat interface
- 🎨 Modern, non-intrusive design

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any LeetCode problem page
2. Click the Algo! chat bubble in the bottom right corner
3. Ask for hints or type "next hint" to get guidance
4. The AI will provide personalized hints based on your current code

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - Chat interface
- `popup.js` - Chat functionality
- `content.js` - Page interaction
- `background.js` - Background processes
- `styles.css` - Styling

### Backend Integration

The extension requires a backend service that integrates with Gemini AI. Update the `API_ENDPOINT` in `popup.js` with your backend service URL.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes. 