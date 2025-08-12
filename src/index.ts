import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

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
        .describe("Imagen 4.0 model variant to use (defaults to configured model)"),
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
        const imageModel = model || config.modelName;
        
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

        const results = response.generatedImages.map((generatedImage, index) => {
          if (generatedImage.raiFilteredReason) {
            return {
              type: "text" as const,
              text: `Image ${index + 1} was filtered: ${generatedImage.raiFilteredReason}`,
            };
          }

          if (generatedImage.image?.imageBytes) {
            return {
              type: "image" as const,
              data: generatedImage.image.imageBytes,
              mimeType: outputMimeType || "image/png",
            };
          }

          return {
            type: "text" as const,
            text: `Image ${index + 1} generation failed - no image data received`,
          };
        });

        return {
          content: [
            { 
              type: "text", 
              text: `Generated ${response.generatedImages.length} image(s) using ${imageModel}` 
            },
            ...results,
          ],
        };
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
