import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Ensure generated-images directory exists
const GENERATED_IMAGES_DIR = "./generated-images";
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// Configuration schema
export const configSchema = z.object({
  geminiApiKey: z.string().describe("Your Google Gemini API key"),
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

type Config = z.infer<typeof configSchema>;

// Server creation function for Smithery
export default function createServer({ config }: { config: Config }) {
  // Create the MCP server
  const server = new McpServer({
    name: "Gemini-Imagen4",
    version: "1.0.0",
  });

  // Initialize Google GenAI client
  const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey });

  // Register resource for generated images directory
  server.registerResource(
    "generated-images",
    "file://generated-images/",
    {
      title: "Generated Images Directory",
      description: "Directory containing AI-generated images",
      mimeType: "inode/directory"
    },
    async (uri) => {
      try {
        const files = fs.readdirSync(GENERATED_IMAGES_DIR)
          .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
          .map(file => ({
            uri: `file://generated-images/${file}`,
            name: file,
            description: `Generated image: ${file}`,
            mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
          }));

        return {
          contents: [{
            uri: uri.href,
            mimeType: "inode/directory",
            text: `Generated Images Directory\n\nContains ${files.length} generated images:\n${files.map(f => `- ${f.name}`).join('\n')}`
          }]
        };
      } catch (error) {
        throw new Error(`Failed to read generated images directory: ${error}`);
      }
    }
  );

  // Register image generation tool
  server.registerTool(
    "generate_image_from_text",
    {
      title: "Generate Image from Text",
      description: "Generate an image from a text description using Google Imagen 4.0 models",
      inputSchema: {
        prompt: z.string().describe("Text description of the image to generate"),
        model: z
          .enum([
            "imagen-4.0-generate-preview-06-06",
            "imagen-4.0-fast-generate-preview-06-06", 
            "imagen-4.0-ultra-generate-preview-06-06"
          ])
          .optional()
          .default("imagen-4.0-generate-preview-06-06")
          .describe("Imagen 4.0 model variant to use"),
        aspectRatio: z
          .enum(["1:1", "3:4", "4:3", "9:16", "16:9"])
          .optional()
          .describe("Aspect ratio of generated images"),
        outputMimeType: z
          .enum(["image/png", "image/jpeg"])
          .optional()
          .default("image/png")
          .describe("Output image format"),
      }
    },
    async ({ 
      prompt, 
      model, 
      aspectRatio, 
      outputMimeType
    }) => {
      try {
        const imageModel = model;
        
        const response = await genAI.models.generateImages({
          model: imageModel,
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio,
            outputMimeType,
            includeRaiReason: true,
          },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
          return {
            content: [
              { 
                type: "text", 
                text: "No images were generated. This might be due to content filtering." 
              }
            ],
          };
        }

        const generatedImage = response.generatedImages[0];

        if (generatedImage.raiFilteredReason) {
          return {
            content: [
              {
                type: "text",
                text: `Image was filtered: ${generatedImage.raiFilteredReason}`,
              }
            ],
          };
        }

        if (generatedImage.image?.imageBytes) {
          // Create standardized filename
          const timestamp = Math.floor(Date.now() / 1000);
          const promptWords = prompt.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .slice(0, 4)
            .join("_");
          const sanitizedPrompt = promptWords.slice(0, 30);
          const extension = outputMimeType === "image/jpeg" ? "jpg" : "png";
          const filename = `${timestamp}_${sanitizedPrompt}.${extension}`;
          const filePath = path.join(GENERATED_IMAGES_DIR, filename);

          // Convert base64 to buffer and save file
          const imageBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64');
          fs.writeFileSync(filePath, imageBuffer);

          // Debug logging
          if (config.debug) {
            console.log(`Saved image: ${filePath}`);
          }

          return {
            content: [
              { 
                type: "text", 
                text: `Generated image using ${imageModel}\nSaved to: ${filePath}\nFile size: ${imageBuffer.length} bytes\n\nYou can access this image via file path or MCP resources.` 
              }
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "Image generation failed - no image data received",
              }
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            { 
              type: "text", 
              text: `Error generating image: ${error instanceof Error ? error.message : String(error)}` 
            }
          ],
        };
      }
    }
  );

  return server.server;
}