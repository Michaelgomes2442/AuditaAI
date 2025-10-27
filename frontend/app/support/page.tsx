"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bug, Lightbulb, HelpCircle, AlertCircle, Send, CheckCircle2, Clock, XCircle } from "lucide-react";

type FeedbackType = "BUG" | "FEATURE" | "IMPROVEMENT" | "QUESTION" | "OTHER";
type FeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WONT_FIX";
type FeedbackPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Feedback {
  id: number;
  type: FeedbackType;
  category: string;
  priority: FeedbackPriority;
  subject: string;
  message: string;
  status: FeedbackStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
}

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  IMPROVEMENT: AlertCircle,
  QUESTION: HelpCircle,
  OTHER: MessageSquare,
};

const typeColors = {
  BUG: "text-red-500",
  FEATURE: "text-blue-500",
  IMPROVEMENT: "text-purple-500",
  QUESTION: "text-yellow-500",
  OTHER: "text-gray-500",
};

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  WONT_FIX: "bg-red-100 text-red-800",
};

const priorityColors = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function SupportPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type: "FEATURE" as FeedbackType,
    category: "GENERAL",
    priority: "MEDIUM" as FeedbackPriority,
    subject: "",
    message: "",
  });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch("/api/support/feedback");
      if (response.ok) {
        const data = await response.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          type: "FEATURE",
          category: "GENERAL",
          priority: "MEDIUM",
          subject: "",
          message: "",
        });
        fetchFeedback();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Support & Feedback</h1>
        <p className="text-muted-foreground mt-2">
          We'd love to hear from you. Share your feedback, report bugs, or request new features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit Feedback
            </CardTitle>
            <CardDescription>
              Tell us what you think or report an issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: FeedbackType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUG">🐛 Bug Report</SelectItem>
                      <SelectItem value="FEATURE">💡 Feature Request</SelectItem>
                      <SelectItem value="IMPROVEMENT">⚡ Improvement</SelectItem>
                      <SelectItem value="QUESTION">❓ Question</SelectItem>
                      <SelectItem value="OTHER">💬 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: FeedbackPriority) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UI_UX">UI/UX</SelectItem>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                    <SelectItem value="ACCURACY">Accuracy</SelectItem>
                    <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="BILLING">Billing</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your feedback"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Provide detailed information about your feedback..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  required
                />
              </div>

              {showSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Feedback submitted successfully! We'll review it soon.
                  </span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback History</CardTitle>
              <CardDescription>
                Track the status of your submitted feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {feedbackList.filter((f) => f.status === "OPEN").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {feedbackList.filter((f) => f.status === "IN_PROGRESS").length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {feedbackList.filter((f) => f.status === "RESOLVED").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">
                    {feedbackList.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Need immediate help? Reach out to our team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Live Chat (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@auditaai.com">
                  <Send className="h-4 w-4 mr-2" />
                  Email Support
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/documentation" target="_blank">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  View Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            View and track all your submitted feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback submitted yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              feedbackList.map((feedback) => {
                const Icon = typeIcons[feedback.type];
                return (
                  <div
                    key={feedback.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${typeColors[feedback.type]}`} />
                        <div>
                          <h4 className="font-medium">{feedback.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {feedback.message}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[feedback.status]}>
                        {feedback.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className={priorityColors[feedback.priority]}>
                        {feedback.priority}
                      </Badge>
                      <Badge variant="outline">{feedback.category.replace("_", "/")}</Badge>
                    </div>
                    {feedback.response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Support Response
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">{feedback.response}</p>
                        {feedback.respondedAt && (
                          <p className="text-xs text-blue-600 mt-1">
                            Responded on {new Date(feedback.respondedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
