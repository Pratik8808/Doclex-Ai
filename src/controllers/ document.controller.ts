import { Request, Response } from "express";
import { PrismaClient, DocumentSource } from "@prisma/client";
// import prisma from "../config/db";
import path from "path";
import fs from "fs";
import { htmlToText } from "html-to-text";
// import {
//   extractTextFromPDF,
//   extractTextFromDocx,
// } from "..";

import { extractTextFromPDF } from "../services/pdf.service";
import { extractTextFromDocx } from "../services/docx.service";
import { extractTextWithOCR } from "../services/ocr.service";
import { isTextValid,cleanText } from "../utills/text.utils";
// import { Request, Response } from "express";
// import fs from "fs";
// import path from "path";

import { assignLawyer, getAvailableDocuments, getDocumentById, getMyAssignedDocuments, getReviewQueue } from "../services/document.service";
import { chatAI, runDummyAIReview } from "../services/ai.service";
import { analyzeWithAI } from "../services/ai.service";

const prisma = new PrismaClient();


export const reviewQueue = async (req: Request, res: Response) => {
  try {
    const documents = await getReviewQueue();

    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const extractJson = (text: string) => {
  try {
  // Direct parse
    return JSON.parse(text);
  } catch (e) {
   
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in LLM response");
  }
};

export const runAIReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

   
    await prisma.document.update({
      where: { id },
      data: { status: "AI_PROCESSING" },
    });

   
    let textContent = document.content || "";

    if (document.filePath) {
      const filePath = path.resolve(document.filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
      }

      textContent = fs.readFileSync(filePath, "utf-8");
    }

  
    const aiResult = await analyzeWithAI(textContent);

    console.log("AI RESULT:", aiResult);

   
    if (
      !aiResult ||
      typeof aiResult.score !== "number" ||
      typeof aiResult.summary !== "string" ||
      !Array.isArray(aiResult.missingFields)
    ) {
      throw new Error("Invalid AI response");
    }

  
    const saved = await prisma.aIResult.create({
      data: {
        documentId: id,
        score: aiResult.score,
        riskLevel: aiResult.riskLevel || "UNKNOWN",
        missingFields: aiResult.missingFields || [],
        summary: aiResult.summary || "",
        decision: "PENDING",
      },
    });

    
    await prisma.document.update({
      where: { id },
      data: { status: "AI_REVIEWED" },
    });

    return res.status(200).json(saved);

  } catch (error: any) {
    console.error("AI Review Error:", error);

   
    await prisma.document.update({
      where: { id },
      data: { status: "DRAFT" },
    });

    return res.status(500).json({
      message: "AI Analysis failed. Try again later.",
    });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
  
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const userId = req.user.id;

    /// if any failed then check again
    const mime = req.file.mimetype;

    const isPDF = mime === "application/pdf";
    const isDocx =
      mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    let fileType = "unknown";
    let plainText = "";

   
    if (isPDF) {
      fileType = "pdf";
      plainText = await extractTextFromPDF(req.file.path);
    } else if (isDocx) {
      fileType = "docx";
      plainText = await extractTextFromDocx(req.file.path);
    } else {
      return res.status(400).json({
        message: "Unsupported file type (only PDF and DOCX allowed)",
      });
    }

    console.log("📄 Extracted text length:", plainText?.length);

   
    if (!isTextValid(plainText)) {
      console.log("⚠️ Extraction failed → running OCR...");
      plainText = await extractTextWithOCR(req.file.path);
    }


    plainText = cleanText(plainText);

  
    if (!plainText || plainText.length < 50) {
      return res.status(400).json({
        message: "Text extraction failed (even after OCR)",
      });
    }
    console.log("Final text preview:", plainText.slice(0, 200));

   
    const document = await prisma.document.create({
      data: {
        title: req.file.originalname,
        filePath: req.file.path,
        fileType,
        plainText,
        source: DocumentSource.UPLOAD,
        userId,
      },
    });

    return res.status(201).json({
      message: "Document uploaded & processed successfully",
      document,
    });

  } catch (error: any) {
    console.error(" Upload error:", error);

    return res.status(500).json({
      message: error.message || "Upload failed",
    });
  }
};
//user create text editor

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const userId = req.user.id;

    
    const plainText = htmlToText(content, {
      wordwrap: false,
    });

    const document = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        content,            // HTML
        plainText,          // CLEAN TEXT
        source: DocumentSource.EDITOR,
        userId,
      },
    });

    return res.status(201).json({
      message: "Draft created",
      document,
    });

  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Create failed",
    });
  }
};


