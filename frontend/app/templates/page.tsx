'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  Star,
  Download,
  Upload,
  Trash2,
  Copy,
  Share2,
  Filter,
  BookOpen,
  MessageSquare,
  FileCode,
  Sparkles,
  Globe,
  Lock,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string;
  userId: number;
  teamId: number | null;
  isPublic: boolean;
  isPredefined: boolean;
  tags: string[];
  config: any;
  sharedWith: number[];
  useCount: number;
  favoriteCount: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Templates', icon: FileText },
  { value: 'chatbot', label: 'Chatbot Testing', icon: MessageSquare },
  { value: 'content-generation', label: 'Content Generation', icon: Sparkles },
  { value: 'data-extraction', label: 'Data Extraction', icon: FileCode },
  { value: 'custom', label: 'Custom', icon: BookOpen },
];

const PREDEFINED_TEMPLATES = [
  {
    name: 'Customer Support Chatbot',
    description: 'Test chatbot responses for customer support scenarios with empathy and accuracy metrics',
    category: 'chatbot',
    tags: ['support', 'customer-service', 'conversation'],
    config: {
      prompts: [
        'How can I reset my password?',
        'What is your refund policy?',
        'My order hasn\'t arrived yet',
      ],
      models: ['gpt-4', 'claude-3-sonnet'],
      temperature: 0.7,
      maxTokens: 500,
      evaluationCriteria: ['helpfulness', 'empathy', 'accuracy', 'clarity'],
    },
  },
  {
    name: 'Blog Post Generator',
    description: 'Generate blog posts with SEO optimization and readability scoring',
    category: 'content-generation',
    tags: ['blog', 'seo', 'content', 'writing'],
    config: {
      prompts: [
        'Write a blog post about AI trends in 2025',
        'Create an SEO-optimized article about sustainable technology',
      ],
      models: ['gpt-4', 'claude-3-opus'],
      temperature: 0.8,
      maxTokens: 2000,
      evaluationCriteria: ['creativity', 'seo-quality', 'readability', 'engagement'],
    },
  },
  {
    name: 'JSON Data Extractor',
    description: 'Extract structured data from unstructured text into JSON format',
    category: 'data-extraction',
    tags: ['json', 'parsing', 'structured-data'],
    config: {
      prompts: [
        'Extract contact information from this email',
        'Parse product details from this listing',
      ],
      models: ['gpt-4-turbo', 'claude-3-haiku'],
      temperature: 0.3,
      maxTokens: 1000,
      evaluationCriteria: ['accuracy', 'completeness', 'format-compliance'],
    },
  },
  {
    name: 'Code Review Assistant',
    description: 'Analyze code for bugs, security issues, and best practices',
    category: 'custom',
    tags: ['code', 'review', 'security', 'quality'],
    config: {
      prompts: [
        'Review this Python function for security vulnerabilities',
        'Suggest improvements for this React component',
      ],
      models: ['gpt-4', 'claude-3-opus'],
      temperature: 0.4,
      maxTokens: 1500,
      evaluationCriteria: ['accuracy', 'thoroughness', 'actionability'],
    },
  },
  {
    name: 'Marketing Copy Tester',
    description: 'Test marketing copy variations for engagement and conversion potential',
    category: 'content-generation',
    tags: ['marketing', 'copywriting', 'conversion'],
    config: {
      prompts: [
        'Create 3 variations of a product headline',
        'Write compelling email subject lines',
      ],
      models: ['gpt-4', 'claude-3-sonnet'],
      temperature: 0.9,
      maxTokens: 300,
      evaluationCriteria: ['persuasiveness', 'clarity', 'uniqueness'],
    },
  },
  {
    name: 'Sentiment Analyzer',
    description: 'Analyze sentiment and emotional tone in customer feedback',
    category: 'data-extraction',
    tags: ['sentiment', 'analysis', 'feedback'],
    config: {
      prompts: [
        'Analyze the sentiment of these product reviews',
        'Determine emotional tone in customer support tickets',
      ],
      models: ['gpt-4-turbo', 'claude-3-haiku'],
      temperature: 0.2,
      maxTokens: 500,
      evaluationCriteria: ['accuracy', 'nuance-detection', 'consistency'],
    },
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'my' | 'public' | 'shared'>('my');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom',
    tags: '',
    isPublic: false,
    config: '{}',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, viewMode]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Apply view mode filter
    if (viewMode === 'my') {
      filtered = filtered.filter(t => !t.isPredefined);
    } else if (viewMode === 'public') {
      filtered = filtered.filter(t => t.isPublic || t.isPredefined);
    } else if (viewMode === 'shared') {
      filtered = filtered.filter(t => t.sharedWith.length > 0);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const createTemplate = async () => {
    try {
      let config;
      try {
        config = JSON.parse(newTemplate.config);
      } catch (e) {
        toast({
          title: 'Invalid Configuration',
          description: 'Config must be valid JSON',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTemplate,
          tags: newTemplate.tags.split(',').map(t => t.trim()).filter(Boolean),
          config,
        }),
      });

      if (!response.ok) throw new Error('Failed to create template');

      const data = await response.json();
      setTemplates([...templates, data.template]);
      setShowCreateDialog(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'custom',
        tags: '',
        isPublic: false,
        config: '{}',
      });

      toast({
        title: 'Template Created',
        description: `${newTemplate.name} has been saved`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setTemplates(templates.filter(t => t.id !== id));
      toast({
        title: 'Template Deleted',
        description: 'Template has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const duplicateTemplate = async (template: TestTemplate) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          tags: template.tags,
          config: template.config,
          isPublic: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate template');

      const data = await response.json();
      setTemplates([...templates, data.template]);

      toast({
        title: 'Template Duplicated',
        description: 'Template has been copied to your library',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const exportTemplate = (template: TestTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Exported',
      description: 'Template downloaded as JSON',
    });
  };

  const importTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: imported.name || 'Imported Template',
          description: imported.description,
          category: imported.category || 'custom',
          tags: imported.tags || [],
          config: imported.config,
          isPublic: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to import template');

      const data = await response.json();
      setTemplates([...templates, data.template]);

      toast({
        title: 'Template Imported',
        description: 'Template has been added to your library',
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Invalid template file',
        variant: 'destructive',
      });
    }

    event.target.value = '';
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    const Icon = cat?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <FileText className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Test Templates</h1>
          <p className="text-muted-foreground mt-1">
            Save, share, and reuse test configurations
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
            id="import-template"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-template')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Test Template</DialogTitle>
                <DialogDescription>
                  Save your test configuration as a reusable template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name*</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Customer Support Bot Test"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="What does this template test?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category*</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={newTemplate.tags}
                      onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                      placeholder="support, chatbot, accuracy"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Configuration (JSON)*</Label>
                  <Textarea
                    value={newTemplate.config}
                    onChange={(e) => setNewTemplate({ ...newTemplate, config: e.target.value })}
                    placeholder='{"prompts": [], "models": [], "temperature": 0.7}'
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newTemplate.isPublic}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Make this template public (visible to all users)
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTemplate} disabled={!newTemplate.name}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>View</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'my' ? 'default' : 'outline'}
                  onClick={() => setViewMode('my')}
                  className="flex-1"
                  size="sm"
                >
                  My Templates
                </Button>
                <Button
                  variant={viewMode === 'public' ? 'default' : 'outline'}
                  onClick={() => setViewMode('public')}
                  className="flex-1"
                  size="sm"
                >
                  Public
                </Button>
                <Button
                  variant={viewMode === 'shared' ? 'default' : 'outline'}
                  onClick={() => setViewMode('shared')}
                  className="flex-1"
                  size="sm"
                >
                  Shared
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => !t.isPredefined).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.isPublic || t.isPredefined).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(templates.map(t => t.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first template to get started'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(template.category)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    {template.isPredefined && (
                      <Badge variant="secondary" className="ml-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        System
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{template.useCount} uses</span>
                    </div>
                    {template.isPublic && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>Public</span>
                      </div>
                    )}
                    {template.sharedWith.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{template.sharedWith.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTemplate(template)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {!template.isPredefined && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
