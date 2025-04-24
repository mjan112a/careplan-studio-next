import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

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

// PUT /api/prompts/[promptId] - Update a prompt
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Ensure category is properly formatted
    const category = ensureCategoryFormat(body.category);
    
    // Find the latest version
    const { data: latestPrompt, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_latest', true)
      .single();

    if (error || !latestPrompt) {
      logger.error('Prompt not found', { promptId, error });
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // If title or category changed, check for conflicts
    if (body.title !== latestPrompt.title || JSON.stringify(category) !== JSON.stringify(latestPrompt.category)) {
      // Fetch potentially conflicting prompts without category filter to avoid JSON syntax issues
      const { data: existingPrompts, error: checkError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_latest', true)
        .neq('id', latestPrompt.id) // Exclude current prompt
        .eq('title', body.title);

      if (checkError) {
        logger.error('Error checking for existing prompt', { error: checkError });
        return NextResponse.json({ error: 'Failed to check for existing prompts' }, { status: 500 });
      }

      // Manual check for matching category
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

      // Generate new promptId if title/category changed
      const categoryPath = [
        category.primary,
        category.secondary,
        category.tertiary
      ].filter(Boolean).join('_');
      const promptId = `${categoryPath}_${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      body.prompt_id = promptId;
    } else {
      body.prompt_id = latestPrompt.prompt_id;
    }

    // Create new version
    const now = new Date();
    const { data: newPrompt, error: insertError } = await supabase
      .from('prompts')
      .insert({
        prompt_id: body.prompt_id,
        version: latestPrompt.version + 1,
        is_latest: true,
        category, // Use processed category
        title: body.title,
        template: body.template,
        metadata: {
          ...body.metadata,
          updatedAt: now,
          updatedBy: user.id
        }
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to update prompt', { error: insertError });
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }

    // Mark old version as not latest
    const { error: updateError } = await supabase
      .from('prompts')
      .update({ is_latest: false })
      .eq('id', latestPrompt.id);

    if (updateError) {
      logger.error('Failed to mark old prompt version as not latest', { error: updateError });
      // Continue anyway since we already created the new version
    }

    return NextResponse.json(newPrompt);
  } catch (error) {
    logger.error('Failed to update prompt', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      promptId: 'unknown'
    });
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

// DELETE /api/prompts/[promptId] - Soft delete a prompt
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find all versions of this prompt
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_id', promptId);

    if (error) {
      logger.error('Error fetching prompt versions', { error, promptId });
      return NextResponse.json({ error: 'Failed to fetch prompt versions' }, { status: 500 });
    }

    if (!prompts.length) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Mark all versions as not latest (soft delete)
    const { error: updateError } = await supabase
      .from('prompts')
      .update({ is_latest: false })
      .eq('prompt_id', promptId);

    if (updateError) {
      logger.error('Failed to soft delete prompt', { error: updateError });
      return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete prompt', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      promptId: 'unknown'
    });
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
} 