/**
 * AI Email Generation Service
 * Uses Anthropic Claude for human-sounding follow-up emails
 *
 * CRITICAL RULES:
 * 1. Only mention website/company info if VERIFIED and available
 * 2. Never send incomplete or placeholder information
 * 3. Always produce a complete, human-sounding email
 * 4. If no context available, fall back to clean generic email
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Segment classification keywords
const SEGMENT_KEYWORDS: Record<string, string[]> = {
  operator: ['compost', 'processor', 'facility', 'operations', 'plant manager', 'composting', 'processing'],
  municipal: ['city', 'county', 'municipal', 'solid waste', 'public works', 'government', 'sustainability officer', 'director'],
  equipment: ['equipment', 'machinery', 'technology', 'systems', 'solutions', 'manufacturing', 'sales rep', 'vendor'],
  policy: ['policy', 'regulatory', 'epa', 'deq', 'environmental', 'advocacy', 'compliance', 'regulator'],
  esg: ['esg', 'sustainability', 'foundation', 'csr', 'corporate', 'impact', 'responsibility'],
  education: ['university', 'college', 'student', 'professor', 'research', 'education', 'academic'],
  farmer_vineyard: ['vineyard', 'winery', 'wine', 'grapes', 'viticulture'],
  farmer_orchard: ['orchard', 'pistachio', 'avocado', 'citrus', 'almond', 'apple', 'peach', 'tree fruit', 'nuts'],
  farmer_general: ['farm', 'agriculture', 'grower', 'ranch', 'crop', 'farmer', 'ag'],
  waste_hauler: ['hauler', 'waste management', 'logistics', 'trucking', 'disposal', 'collection', 'hauling'],
  landscaper: ['landscape', 'nursery', 'garden center', 'horticulture', 'lawn', 'landscaping'],
};

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  website?: string;
}

export interface EmailGenerationInput {
  contact: ContactInfo;
  segment: string;
  event: string;
  contextNotes?: string;
  companyResearch?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  tokensUsed: number;
}

/**
 * Auto-classify contact into a segment based on title and company
 */
export function classifySegment(title: string, company: string): string {
  const searchText = `${title} ${company}`.toLowerCase();

  for (const [segment, keywords] of Object.entries(SEGMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return segment;
      }
    }
  }

  return 'other';
}

/**
 * Fetch and summarize company website
 * Uses Jina Reader API to handle JavaScript-rendered sites
 * Only returns info if actually found - never makes up information
 */
