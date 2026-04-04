import Tesseract from "tesseract.js";

export const extractTextWithOCR = async (filePath: string): Promise<string> => {
  try {
    const result = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return result.data.text || "";
  } catch (error) {
    console.error("OCR error:", error);
    return "";
  }
};