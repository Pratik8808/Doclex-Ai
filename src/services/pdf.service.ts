import fs from "fs";
import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    return data.text || "";
  } catch (error) {
    console.error("❌ PDF extraction error:", error);
    return "";
  }
};