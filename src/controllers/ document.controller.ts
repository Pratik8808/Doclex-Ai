import { Request, Response } from "express";
import { PrismaClient, DocumentSource } from "@prisma/client";

import { assignLawyer, getAvailableDocuments, getDocumentById, getMyAssignedDocuments, getReviewQueue } from "../services/document.service";

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



export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
   console.log(req,"This is request")
    const { title } = req.body;
    const userId = req.user.id||null; // from auth middleware

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

//


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
    lawyerId,
    lawyerFeedback: feedback,
  },
});

    return res.status(200).json(updatedDocument);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
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
export const getDocumentDetails = async (req: Request, res: Response) => {
  try {
    const { id  } = req.params;

    const document = await getDocumentById(
      id as string,
      req.user!.id,
      req.user!.role
    );

    return res.status(200).json(document);

  } catch (error: any) {
    return res.status(403).json({
      message: error.message,
    });
  }
};




