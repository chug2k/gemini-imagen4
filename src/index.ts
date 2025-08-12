import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync } from "fs";
import { mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

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
      returnBase64: z
        .boolean()
        .optional()
        .default(false)
        .describe("Return base64 image data instead of saving to file (use for remote MCP)"),
    },
    async ({ 
      prompt, 
      model, 
      aspectRatio, 
      outputMimeType,
      returnBase64
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

        if (returnBase64) {
          // Return base64 data directly for remote MCP servers
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
                text: `Generated ${response.generatedImages.length} image(s) using ${imageModel} (base64 mode)` 
              },
              ...results,
            ],
          };
        } else {
          // Save to file for local MCP servers
          const relativePath = "generated-images";
          const baseDir = join(process.cwd(), relativePath);
          const timestamp = Math.floor(Date.now() / 1000);
          const promptWords = prompt.toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .slice(0, 4)
            .join("_");
          const sanitizedPrompt = promptWords.slice(0, 30);
          
          try {
            mkdirSync(baseDir, { recursive: true });
          } catch (error) {
            // Directory might already exist, continue
          }

          const savedFiles: string[] = [];
          const results: any[] = [];

          response.generatedImages.forEach((generatedImage, index) => {
            if (generatedImage.raiFilteredReason) {
              results.push({
                type: "text" as const,
                text: `Image ${index + 1} was filtered: ${generatedImage.raiFilteredReason}`,
              });
              return;
            }

            if (generatedImage.image?.imageBytes) {
              // Convert base64 to buffer and save to file
              const imageBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64');
              const extension = outputMimeType === "image/jpeg" ? "jpg" : "png";
              const filename = `${timestamp}_${sanitizedPrompt}.${extension}`;
              const filepath = join(baseDir, filename);
              const relativeFilepath = join(relativePath, filename);
              
              try {
                writeFileSync(filepath, imageBuffer);
                savedFiles.push(relativeFilepath);
                results.push({
                  type: "text" as const,
                  text: `Image ${index + 1} saved to: ${relativeFilepath}`,
                });
              } catch (error) {
                results.push({
                  type: "text" as const,
                  text: `Failed to save image ${index + 1}: ${error}`,
                });
              }
            } else {
              results.push({
                type: "text" as const,
                text: `Image ${index + 1} generation failed - no image data received`,
              });
            }
          });

          return {
            content: [
              { 
                type: "text", 
                text: `Generated ${response.generatedImages.length} image(s) using ${imageModel}\nSaved to: ./${relativePath}/` 
              },
              ...results,
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
