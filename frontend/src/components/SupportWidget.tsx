"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, X, Send, CheckCircle2, Minimize2, Maximize2 } from "lucide-react";

type FeedbackType = "BUG" | "FEATURE" | "IMPROVEMENT" | "QUESTION" | "OTHER";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type: "QUESTION" as FeedbackType,
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          category: "GENERAL",
          priority: formData.type === "BUG" ? "HIGH" : "MEDIUM",
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          type: "QUESTION",
          subject: "",
          message: "",
        });
        setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl z-50 transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Feedback
          </CardTitle>
          <CardDescription className="text-xs">
            We're here to help!
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
              <h3 className="font-semibold text-lg mb-1">Thank you!</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback has been submitted. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="widget-type" className="text-sm">What can we help with?</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: FeedbackType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="widget-type" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUESTION">❓ I have a question</SelectItem>
                    <SelectItem value="BUG">🐛 Report a bug</SelectItem>
                    <SelectItem value="FEATURE">💡 Request a feature</SelectItem>
                    <SelectItem value="IMPROVEMENT">⚡ Suggest improvement</SelectItem>
                    <SelectItem value="OTHER">💬 Something else</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-subject" className="text-sm">Subject</Label>
                <Input
                  id="widget-subject"
                  placeholder="Brief description..."
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-message" className="text-sm">Message</Label>
                <Textarea
                  id="widget-message"
                  placeholder="Tell us more..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  className="text-sm"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-9" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/support";
                  }}
                  className="text-xs text-muted-foreground"
                >
                  View all feedback & support options →
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}
