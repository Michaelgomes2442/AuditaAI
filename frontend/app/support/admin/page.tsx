"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search
} from "lucide-react";

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
  sentiment?: string;
  sentimentScore?: number;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  IMPROVEMENT: AlertCircle,
  QUESTION: HelpCircle,
  OTHER: MessageSquare,
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

const sentimentIcons = {
  positive: TrendingUp,
  neutral: Minus,
  negative: TrendingDown,
};

const sentimentColors = {
  positive: "text-green-500",
  neutral: "text-gray-500",
  negative: "text-red-500",
};

export default function FeedbackAdminPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredList, setFilteredList] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbackList, statusFilter, typeFilter, priorityFilter, searchQuery]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch("/api/support/feedback/admin");
      if (response.ok) {
        const data = await response.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbackList];

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((f) => f.type === typeFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((f) => f.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.subject.toLowerCase().includes(query) ||
          f.message.toLowerCase().includes(query) ||
          f.user?.email.toLowerCase().includes(query)
      );
    }

    setFilteredList(filtered);
  };

  const handleStatusChange = async (feedbackId: number, newStatus: FeedbackStatus) => {
    try {
      const response = await fetch(`/api/support/feedback/admin/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseText) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/support/feedback/admin/${selectedFeedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          response: responseText,
          status: "RESOLVED"
        }),
      });

      if (response.ok) {
        setResponseText("");
        setSelectedFeedback(null);
        fetchFeedback();
      }
    } catch (error) {
      console.error("Failed to submit response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: feedbackList.length,
    open: feedbackList.filter((f) => f.status === "OPEN").length,
    inProgress: feedbackList.filter((f) => f.status === "IN_PROGRESS").length,
    resolved: feedbackList.filter((f) => f.status === "RESOLVED").length,
    bugs: feedbackList.filter((f) => f.type === "BUG").length,
    features: feedbackList.filter((f) => f.type === "FEATURE").length,
    avgSentiment: feedbackList.length > 0
      ? feedbackList.reduce((sum, f) => sum + (f.sentimentScore || 50), 0) / feedbackList.length
      : 50,
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Feedback Management</h1>
        <p className="text-muted-foreground mt-2">
          Review, respond to, and manage user feedback
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Feedback</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <div className="text-3xl font-bold">{stats.open}</div>
              <div className="text-sm text-muted-foreground">Open Items</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bug className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <div className="text-3xl font-bold">{stats.bugs}</div>
              <div className="text-sm text-muted-foreground">Bug Reports</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-3xl font-bold">{stats.avgSentiment.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Avg Sentiment</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="WONT_FIX">Won't Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                  <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
                  <SelectItem value="QUESTION">Question</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Feedback Items ({filteredList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No feedback items found</p>
                </div>
              ) : (
                filteredList.map((feedback) => {
                  const Icon = typeIcons[feedback.type];
                  const SentimentIcon = feedback.sentiment 
                    ? sentimentIcons[feedback.sentiment as keyof typeof sentimentIcons]
                    : null;
                  
                  return (
                    <div
                      key={feedback.id}
                      onClick={() => setSelectedFeedback(feedback)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedFeedback?.id === feedback.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{feedback.subject}</h4>
                              {SentimentIcon && (
                                <SentimentIcon className={`h-4 w-4 ${
                                  sentimentColors[feedback.sentiment as keyof typeof sentimentColors]
                                }`} />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {feedback.message}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge className={statusColors[feedback.status]}>
                          {feedback.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[feedback.priority]}>
                          {feedback.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                        {feedback.user && (
                          <span className="text-xs text-muted-foreground">
                            {feedback.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFeedback ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-medium mt-1">{selectedFeedback.subject}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <p className="text-sm mt-1">{selectedFeedback.message}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={selectedFeedback.status}
                    onValueChange={(value: FeedbackStatus) =>
                      handleStatusChange(selectedFeedback.id, value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="WONT_FIX">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to the user..."
                    rows={6}
                    className="mt-1"
                  />
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={!responseText || isSubmitting}
                    className="w-full mt-2"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Response & Resolve"}
                  </Button>
                </div>

                {selectedFeedback.response && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">Previous Response</Label>
                    <p className="text-sm mt-1">{selectedFeedback.response}</p>
                    {selectedFeedback.respondedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(selectedFeedback.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a feedback item to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
