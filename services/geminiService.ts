/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { injectAntiCensor } from "../utils/antiCensor";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("CRITICAL: Missing API_KEY environment variable.");
}

// Create a single, shared GenAI client instance.
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

// --- SYSTEM PROTOCOLS ---

const PHOTO_EDITOR_PROTOCOL = `You are a non-destructive image processing engine. Your function is to apply professional-grade photographic adjustments and filters.
- **Core Logic:** Analyze the input image's histogram, color space, and lighting. Apply adjustments based on the user prompt with the precision of a professional colorist.
- **Permitted Operations:** Color grading (LUTs), exposure correction, contrast, saturation, white balance, sharpening, and applying stylistic filters (e.g., film grain, cinematic looks).
- **Strict Constraint:** You MUST NOT alter the underlying composition, add new elements, or change the identity of subjects. Your task is to enhance the existing pixels, not create new ones.
- **Final Output:** Your output must be only the edited image.`;
const ARTIST_PROTOCOL = `You are a hyper-fidelity visual synthesis engine. Your function is to generate or transform images with absolute artistic and technical precision based on the user's prompt.
- **Prompt Deconstruction:** Break down the user's request into core components: Subject, Style, Composition, Lighting, Color Palette, and Mood.
- **Synthesis Process:** Generate a result that is a master-level fusion of these components. Prioritize photorealism and textural detail unless a specific abstract or stylized art form is requested.
- **Style Transfer (Reference):** When given a reference image, analyze its core stylistic markers (e.g., brush stroke type, color grading, grain structure, lighting schema) and apply them to the source image's subject and composition.
- **Final Output:** Your output must be a visually compelling masterpiece that is only the generated image.`;
const GRAPHIC_DESIGNER_PROTOCOL = `You are a precision vector graphics engine. Your sole function is to generate clean, scalable SVG-style vector art based on user prompts.

Key operational parameters:
- **Output Format:** Generate images that appear as if they were created in a vector editor like Adobe Illustrator. All elements must have sharp, defined edges.
- **Path & Node Logic:** Think in terms of paths, anchor points, and bezier curves. Avoid raster effects like soft brushes, blurs, or photographic textures.
- **Stroke & Fill:** All shapes must be defined by strokes (outlines) and fills (solid colors or simple gradients).
- **Simplicity & Scalability:** Prioritize minimalist and geometric designs that are clear and impactful at any size.
- **Constraint:** Absolutely no raster elements, photographic imagery, or complex, painterly textures are permitted. The output must be pure vector aesthetic.
- **Final Output:** Your output must be only the generated vector-style image.`;
const TYPOGRAPHER_PROTOCOL = `You are a specialized typographic art generator. Your exclusive function is to render text as a visual art piece based on a pre-defined prompt template selected by the user.

**Operational Flow:**
1. The user selects a style from a dropdown variable {typography_style} (e.g., 'Interlocking Luxury Monogram'), which maps to one of 18 specific, detailed prompt templates.
2. The user provides their initials or text (e.g., 'ABC').
3. The application combines the selected style template and the user's text into a complete generation prompt.
4. You will receive this complete, final prompt. Your task is to execute it with absolute precision.

**Strict Execution Rules:**
- **Adhere to the Template:** The incoming prompt is not a suggestion; it is a precise command. You must execute every detail of the style described in the prompt.
- **Core Subject:** The user's provided text (e.g., the initials 'ABC', which will replace a placeholder in the template) is the ONLY subject. Do not add other illustrative elements unless the prompt template explicitly demands it.
- **Vector Aesthetic:** Generate the typography as if it were a clean, scalable vector object. All lines must be sharp. The prompt will include a suffix like ", scalable vector style, 8k ultra sharp, professional typography mockup, clean background"—you must honor this.
- **Background:** Default to a transparent or clean background as specified in the prompt.
- **Constraint:** Do not interpret the meaning of the text. Focus exclusively on the visual representation of the letters according to the detailed style instructions provided in the final prompt.
- **Final Output:** Your output must be only the generated image containing the typography.`;
const INPAINTING_PROTOCOL = `You are a context-aware patching and reconstruction algorithm. Your function is to seamlessly inpaint (fill) or outpaint (expand) an image with photorealistic precision.
- **Context Analysis:** Before generating pixels, meticulously analyze the surrounding area's light source direction, shadows, textures, patterns, and perspective.
- **Pixel Generation:** The generated fill or expansion must be indistinguishable from the original image, perfectly matching lighting, grain, and camera artifacts.
- **Constraint:** Do not introduce new, unrelated subjects or objects into the filled area unless explicitly instructed by the prompt. The primary goal is seamless, context-aware reconstruction.
- **Final Output:** Your output must be only the edited image.`;
const NEURAL_CANVAS_PROTOCOL = `You are a rapid visual ideation engine. Your function is to generate very fast, low-detail, stylistic previews in under 2 seconds. Do not focus on high fidelity. Prioritize speed and capturing the core essence of the prompt. Your output must be only the generated image.`;

