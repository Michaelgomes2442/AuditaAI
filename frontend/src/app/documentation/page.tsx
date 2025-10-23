'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Rocket, Sparkles, Code, Lightbulb, HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { docSections, DocArticle, DocSection } from '@/lib/docs-content';

export default function DocsSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('getting-started');
  const [selectedArticle, setSelectedArticle] = useState<string>('introduction');

  const iconMap: Record<string, any> = {
    rocket: Rocket,
    sparkles: Sparkles,
    code: Code,
    lightbulb: Lightbulb,
    'help-circle': HelpCircle,
  };

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const results: Array<{ section: DocSection; article: DocArticle; matches: string[] }> = [];

    docSections.forEach((section) => {
      section.articles.forEach((article) => {
        const titleMatch = article.title.toLowerCase().includes(query);
        const contentMatch = article.content.toLowerCase().includes(query);
        const tagMatch = article.tags.some((tag) => tag.toLowerCase().includes(query));

        if (titleMatch || contentMatch || tagMatch) {
          const matches: string[] = [];
          if (titleMatch) matches.push('title');
          if (contentMatch) matches.push('content');
          if (tagMatch) matches.push('tags');

          results.push({ section, article, matches });
        }
      });
    });

    return results;
  }, [searchQuery]);

  const currentSection = docSections.find((s) => s.id === selectedSection);
  const currentArticle = currentSection?.articles.find((a) => a.id === selectedArticle);

  const handleArticleClick = (sectionId: string, articleId: string) => {
    setSelectedSection(sectionId);
    setSelectedArticle(articleId);
    setSearchQuery('');
  };

  // Format markdown-like content for display
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const formatted: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = [];
        } else {
          formatted.push(
            <div key={idx} className="my-4 bg-muted p-4 rounded-lg overflow-x-auto">
              {codeLanguage && (
                <div className="text-xs text-muted-foreground mb-2">{codeLanguage}</div>
              )}
              <pre className="text-sm font-mono">
                <code>{codeContent.join('\n')}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeLanguage = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        formatted.push(
          <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        formatted.push(
          <h2 key={idx} className="text-2xl font-semibold mt-6 mb-3">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        formatted.push(
          <h3 key={idx} className="text-xl font-semibold mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        formatted.push(
          <li key={idx} className="ml-6 mb-1">
            {line.slice(2)}
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        formatted.push(
          <li key={idx} className="ml-6 mb-1 list-decimal">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Bold text
      else if (line.includes('**')) {
        const parts = line.split('**');
        formatted.push(
          <p key={idx} className="mb-3">
            {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
          </p>
        );
      }
      // Inline code
      else if (line.includes('`')) {
        const parts = line.split('`');
        formatted.push(
          <p key={idx} className="mb-3">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {part}
                </code>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // Regular paragraphs
      else if (line.trim()) {
        formatted.push(
          <p key={idx} className="mb-3">
            {line}
          </p>
        );
      }
      // Empty lines
      else {
        formatted.push(<div key={idx} className="h-2" />);
      }
    });

    return formatted;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 overflow-y-auto">
        <div className="p-6 border-b bg-background">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Documentation</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div className="p-4 border-b bg-background">
            <div className="text-sm font-medium mb-2">
              {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {searchResults.slice(0, 10).map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleArticleClick(result.section.id, result.article.id)}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-sm">{result.article.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.section.title} • {result.matches.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {!searchResults && (
          <div className="p-4 space-y-6">
            {docSections.map((section) => {
              const Icon = iconMap[section.icon];
              return (
                <div key={section.id}>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(section.id, article.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedSection === section.id && selectedArticle === article.id
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentArticle ? (
          <div className="max-w-4xl mx-auto p-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <span>{currentSection?.title}</span>
              <ChevronRight className="w-4 h-4" />
              <span>{currentArticle.title}</span>
            </div>

            {/* Article Tags */}
            <div className="flex gap-2 mb-4">
              {currentArticle.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Last Updated */}
            <div className="text-sm text-muted-foreground mb-6">
              Last updated: {new Date(currentArticle.lastUpdated).toLocaleDateString()}
            </div>

            {/* Article Content */}
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {formatContent(currentArticle.content)}
            </article>

            {/* Related Articles */}
            {currentSection && (
              <Card className="mt-12">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Related Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentSection.articles
                      .filter((a) => a.id !== selectedArticle)
                      .slice(0, 4)
                      .map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article.id)}
                          className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors text-left"
                        >
                          <span className="text-sm font-medium">{article.title}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card className="mt-6 bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Need more help?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Can't find what you're looking for? We're here to help!
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Join Discord
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an article to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
