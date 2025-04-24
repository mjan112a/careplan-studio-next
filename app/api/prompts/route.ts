export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { renderPrompt } from './lib/render';
import { logger } from '@/lib/logging';

// GET /api/prompts - List all latest prompts
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    const replacements = searchParams.get('replacements');

    // If promptId is provided, render the prompt with replacements
    if (promptId) {
      const { data: prompt, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('is_latest', true)
        .single();

      if (error || !prompt) {
        logger.error('Prompt not found', { promptId, error });
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      // Parse replacements if provided
      let parsedReplacements = {};
      if (replacements) {
        try {
          parsedReplacements = JSON.parse(replacements);
        } catch (error) {
          logger.error('Invalid replacements format', { error });
          return NextResponse.json({ error: 'Invalid replacements format' }, { status: 400 });
        }
      }

      // Render the prompt with replacements
      const renderedPrompt = renderPrompt({
        template: prompt.template,
        replacements: parsedReplacements,
        warnOnMissing: true
      });

      return NextResponse.json({
        promptId: prompt.prompt_id,
        title: prompt.title,
        category: prompt.category,
        renderedPrompt
      });
    }

    // Otherwise, return all latest prompts
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_latest', true);

    if (error) {
      logger.error('Failed to fetch prompts', { error });
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }

    return NextResponse.json(prompts);
  } catch (error) {
    logger.error('Error in GET /api/prompts', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// POST /api/prompts - Create a new prompt
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Ensure category is properly formatted as JSON
    const category = ensureCategoryFormat(body.category);
    
    // Check if a prompt with same title and category exists
    // Use simple query first without filtering on category to avoid JSON syntax issues
    const { data: existingPrompts, error: checkError } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_latest', true)
      .eq('title', body.title);
    
    if (checkError) {
      logger.error('Error checking for existing prompt', { error: checkError });
      return NextResponse.json({ error: 'Failed to check for existing prompts' }, { status: 500 });
    }

    // Manual check for matching category after fetching
    const categoryMatch = existingPrompts?.find(prompt => {
      const promptCategory = prompt.category || {};
      return promptCategory.primary?.toLowerCase() === category.primary.toLowerCase();
    });

    if (categoryMatch) {
      return NextResponse.json(
        { error: 'A prompt with that name and category already exists' }, 
        { status: 409 }
      );
    }

    // Generate promptId from category and title
    const categoryPath = [
      category.primary,
      category.secondary,
      category.tertiary
    ].filter(Boolean).join('_');
    const promptId = `${categoryPath}_${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Create new prompt
    const now = new Date();
    const { data: newPrompt, error: insertError } = await supabase
      .from('prompts')
      .insert({
        prompt_id: promptId,
        version: 1,
        is_latest: true,
        category, // Use the processed category
        title: body.title,
        template: body.template,
        metadata: {
          ...body.metadata,
          createdAt: now,
          updatedAt: now,
          createdBy: user.id,
          updatedBy: user.id
        }
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create prompt', { error: insertError });
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }

    return NextResponse.json(newPrompt);
  } catch (error) {
    logger.error('Error in POST /api/prompts', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}

// Ensure the category is properly formatted
function ensureCategoryFormat(category: any) {
  // If it's already a valid object, normalize it
  if (category && typeof category === 'object') {
    return {
      primary: String(category.primary || '').trim(),
      secondary: category.secondary ? String(category.secondary).trim() : null,
      tertiary: category.tertiary ? String(category.tertiary).trim() : null
    };
  }
  
  // If it's a string (should not happen but just in case)
  if (typeof category === 'string') {
    try {
      const parsed = JSON.parse(category);
      return ensureCategoryFormat(parsed);
    } catch (e) {
      // If it's not valid JSON, use it as the primary category
      return { primary: category.trim(), secondary: null, tertiary: null };
    }
  }
  
  // Default empty category
  return { primary: 'Uncategorized', secondary: null, tertiary: null };
}

// PUT /api/prompts/:promptId - Update a prompt
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    
    // Find the latest version
    const { data: latestPrompt, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_latest', true)
      .single();

    if (error || !latestPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // If title or category changed, check for conflicts
    if (body.title !== latestPrompt.title || JSON.stringify(body.category) !== JSON.stringify(latestPrompt.category)) {
      const { data: existingPrompts, error: checkError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_latest', true)
        .neq('id', latestPrompt.id)
        .eq('title', body.title);

      if (checkError) {
        logger.error('Error checking for existing prompt', { error: checkError });
        return NextResponse.json({ error: 'Failed to check for existing prompts' }, { status: 500 });
      }

      // Manual check for matching category
      const categoryMatch = existingPrompts?.find(prompt => {
        const promptCategory = prompt.category || {};
        return promptCategory.primary?.toLowerCase() === body.category.primary.toLowerCase();
      });

      if (categoryMatch) {
        return NextResponse.json(
          { error: 'A prompt with that name and category already exists' }, 
          { status: 409 }
        );
      }

      // Generate new promptId if title/category changed
      const categoryPath = [
        body.category.primary,
        body.category.secondary,
        body.category.tertiary
      ].filter(Boolean).join('_');
      const promptId = `${categoryPath}_${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      body.prompt_id = promptId;
    } else {
      body.prompt_id = latestPrompt.prompt_id;
    }

    // Create new version
    const { data: newPrompt, error: insertError } = await supabase
      .from('prompts')
      .insert({
        prompt_id: body.prompt_id,
        version: latestPrompt.version + 1,
        is_latest: true,
        category: body.category,
        title: body.title,
        template: body.template,
        metadata: {
          ...body.metadata,
          updatedAt: new Date()
        }
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to update prompt', { error: insertError });
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }

    // Mark old version as not latest
    await supabase
      .from('prompts')
      .update({ is_latest: false })
      .eq('id', latestPrompt.id);

    return NextResponse.json(newPrompt);
  } catch (error) {
    logger.error('Error in PUT /api/prompts/:promptId', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

// DELETE /api/prompts/:promptId - Soft delete a prompt
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const supabase = await createServerSupabaseClient();
    // Find all versions of this prompt
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_id', promptId);

    if (error || !prompts.length) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Mark all versions as not latest (soft delete)
    await supabase
      .from('prompts')
      .update({ is_latest: false })
      .eq('prompt_id', promptId);

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /api/prompts/:promptId', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      promptId: 'unknown' // We can't access promptId if params resolving failed
    });
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
} 