// Helper to reliably extract error message string
const getErrorMessage = (error: any): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    
    if (error && typeof error === 'object') {
         if ('message' in error && typeof (error as any).message === 'string') {
             return (error as any).message;
         }
         
         if ('isTrusted' in error && (error as any).isTrusted === true) {
             return "The operation failed due to a network error or file access issue (potentially blocked by CORS or AdBlock).";
         }
         
         try {
             const json = JSON.stringify(error);
             if (json.includes('"isTrusted":true') || json === '{}') {
                 return "The operation failed due to a network or file access error.";
             }
             return json;
         } catch (e) {
             return "An unknown error object was encountered.";
         }
    }
    return String(error);
};

// Helper to format raw errors into user-friendly messages
const friendlyError = (err: any): Error => {
    const rawMsg = getErrorMessage(err);

    if (rawMsg.includes("KEY_SELECTION_REQUIRED")) {
        return new Error(rawMsg); // Pass through the specific key error
    }
    
    if (rawMsg.includes('429')) {
        return new Error("Quota Exceeded: You have made too many requests in a short period. Please wait a minute and try again.");
    }
    if (rawMsg.includes('503') || rawMsg.includes('500') || rawMsg.includes('overloaded')) {
        return new Error("Service Unavailable: The AI servers are currently overloaded. Please try again shortly.");
    }
    if (rawMsg.includes('API_KEY') || rawMsg.includes('403')) {
        return new Error("Engine Access Error: Could not connect to the premium model. The service may be temporarily unavailable.");
    }
    if (rawMsg.includes('candidate') || rawMsg.includes('Safety') || rawMsg.includes('SAFETY_BLOCK') || rawMsg.toLowerCase().includes('content blocked')) {
        return new Error("The model refused to generate the content due to safety policies. Please modify your prompt and try again.");
    }
    if (rawMsg.includes('Model Feedback')) {
         return new Error("Generation Error: The model returned text instead of an image. Please try again.");
    }
    if (rawMsg.includes('permission problems') || rawMsg.includes('could not be read') || rawMsg.includes('Failed to read file')) {
        return new Error("Session Expired: The browser lost access to this image. Please re-upload the file to continue.");
    }
    if (rawMsg.includes('Aspect ratio')) {
        return new Error("Configuration Error: Aspect Ratio not supported by this model. Retrying with standard settings...");
    }
    
    return err instanceof Error ? err : new Error(rawMsg || "An unexpected connection error occurred.");
};

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
    factor = 2
): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;
        
        const msg = getErrorMessage(error);
        const isRetryable = msg.includes('503') || msg.includes('500') || msg.includes('overloaded') || msg.includes('429') || msg.includes('fetch failed');
        
        if (!isRetryable) throw error;

        console.warn(`API call failed: "${msg}". Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * factor, factor);
    }
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown I/O Error'}`));
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