export async function enrichCompany(
  company: string,
  website?: string
): Promise<string | null> {
  if (!website && !company) {
    return null;
  }

  try {
    // If we have a website, try to fetch it
    let websiteContent = '';
    if (website) {
      // Clean up the website URL
      let cleanWebsite = website.trim().toLowerCase();
      // Remove protocol if present for normalization
      cleanWebsite = cleanWebsite.replace(/^https?:\/\//, '');
      // Remove trailing slash
      cleanWebsite = cleanWebsite.replace(/\/$/, '');

      // Use Jina Reader API to get rendered content (handles JS-rendered sites)
      // Free tier: no API key needed, returns markdown
      const jinaUrl = `https://r.jina.ai/https://${cleanWebsite}`;
      console.log('[WebEnrich] Using Jina Reader for:', cleanWebsite);

      try {
        const response = await fetch(jinaUrl, {
          headers: {
            'Accept': 'text/plain',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout for rendering
        });

        console.log('[WebEnrich] Jina response status:', response.status);

        if (response.ok) {
          const content = await response.text();
          console.log('[WebEnrich] Got content length:', content.length);
          // Limit content for API call
          websiteContent = content.substring(0, 4000);

          if (websiteContent.length > 100) {
            console.log('[WebEnrich] Success! Using Jina Reader content');
          }
        }
      } catch (jinaError: any) {
        console.log('[WebEnrich] Jina Reader failed:', jinaError.message);

        // Fallback: try direct fetch and extract meta tags
        const url = `https://${cleanWebsite}`;
        try {
          console.log('[WebEnrich] Fallback: direct fetch for meta tags');
          const directResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000),
          });

          if (directResponse.ok) {
            const html = await directResponse.text();
            // Extract meta description and title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
              || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

            const title = titleMatch?.[1]?.trim() || '';
            const description = descMatch?.[1]?.trim() || '';

            if (title || description) {
              websiteContent = `Company: ${company}\nWebsite title: ${title}\nDescription: ${description}`;
              console.log('[WebEnrich] Extracted meta info:', websiteContent);
            }
          }
        } catch (directError: any) {
          console.log('[WebEnrich] Direct fetch also failed:', directError.message);
        }
      }
    }

    // If we got website content, summarize it
    if (websiteContent.length > 100) {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Summarize this company in 2-3 sentences. Focus on what they DO, not marketing fluff. If you can't determine what they do, say "Unable to determine".

Company: ${company}
Website content: ${websiteContent}

Return ONLY the summary, nothing else.`
        }]
      });

      const summary = (response.content[0] as any).text?.trim();
      if (summary && !summary.toLowerCase().includes('unable to determine')) {
        return summary;
      }
    }

    return null;
  } catch (error) {
    console.error('Error enriching company:', error);
    return null;
  }
}

/**
 * Generate a human-sounding follow-up email
 *
 * CRITICAL: This function MUST produce a complete, professional email
 * that sounds like a real person wrote it. Never sounds robotic or templated.
 */
export async function generateFollowUpEmail(
  input: EmailGenerationInput
): Promise<GeneratedEmail> {
  const { contact, segment, event, contextNotes, companyResearch } = input;

  // Build the prompt with strict rules
  const prompt = `You are Rodo Alvarez from Soil Seed & Water, writing a brief follow-up email after meeting someone at a conference.

ABSOLUTE RULES - FOLLOW EXACTLY:
1. Sound like a REAL PERSON - casual, friendly, like texting a new professional contact
2. Keep it to 3-5 sentences MAX - busy people don't read long emails
3. Use contractions (don't, won't, that's, I'm)
4. NO corporate speak, NO buzzwords, NO "synergy" or "leverage"
5. NO pitching products - this is just a friendly connection
6. End with something soft - a question or "let me know"
7. Sign off as just "Rodo" (not "Rodo Alvarez" or "Best regards")

${companyResearch ? `IMPORTANT - WEBSITE RESEARCH (YOU MUST USE THIS):
I checked out their website and found: ${companyResearch}

You MUST casually mention something specific from this research. Say it like:
- "I was checking out your site and saw [specific thing] - that's pretty cool"
- "Took a peek at [company] and I dig what you're doing with [specific thing]"
- "Saw on your website that [interesting fact] - love that"

Make it sound like you genuinely found something interesting, not like you're flattering them.
Pick ONE specific detail to mention, don't list everything.` : ''}

${contextNotes ? `CONVERSATION NOTES (reference naturally):
${contextNotes}` : ''}

CONTACT:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company || 'Unknown'}
- Title: ${contact.title || 'Unknown'}
- Segment: ${segment}
- Event: ${event}

${!contextNotes && !companyResearch ? `
NOTE: No specific context available. Write a clean, friendly generic email that just says it was nice meeting them and you'd like to stay in touch. Keep it simple and human.
` : ''}

Write ONLY the email body. No subject line. No "Subject:" prefix. No signature block. Just the message.
The email should feel like something a real person would actually send.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const emailBody = (response.content[0] as any).text?.trim();

    // Validate the email - make sure it's not empty or too short
    if (!emailBody || emailBody.length < 50) {
      throw new Error('Generated email too short or empty');
    }

    // Generate subject line
    const subject = `Great meeting you at ${event}, ${contact.firstName}`;

    return {
      subject,
      body: emailBody,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
    };
  } catch (error) {
    console.error('Error generating email:', error);

    // Fallback to a safe, human-sounding default
    const fallbackBody = `Hey ${contact.firstName},

Good meeting you at ${event}. Always cool to connect with people in this space.

Let me know if you ever want to grab coffee and talk shop.

Rodo`;

    return {
      subject: `Great meeting you at ${event}, ${contact.firstName}`,
      body: fallbackBody,
      tokensUsed: 0,
    };
  }
}

/**
 * Validate that an email is complete and ready to send
 */
export function validateEmail(email: GeneratedEmail): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!email.subject || email.subject.length < 10) {
    issues.push('Subject line is missing or too short');
  }

  if (!email.body || email.body.length < 50) {
    issues.push('Email body is missing or too short');
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /\[.*?\]/g,  // [placeholder]
    /\{.*?\}/g,  // {placeholder}
    /INSERT.*?HERE/gi,
    /TODO/gi,
    /PLACEHOLDER/gi,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(email.body)) {
      issues.push('Email contains placeholder text');
      break;
    }
  }

  // Check for incomplete sentences
  if (email.body.includes('...') && email.body.split('...').length > 2) {
    issues.push('Email may have incomplete content');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
