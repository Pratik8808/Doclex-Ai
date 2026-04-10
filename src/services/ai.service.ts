import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import axios from "axios";

const prisma = new PrismaClient();

const AI_BASE_URL = process.env.AI_BASE_URL!;
const AI_SECRET = process.env.AI_SECRET!;

export const runAIReview = async (documentId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.plainText) {
    throw new Error("No text available for AI analysis");
  }

  if (document.status !== "DRAFT") {
    throw new Error("Document is not eligible for AI review");
  }

  console.log("Sending text to AI...");
  console.log("Thisssssss plain doucment  ",document.plainText); /// debugging mode ,mn


  const aiResponse = await analyzeWithAI(document.plainText);

  const { score, riskLevel, missingFields, summary } = aiResponse;
// necessary the debug here 
  // Save AI result 
  const aiResult = await prisma.aIResult.create({
    data: {
      score,
      riskLevel,
      missingFields,
      summary,
      decision: "PENDING",
      documentId,
    },
  });

  // Update document status
  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "AI_REVIEWED",
    },
  });

  return {
    message: "AI review completed",
    aiResult,
    document: updatedDocument,
  };
};


export const analyzeWithAI = async (text: string) => {
  const res = await axios.post(
    `${AI_BASE_URL}/analyze`,
    { text },
    {
      headers: {
        Authorization: `Bearer ${AI_SECRET}`,
      },
    }
  );

  return res.data;
};

export const chatAI = async (message: string) => {
    console.log("isnisde chat Ai tiwh theader") 
  const res = await axios.post(
  
    `${AI_BASE_URL}/ai/chat`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${AI_SECRET}`,
      },
    }
  );

  return res.data;
};