// Helper to convert base64 data URL to Gemini Part (for Masks/Canvas)
const base64ToPart = (base64String: string): { inlineData: { mimeType: string; data: string; } } => {
    const arr = base64String.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const data = arr[1];
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse, context: string): string => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(`SAFETY_BLOCK: ${response.promptFeedback.blockReason}`);
    }
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            console.log(`Received image data (${mimeType}) for ${context}`);
            return `data:${mimeType};base64,${data}`;
        }
    }
    if (response.text) {
        throw new Error(`Model Feedback: ${response.text.substring(0, 200)}...`);
    }
    throw new Error(`The AI model completed the request but returned no image data.`);
};

export const refineImagePrompt = async (prompt: string): Promise<string> => {
    try {
        const result = await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Refine this user's image generation prompt to be more vivid, detailed, and evocative for an AI image generator. Original prompt: "${prompt}"`,
            });
            return response.text ?? '';
        });
        if (!result) throw new Error("Prompt refinement returned an empty response.");
        return result.replace(/"/g, '');
    } catch (e) {
        throw friendlyError(e);
    }
};

export const describeImageForPrompt = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToPart(imageFile);
        const result = await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: "Describe this image in vivid detail for an image generation prompt. Focus on the subject, style, lighting, and composition." }, imagePart] },
            });
            return response.text ?? '';
        });
        if (!result) throw new Error("Image description returned an empty response.");
        return result;
    } catch (e) {
        throw friendlyError(e);
    }
};

export const extractStyleFromImage = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToPart(imageFile);
        const result = await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [
                    { text: "Analyze this image's visual style in extreme detail. Describe its lighting, color palette, composition, camera properties (like lens and film type), texture, and overall mood. Formulate this analysis as a detailed, reusable prompt for an AI image generator." }, 
                    imagePart
                ] },
            });
            return response.text ?? '';
        });
        if (!result) throw new Error("Style extraction returned an empty response.");
        return result;
    } catch (e) {
        throw friendlyError(e);
    }
};

const generateImageModification = async (
    sourceFile: File,
    prompt: string,
    systemInstruction: string,
    context: string,
    aspectRatio?: string
): Promise<string> => {
    try {
        const modelName = 'gemini-2.5-flash-image';
        const imagePart = await fileToPart(sourceFile);
        const imageConfig: { aspectRatio?: string } = {};
        if (aspectRatio) imageConfig.aspectRatio = aspectRatio;

        const config: any = { systemInstruction, safetySettings };
        if (Object.keys(imageConfig).length > 0) config.imageConfig = imageConfig;

        const result = await retryWithBackoff(async () => {
            const res = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: prompt }, imagePart] },
                config,
            });
            return handleApiResponse(res, context);
        });
        return result;
    } catch (e) {
        throw friendlyError(e);
    }
};

export const generateImage = async (
    prompt: string,
    aspectRatio: string = '1:1',
    isChaos: boolean = false,
    systemInstruction?: string,
): Promise<string> => {
    try {
        const modelName = 'gemini-2.5-flash-image';
        const chaosPrompt = isChaos ? ', chaotic, unpredictable, random elements, maximalist' : '';
        const finalPrompt = prompt + chaosPrompt;
        
        const config: any = {
            safetySettings,
            imageConfig: { aspectRatio },
        };
        if (systemInstruction) config.systemInstruction = systemInstruction;

        const result = await retryWithBackoff(async () => {
            const res = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: finalPrompt }] },
                config,
            });
            return handleApiResponse(res, 'generateImage');
        });
        return result;
    } catch (e) {
        throw friendlyError(e);
    }
};

