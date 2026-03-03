import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const runDummyAIReview = async (documentId: string) => {
  //
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.filePath) {
    throw new Error("No file attached to document");
  }

  if (document.status !== "DRAFT") {
    throw new Error("Document is not eligible for AI review");
  }

  // 2️⃣ Get absolute file path
  const filePath = path.join(process.cwd(), document.filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error("File not found on server");
  }

  console.log("AI reviewing file:", filePath);

  const fileBuffer = fs.readFileSync(filePath);
  console.log("File size (bytes):", fileBuffer.length);

  // 3️⃣ Dummy AI logic
  const score = Math.floor(Math.random() * 100) + 1;

  const decision = score > 60 ? "LIKELY_VALID" : "NEEDS_ATTENTION";

  const feedback =
    score > 60
      ? "Document structure looks correct."
      : "Some clauses may need legal attention.";

  // 4️⃣ Save AIResult
  const aiResult = await prisma.aIResult.create({
    data: {
      decision,
      score,
      feedback,
      documentId,
    },
  });

  // 5️⃣ Update document status
  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "AI_REVIEWED",
    },
  });

  // 6️⃣ Return combined result
  return {
    message: "AI review completed",
    fileInfo: {
      filePath,
      fileSize: fileBuffer.length,
    },
    aiResult,
    document: updatedDocument,
  };
};