export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // from auth middleware

    const documents = await prisma.document.findMany({
      where: {
        userId: userId,
      },
      include: {
        aiResult: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};




//Lawyer API

export const getDocumentsForReview = async (
  req: Request,
  res: Response
) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        status: "AI_REVIEWED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        aiResult: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//Laywer

export const lawyerDecision = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { decision, feedback } = req.body;
    const lawyerId = req.user.id;

    // 1. Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // 2. Validate Status
    // A lawyer should only be able to submit a decision if they have claimed it (ASSIGNED) 
    // or if it's waiting for them (REVIEW_REQUESTED)
    if (document.status !== "ASSIGNED" && document.status !== "REVIEW_REQUESTED") {
      return res.status(400).json({
        message: "Document is not currently assigned or ready for final review.",
      });
    }

    // 3. Ensure the lawyer submitting is the one who claimed it
    if (document.lawyerId && document.lawyerId !== lawyerId) {
       return res.status(403).json({
         message: "You cannot submit a review for a document assigned to another lawyer.",
       });
    }

    // 4. Validate Decision payload
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return res.status(400).json({
        message: "Invalid decision value. Must be APPROVED or REJECTED.",
      });
    }

    // 5. Update the Document with the Human Lawyer's Review
    // We do NOT create an AIResult here. We update the specific lawyer fields!
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: decision, // Changes overall doc status to APPROVED or REJECTED
        lawyerDecision: decision, // Records the lawyer's specific verdict
        lawyerFeedback: feedback,
        lawyerId: lawyerId, // Just in case it wasn't set during the "Assign" step
        reviewedAt: new Date(), // Stamps exactly when the lawyer finished it
      },
    });

    return res.status(200).json({
      message: "Review submitted successfully",
      document: updatedDocument
    });

  } catch (error: any) {
    console.error("Error submitting lawyer decision:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while saving the review",
    });
  }
};

// api for the lawyer only
export const availableForReview = async (req: Request, res: Response) => {
  try {
    const documents = await getAvailableDocuments();
    res.status(200).json(documents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// api for lawayer only 

export const assignDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await assignLawyer(id as string , req.user!.id);

    res.status(200).json({
      message: "Document assigned successfully",
      document: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};
 
//Get api doucment assigned to the lawyer
export const myAssignedDocuments = async (req: Request, res: Response) => {
  try {
    console.log("This is jwt eck ",req.user);
    const lawyerId = req.user!.id; // from JWT

    const documents = await getMyAssignedDocuments(lawyerId);

    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// for user and lawayer for both

export const chatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const response = await chatAI(message);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error("Chat AI Error:", error);

    return res.status(500).json({
      message: "AI chat failed",
    });
  }
};


// import prisma from "../your-prisma-client-path"; 
export const getDocumentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as { id: string; role: string };

    const document = await prisma.document.findUnique({
      where: { id },
      include: { aiResult: true },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Authorization natr debug lagel
    const isOwner = document.userId === user.id;
    const isAssignedLawyer = document.lawyerId === user.id;
    
    // Allow ANY lawyer to preview the document IF it is waiting in the review queue 
    const isPreviewingQueue = user.role === "LAWYER" && document.status === "REVIEW_REQUESTED"; 

    if (!isOwner && !isAssignedLawyer && !isPreviewingQueue) {
      return res.status(403).json({ message: "Unauthorized to view this document" });
    }

  
    // Removed "MANUAL" - now exclusively using "EDITOR"
    if (document.source === "EDITOR") {
      return res.json({
        ...document,
        contentType: "HTML",
        content: document.content, // html will come from the jodit editor
      });
    }

    if (document.source === "UPLOAD" || document.source === "DRIVE") {
      if (!document.filePath) {
        return res.status(404).json({ message: "File path not found in database" });
      }

      const filePath = path.resolve(document.filePath);

      // Safety check to ensure the file actually exists on the disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Physical file missing on server" });
      }

      return res.sendFile(filePath);
    }

    
    return res.json(document);

  } catch (error) {
    console.error("Error fetching document details:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


