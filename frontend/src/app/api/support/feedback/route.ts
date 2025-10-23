import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch user's feedback
export async function GET(request: NextRequest) {
  try {
    // In production, get userId from session/auth
    const userId = 1; // Mock user ID

    const feedback = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// POST - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, priority, subject, message, url, userAgent } = body;

    // Validate required fields
    if (!type || !category || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, get userId from session/auth
    const userId = 1; // Mock user ID

    // Simple sentiment analysis (mock - in production use AI/ML service)
    const sentiment = analyzeSentiment(message);

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        category,
        priority: priority || "MEDIUM",
        subject,
        message,
        url,
        userAgent,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        metadata: {
          browser: userAgent ? getBrowserInfo(userAgent) : null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // In production, trigger notifications to support team
    // await notifySupportTeam(feedback);

    return NextResponse.json({ 
      success: true, 
      feedback,
      message: "Feedback submitted successfully"
    });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// Simple sentiment analysis function (mock)
function analyzeSentiment(text: string): { label: string; score: number } {
  const positiveWords = ["great", "excellent", "love", "amazing", "perfect", "awesome", "helpful"];
  const negativeWords = ["bug", "broken", "error", "fail", "issue", "problem", "terrible"];
  
  const lowerText = text.toLowerCase();
  let score = 50; // Neutral baseline
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 10;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 10;
  });
  
  score = Math.max(0, Math.min(100, score));
  
  let label = "neutral";
  if (score >= 60) label = "positive";
  if (score <= 40) label = "negative";
  
  return { label, score };
}

// Extract browser info from user agent
function getBrowserInfo(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown";
}
