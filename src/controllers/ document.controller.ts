import { Request, Response } from "express";
import { PrismaClient, DocumentSource } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
   console.log(req,"This is request")
    const { title } = req.body;
    const userId = req.user.id; // from auth middleware

    const document = await prisma.document.create({
      data: {
        title:req.file.filename,
        filePath: req.file.path,
        source: DocumentSource.UPLOAD,
        userId,
      },
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Upload failed",
    });
  }
};

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

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.status !== "AI_REVIEWED") {
      return res.status(400).json({
        message: "Document is not ready for lawyer review",
      });
    }

    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return res.status(400).json({
        message: "Invalid decision value",
      });
    }

    // Create AIResult entry for lawyer decision
    await prisma.aIResult.create({
      data: {
        decision: decision,
        feedback: feedback,
        documentId: id,
      },
    });

    // Update document status + assign lawyer
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: decision,
        lawyerId: lawyerId,
      },
    });

    return res.status(200).json(updatedDocument);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
