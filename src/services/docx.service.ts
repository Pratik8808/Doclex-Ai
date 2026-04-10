import mammoth from "mammoth";

export const extractTextFromDocx = async (filePath: string): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error) {
    console.error(" DOCX extraction error:", error);
    return "";
  }
};