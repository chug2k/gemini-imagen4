import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

// In-memory registry for generated images
interface GeneratedImage {
  uri: string;
  filename: string;
  imageData: string; // base64
  mimeType: string;
  prompt: string;
  model: string;
  timestamp: number;
}

const imageRegistry = new Map<string, GeneratedImage>();

// Optional: Define configuration schema to require configuration at connection time
export const configSchema = z.object({
  geminiApiKey: z.string().describe("Your Google Gemini API key"),
  modelName: z
    .string()
    .default("imagen-4.0-generate-preview-06-06")
    .describe("Imagen model to use for image generation"),
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "Gemini-Imagegen4",
    version: "1.0.0",
  });

  // Initialize Google GenAI client
  const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey });

  // Set server capabilities to include resources
  server.setCapabilities({
    resources: {},
  });

  // Handle resource listing
  server.setRequestHandler("resources/list", async () => {
    const resources = Array.from(imageRegistry.values()).map((img) => ({
      uri: img.uri,
      name: `Generated Image: ${img.prompt.slice(0, 50)}...`,
      description: `AI-generated image using ${img.model}`,
      mimeType: img.mimeType,
    }));

    return { resources };
  });

  // Handle resource reading
  server.setRequestHandler("resources/read", async (request) => {
    const uri = request.params.uri;
    const image = imageRegistry.get(uri);
    
    if (!image) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri: image.uri,
          mimeType: image.mimeType,
          blob: image.imageData,
        },
      ],
    };
  });

  // Add image generation tool
  server.tool(
    "generate_image_from_text",
    "Generate an image from a text description using Google Imagen 4.0 models",
    {
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

        const results: any[] = [];
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
          const uri = `generated-image://${filename}`;

          // Store in registry
          const imageData: GeneratedImage = {
            uri,
            filename,
            imageData: generatedImage.image.imageBytes,
            mimeType: outputMimeType || "image/png",
            prompt,
            model: imageModel,
            timestamp,
          };
          
          imageRegistry.set(uri, imageData);

          return {
            content: [
              { 
                type: "text", 
                text: `Generated image using ${imageModel}\nResource available at: ${uri}\n\nUse MCP resources to view the image.` 
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