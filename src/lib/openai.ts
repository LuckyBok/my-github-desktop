/**
 * Utilities for OpenAI API integration
 */
import { categories, Category } from './categories';

interface GeneratedMetadata {
  summary: string;
  tags: string[];
  suggestedCategoryId?: string;
  categoryReason?: string;
}

/**
 * Generate file metadata using OpenAI API
 * @param fileName The name of the file
 * @param notes Optional notes about the file
 * @returns Generated summary, tags, and suggested category
 */
export async function generateFileMetadata(fileName: string, notes?: string): Promise<GeneratedMetadata> {
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    // Create a string with all category options
    const categoryOptions = categories.map(cat => 
      `${cat.id}: ${cat.name} - ${cat.description}`
    ).join('\n');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates metadata for files and suggests the most appropriate category. Available categories are:
            
${categoryOptions}

Your task is to:
1. Suggest the most appropriate categoryId from the list
2. Generate a short summary of the file
3. Recommend 3 tags related to the file content

Return your response in JSON format with "summary", "tags", "suggestedCategoryId", and "categoryReason" fields.`
          },
          {
            role: 'user',
            content: `File name: ${fileName}${notes ? `\nAdditional notes: ${notes}` : ''}\n\nPlease analyze this file name and notes to suggest the most appropriate category, generate a concise summary (max 100 characters), and provide 3 relevant tags.`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }
    
    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    
    // Verify the suggested category exists
    let suggestedCategoryId = parsedContent.suggestedCategoryId;
    if (suggestedCategoryId && !categories.some(cat => cat.id === suggestedCategoryId)) {
      console.warn(`GPT suggested invalid category: ${suggestedCategoryId}, defaulting to empty`);
      suggestedCategoryId = ''; // Reset to empty if category doesn't exist
    }
    
    return {
      summary: parsedContent.summary || 'No summary available',
      tags: Array.isArray(parsedContent.tags) ? parsedContent.tags.slice(0, 3) : [],
      suggestedCategoryId: suggestedCategoryId || '',
      categoryReason: parsedContent.categoryReason || 'No category suggestion reason available'
    };
    
  } catch (error) {
    console.error('Error generating file metadata:', error);
    // Return default values if API fails
    return {
      summary: 'Summary generation failed',
      tags: []
    };
  }
} 