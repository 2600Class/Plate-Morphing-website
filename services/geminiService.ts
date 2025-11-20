import { GoogleGenAI } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const cleanText = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

/**
 * Preprocesses the image to ensure compatibility.
 * Scans for transparency and throws an error if found.
 * Converts valid images to JPEG.
 */
const preprocessImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(base64Str);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 3; i < data.length; i += 16) {
            if (data[i] < 250) {
              reject(new Error("Transparent images are not supported due to rendering bugs. Please upload an image with a solid background."));
              return;
            }
          }
        } catch (e) {
          console.warn("Could not analyze image alpha channel (likely CORS), proceeding carefully:", e);
        }
        
        const jpegData = canvas.toDataURL('image/jpeg', 0.95);
        resolve(jpegData);
      } catch (e) {
        console.warn("Image preprocessing failed, falling back to original:", e);
        resolve(base64Str);
      }
    };
    
    img.onerror = () => {
      console.warn("Failed to load image for preprocessing, falling back to original");
      resolve(base64Str);
    };
    
    img.src = base64Str;
  });
};

/**
 * Checks if the car already has a visible license plate.
 */
const checkForExistingPlate = async (imageBase64: string): Promise<boolean> => {
  try {
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze the front and rear bumpers of the car in this image. Look specifically for an oblong, rectangular, or square object mounted on the bumper where a license plate is typically found. Is there a license plate present? Answer strictly with YES or NO.",
          },
        ],
      },
    });

    const text = response.text?.trim().toUpperCase() || '';
    return text.includes('YES');
  } catch (e) {
    console.warn("Failed to check for existing plate:", e);
    return false;
  }
};

/**
 * Verifies if the generated image contains the correct plate number.
 */
const verifyPlateContent = async (imageBase64: string, expectedNumber: string): Promise<boolean> => {
  try {
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Read the license plate text from this car. Return ONLY the alphanumeric characters found on the plate. Ignore country names, slogans, or small print.",
          },
        ],
      },
    });

    const ocrText = response.text ? cleanText(response.text) : '';
    const expected = cleanText(expectedNumber);
    
    console.log(`[Verification] Expected: ${expected}, Found: ${ocrText}`);
    
    return ocrText.includes(expected) || (expected.includes(ocrText) && ocrText.length > expected.length * 0.8);
  } catch (e) {
    console.warn("Verification failed, assuming imperfect generation:", e);
    return false;
  }
};

/**
 * Unified function to Add or Replace a plate using text prompts.
 */
export const generatePlate = async (
  imageBase64: string,
  plateNumber: string,
  plateCountry: string,
  mode: 'add' | 'replace',
  onProgress?: (status: string) => void,
  skipDetection: boolean = false
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  if (onProgress) onProgress('Checking image...');
  const processedImage = await preprocessImage(imageBase64);

  // Check for existing plate if in 'add' mode and detection is not skipped
  if (mode === 'add' && !skipDetection) {
    if (onProgress) onProgress('Scanning for existing plates...');
    const hasPlate = await checkForExistingPlate(processedImage);
    if (hasPlate) {
      throw new Error("PLATE_DETECTED_CONFIRMATION");
    }
  }

  const MAX_RETRIES = 4;
  const base64Data = processedImage.split(',')[1];
  const mimeType = processedImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  
  let lastGeneratedImage = '';
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (onProgress) onProgress(attempt > 1 ? `Refining details (Attempt ${attempt}/${MAX_RETRIES})...` : `Generating plate...`);

      let actionPrompt = "";
      if (mode === 'add') {
        actionPrompt = `The car in this image does not have a license plate. Add a realistic ${plateCountry} license plate to the front bumper (or rear bumper if the rear is visible).`;
      } else {
        actionPrompt = `Replace the existing license plate on the car with a realistic ${plateCountry} license plate.`;
      }

      const prompt = `Edit this image. ${actionPrompt}
      The license plate text must be strictly "${plateNumber}". 
      Ensure the text is sharp, legible, and perfectly spelled.
      Maintain the exact perspective, lighting, shadows, and reflection of the original car and bumper. 
      Do not modify any other part of the car or the background. High quality, photorealistic.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let generatedImageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts;

      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break; 
          }
        }
      }

      if (!generatedImageUrl) {
        throw new Error("No image was returned by the model.");
      }

      lastGeneratedImage = generatedImageUrl;

      if (onProgress) onProgress(`Verifying plate text...`);
      const isPerfect = await verifyPlateContent(generatedImageUrl, plateNumber);

      if (isPerfect) {
        return generatedImageUrl;
      } else {
        console.log(`Attempt ${attempt} failed verification. Retrying...`);
      }

    } catch (error: any) {
      console.error(`Attempt ${attempt} error:`, error);
      lastError = error;
    }
  }

  if (lastGeneratedImage) {
    return lastGeneratedImage;
  }

  throw new Error(lastError?.message || "Failed to generate valid image after multiple attempts");
};