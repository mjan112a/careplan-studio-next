'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '../api/prompts/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logging';

interface CategoryNode {
  name: string;
  children: Record<string, CategoryNode>;
  prompts: Prompt[];
}

interface PromptsContentProps {
  userId: string;
  userEmail: string | null;
}

export default function PromptsContent({ userId, userEmail }: PromptsContentProps) {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [categoryTree, setCategoryTree] = useState<Record<string, CategoryNode>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    buildCategoryTree();
  }, [prompts]);

  // Helper function to clean up category values
  function formatCategory(category: any) {
    return {
      primary: String(category.primary || '').trim(),
      secondary: category.secondary?.trim() || null,
      tertiary: category.tertiary?.trim() || null
    };
  }

  // Helper function to normalize Supabase data to our app format
  function normalizePrompt(prompt: Prompt): Prompt {
    // Map snake_case to camelCase for backward compatibility
    return {
      ...prompt,
      promptId: prompt.prompt_id,
      isLatest: prompt.is_latest,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    };
  }

  function createNewPrompt(): Prompt {
    const now = new Date();
    return {
      id: '',
      prompt_id: '',
      version: 0,
      is_latest: true,
      category: { primary: '' },
      title: '',
      template: '',
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId
      },
      created_at: now,
      updated_at: now,
      // For backward compatibility
      promptId: '',
      isLatest: true,
      createdAt: now,
      updatedAt: now
    };
  }

  async function fetchPrompts() {
    try {
      setLoading(true);
      const response = await fetch('/api/prompts');
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const data = await response.json();
      
      // Normalize the data from Supabase format
      const normalizedPrompts = data.map(normalizePrompt);
      
      setPrompts(normalizedPrompts);
    } catch (err) {
      logger.error('Failed to fetch prompts', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function buildCategoryTree() {
    const tree: Record<string, CategoryNode> = {};
    
    prompts.forEach(prompt => {
      const category = prompt.category as { primary: string; secondary?: string; tertiary?: string };
      let current = tree;
      
      // Primary category
      if (!current[category.primary]) {
        current[category.primary] = { name: category.primary, children: {}, prompts: [] };
      }
      
      // If there's a secondary category
      if (category.secondary) {
        if (!current[category.primary].children[category.secondary]) {
          current[category.primary].children[category.secondary] = { 
            name: category.secondary, 
            children: {}, 
            prompts: [] 
          };
        }
        
        // If there's a tertiary category
        if (category.tertiary) {
          if (!current[category.primary].children[category.secondary].children[category.tertiary]) {
            current[category.primary].children[category.secondary].children[category.tertiary] = {
              name: category.tertiary,
              children: {},
              prompts: []
            };
          }
          current[category.primary].children[category.secondary].children[category.tertiary].prompts.push(prompt);
        } else {
          // If no tertiary, add to secondary
          current[category.primary].children[category.secondary].prompts.push(prompt);
        }
      } else {
        // If no secondary, add to primary
        current[category.primary].prompts.push(prompt);
      }
    });
    
    setCategoryTree(tree);
  }

  function toggleCategory(path: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedCategories(newExpanded);
  }

  function renderCategoryNode(node: CategoryNode, path: string = '') {
    const isExpanded = expandedCategories.has(path);
    const hasChildren = Object.keys(node.children).length > 0;
    
    return (
      <div key={path} className="ml-4">
        <div 
          className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
          onClick={() => hasChildren && toggleCategory(path)}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium">{node.name}</span>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {Object.entries(node.children).map(([key, child]) => 
              renderCategoryNode(child, `${path}/${key}`)
            )}
          </div>
        )}
        
        {node.prompts.length > 0 && (
          <div className="ml-4">
            {node.prompts.map(prompt => (
              <div
                key={prompt.id}
                className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
                  selectedPrompt?.id === prompt.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedPrompt(prompt)}
              >
                <span>{prompt.title}</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPrompt(prompt);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(prompt.promptId || prompt.prompt_id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPrompt) return;

    // Make sure category is properly formatted before submission
    const formattedCategory = formatCategory(selectedPrompt.category);

    setIsSubmitting(true);
    try {
      if (selectedPrompt.id !== '') {
        // Updating existing prompt - create new version
        const promptId = selectedPrompt.promptId || selectedPrompt.prompt_id;
        logger.info('Updating prompt', { promptId });
        const response = await fetch(`/api/prompts/${promptId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: formattedCategory, // Use formatted category
            title: selectedPrompt.title.trim(),
            template: selectedPrompt.template,
            metadata: {
              createdBy: selectedPrompt.metadata.createdBy,
              updatedBy: userId,
            }
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update prompt');
        }

        toast({
          title: 'Success',
          description: 'Prompt updated successfully',
        });
      } else {
        // Check if a prompt with same title and category exists
        const existingPrompt = prompts.find(p => 
          p.title.toLowerCase() === selectedPrompt.title.toLowerCase() && 
          JSON.stringify(p.category) === JSON.stringify(formattedCategory)
        );

        if (existingPrompt) {
          toast({
            title: 'Error',
            description: 'A prompt with that name and category already exists',
            variant: 'destructive',
          });
          return;
        }

        // Create completely new prompt
        logger.info('Creating new prompt');
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: formattedCategory, // Use formatted category
            title: selectedPrompt.title.trim(),
            template: selectedPrompt.template,
            metadata: {
              createdBy: userId,
              updatedBy: userId,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create prompt');
        }

        toast({
          title: 'Success',
          description: 'Prompt created successfully',
        });
      }
      // Refresh the data
      fetchPrompts();
      setSelectedPrompt(null);
    } catch (error) {
      logger.error('Failed to save prompt', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save prompt',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(promptId: string) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete prompt');
      }

      toast({
        title: 'Success',
        description: 'Prompt deleted successfully',
      });
      // Refresh the data
      fetchPrompts();
      if (selectedPrompt?.promptId === promptId || selectedPrompt?.prompt_id === promptId) {
        setSelectedPrompt(null);
      }
    } catch (error) {
      logger.error('Failed to delete prompt', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete prompt',
        variant: 'destructive',
      });
    }
  }

  // A prompt is being edited if it has an existing id
  const isEditing = selectedPrompt?.id !== '';

  if (loading) {
    return <div className="p-6 text-center">Loading prompts...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div></div> {/* Empty div for spacing */}
        <Button onClick={() => {
          setSelectedPrompt(createNewPrompt());
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(categoryTree).length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No prompts available
                </div>
              ) : (
                Object.entries(categoryTree).map(([key, node]) => 
                  renderCategoryNode(node, key)
                )
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedPrompt ? (isEditing ? 'Edit Prompt' : 'New Prompt') : 'Prompt Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPrompt ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={selectedPrompt?.title || ''}
                      onChange={(e) => setSelectedPrompt(prev => prev ? {...prev, title: e.target.value} : null)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Primary"
                        value={selectedPrompt?.category.primary || ''}
                        onChange={(e) => setSelectedPrompt(prev => prev ? {
                          ...prev,
                          category: {...prev.category, primary: e.target.value}
                        } : null)}
                        required
                      />
                      <Input
                        placeholder="Secondary"
                        value={selectedPrompt?.category.secondary || ''}
                        onChange={(e) => setSelectedPrompt(prev => prev ? {
                          ...prev,
                          category: {...prev.category, secondary: e.target.value}
                        } : null)}
                      />
                      <Input
                        placeholder="Tertiary"
                        value={selectedPrompt?.category.tertiary || ''}
                        onChange={(e) => setSelectedPrompt(prev => prev ? {
                          ...prev,
                          category: {...prev.category, tertiary: e.target.value}
                        } : null)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Template</label>
                    <Textarea
                      value={selectedPrompt?.template || ''}
                      onChange={(e) => setSelectedPrompt(prev => prev ? {...prev, template: e.target.value} : null)}
                      rows={10}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedPrompt(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a prompt or create a new one
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 