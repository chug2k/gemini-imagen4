# 🎨 Gemini-Imagen4

**Local AI Image Generation MCP Server powered by Google's Imagen 4.0 models**

Generate stunning images from text descriptions using Google's cutting-edge Imagen 4.0 models through the Model Context Protocol (MCP). Images are saved locally to `./generated-images/` directory.

## ✨ Features

- 🖼️ **High-quality image generation** using Google's latest Imagen 4.0 models
- ⚡ **Multiple model variants** for different speed/quality needs
- 🎯 **Flexible aspect ratios** (1:1, 3:4, 4:3, 9:16, 16:9)
- 📸 **Multiple output formats** (PNG, JPEG)
- 🔒 **Built-in safety filtering** with reason reporting
- 💾 **Local file storage** - images saved to `./generated-images/` directory
- 🚀 **Easy local setup** - run with npx or npm
- 🔌 **MCP Resources** - browse generated images via MCP protocol

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation & Usage

#### Option 1: Install from npm (Recommended)
```bash
npm install -g gemini-imagen4
```

Then run:
```bash
gemini-imagen4
```

#### Option 2: Run directly with npx
```bash
npx gemini-imagen4
```

#### Option 3: Clone and run locally
```bash
git clone https://github.com/chug2k/gemini-imagen4.git
cd gemini-imagen4
npm install
npm run dev
```

You'll be prompted to enter your Gemini API key when you first run it.

### Usage

Once running, the server provides:

#### Tool: `generate_image_from_text`
Generate images from text descriptions with optional customization.

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `model` (optional): Choose from:
  - `imagen-4.0-generate-preview-06-06` (default - balanced)
  - `imagen-4.0-fast-generate-preview-06-06` (faster generation)
  - `imagen-4.0-ultra-generate-preview-06-06` (highest quality)
- `aspectRatio` (optional): `1:1`, `3:4`, `4:3`, `9:16`, or `16:9`
- `outputMimeType` (optional): `image/png` (default) or `image/jpeg`

**Example:**
```json
{
  "prompt": "A majestic dragon soaring through a sunset sky",
  "model": "imagen-4.0-ultra-generate-preview-06-06",
  "aspectRatio": "16:9",
  "outputMimeType": "image/png"
}
```

**Response:**
Images are saved to `./generated-images/` with timestamped filenames like `1754998591_majestic_dragon_soaring.png`

#### Resource: `generated-images`
Browse the generated images directory via MCP resources protocol.

## 🔌 Adding to Claude Desktop

To use this server with Claude Desktop, add it to your MCP configuration:

**Edit your `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "gemini-imagen4": {
      "command": "npx",
      "args": ["gemini-imagen4"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `your-api-key-here` with your actual Gemini API key, then restart Claude Desktop.

## 🔧 Configuration

The server requires a Gemini API key and supports the following configuration:

```yaml
# smithery.yaml
runtime: typescript
startCommand:
  type: http
  configSchema:
    type: object
    required: ["geminiApiKey"]
    properties:
      geminiApiKey:
        type: string
        title: "Gemini API Key"
        description: "Your Google Gemini API key"
      modelName:
        type: string
        title: "Model Name"
        description: "Default Imagen model to use"
        default: "imagen-4.0-generate-preview-06-06"
        enum: 
          - "imagen-4.0-generate-preview-06-06"
          - "imagen-4.0-fast-generate-preview-06-06"
          - "imagen-4.0-ultra-generate-preview-06-06"
```

## 🏃‍♂️ Development

Run the development server:
```bash
npm run dev
```

## 📦 Model Variants

- **Standard** (`imagen-4.0-generate-preview-06-06`): Best balance of quality and speed
- **Fast** (`imagen-4.0-fast-generate-preview-06-06`): Optimized for quick generation
- **Ultra** (`imagen-4.0-ultra-generate-preview-06-06`): Maximum quality output

## 🛡️ Safety & Content Filtering

All images are processed through Google's built-in safety filters. If content is filtered, the tool will return the reason for filtering instead of an image.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Google AI Studio](https://ai.google.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Smithery Platform](https://smithery.ai/)

---

**Built with ❤️ using Google's Imagen 4.0 and the Model Context Protocol**