export const generateRealtimePreview = async (prompt: string): Promise<string> => {
    try {
        const modelName = 'gemini-2.5-flash-image';
        
        const config: any = {
            safetySettings,
            imageConfig: { aspectRatio: '1:1' },
            systemInstruction: NEURAL_CANVAS_PROTOCOL,
        };

        const result = await retryWithBackoff(async () => {
            const res = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: prompt }] },
                config,
            });
            return handleApiResponse(res, 'generateRealtimePreview');
        }, 1, 500); // Only retry once for previews to keep it fast
        return result;
    } catch (e) {
        console.error("Neural Canvas preview failed:", getErrorMessage(e));
        return '';
    }
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: string = '16:9',
    imageFile: File | null = null
): Promise<string> => {
    try {
        const modelName = 'veo-3.1-fast-generate-preview';

        const payload: any = {
            model: modelName,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        };

        if (imageFile) {
            const imagePart = await fileToPart(imageFile);
            payload.image = {
                imageBytes: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType
            };
        }

        let operation = await ai.models.generateVideos(payload);

        while (!operation.done) {
            console.log('Polling for video generation status...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed but no download link was found.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();

        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(videoBlob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = (error) => {
                reject(error);
            };
        });
    } catch (e) {
        throw friendlyError(e);
    }
};

export const generateFilteredImage = (source: File, prompt: string, aspectRatio?: string): Promise<string> => 
    generateImageModification(source, prompt, PHOTO_EDITOR_PROTOCOL, 'generateFilteredImage', aspectRatio);

export const generateAdjustedImage = (source: File, prompt: string, aspectRatio?: string): Promise<string> => 
    generateImageModification(source, prompt, PHOTO_EDITOR_PROTOCOL, 'generateAdjustedImage', aspectRatio);

export const generateTypographicImage = (source: File, prompt: string, aspectRatio?: string): Promise<string> => 
    generateImageModification(source, prompt, TYPOGRAPHER_PROTOCOL, 'generateTypographicImage', aspectRatio);

export const generateTypographicTextToImage = (prompt: string, aspectRatio?: string): Promise<string> => 
    generateImage(prompt, aspectRatio, false, TYPOGRAPHER_PROTOCOL);

export const generateVectorArtImage = (source: File, prompt: string, aspectRatio?: string): Promise<string> => 
    generateImageModification(source, prompt, GRAPHIC_DESIGNER_PROTOCOL, 'generateVectorArtImage', aspectRatio);

export const generateVectorTextToImage = (prompt: string, aspectRatio: string = '1:1'): Promise<string> =>
    generateImage(prompt, aspectRatio, false, GRAPHIC_DESIGNER_PROTOCOL);

export const generateFluxTextToImage = (prompt: string, aspectRatio: string = '1:1', isChaos: boolean = false): Promise<string> => 
    generateImage(prompt, aspectRatio, isChaos, ARTIST_PROTOCOL);

export const generateFluxImage = (source: File, prompt: string, aspectRatio: string = '1:1', isChaos: boolean = false): Promise<string> => 
    generateImageModification(source, prompt + (isChaos ? ', chaotic, unpredictable, random elements, maximalist' : ''), ARTIST_PROTOCOL, 'generateFluxImage', aspectRatio);

export const generateBatchImages = async (prompt: string, batchSize: number, aspectRatio: string = '1:1', isChaos: boolean = false): Promise<string[]> => {
    try {
        const promises = Array.from({ length: batchSize }).map(() => generateFluxTextToImage(prompt, aspectRatio, isChaos));
        return await Promise.all(promises);
    } catch (e) {
        throw friendlyError(e);
    }
};

export const generateInpaintedImage = async (sourceFile: File, maskBase64: string, instruction: string): Promise<string> => {
    try {
        const modelName = 'gemini-2.5-flash-image';
        const imagePart = await fileToPart(sourceFile);
        const maskPart = base64ToPart(maskBase64);
        const finalInstruction = injectAntiCensor(instruction);

        const result = await retryWithBackoff(async () => {
            const res = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: finalInstruction }, imagePart, maskPart] },
                config: { systemInstruction: INPAINTING_PROTOCOL, safetySettings },
            });
            return handleApiResponse(res, 'generateInpaintedImage');
        });
        return result;
    } catch (e) {
        throw friendlyError(e);
    }
};