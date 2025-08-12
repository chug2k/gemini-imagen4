# 🎨 Gemini-Imagegen4

**AI Image Generation MCP Server powered by Google's Imagen 4.0 models**

Generate stunning images from text descriptions using Google's cutting-edge Imagen 4.0 models through the Model Context Protocol (MCP).

## ✨ Features

- 🖼️ **High-quality image generation** using Google's latest Imagen 4.0 models
- ⚡ **Multiple model variants** for different speed/quality needs
- 🎯 **Flexible aspect ratios** (1:1, 3:4, 4:3, 9:16, 16:9)
- 📸 **Multiple output formats** (PNG, JPEG)
- 🔒 **Built-in safety filtering** with reason reporting
- 🚀 **Easy MCP integration** - works with Claude and other MCP clients
- 🌐 **MCP Resources support** - images accessible via standard MCP protocol
- ☁️ **Works locally and remotely** - no file access issues

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. Clone this repository:
```bash
git clone https://github.com/YOUR_USERNAME/gemini-imagegen4.git
cd gemini-imagegen4
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API key in your MCP client or when prompted

### Usage

The server provides one powerful tool:

#### `generate_image_from_text`
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
The tool returns a resource URI like `generated-image://1754998591_majestic_dragon_soaring.png` that can be accessed via MCP resources.

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