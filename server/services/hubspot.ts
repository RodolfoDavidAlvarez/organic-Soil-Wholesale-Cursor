/**
 * HubSpot CRM Integration Service
 * Syncs contacts from CRM Lead Capture to HubSpot
 */

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  website?: string;
  // Custom properties
  lead_source?: string;
  segment?: string;
  notes?: string;
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search for a contact by email
 */
export async function searchContactByEmail(email: string): Promise<HubSpotContact | null> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error('[HubSpot] Missing HUBSPOT_ACCESS_TOKEN');
    return null;
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email.toLowerCase(),
          }],
        }],
        properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle', 'website'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[HubSpot] Search failed:', error);
      return null;
    }

    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error('[HubSpot] Search error:', error);
    return null;
  }
}

/**
 * Create a new contact in HubSpot
 */
export async function createContact(properties: HubSpotContactProperties): Promise<HubSpotContact | null> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error('[HubSpot] Missing HUBSPOT_ACCESS_TOKEN');
    return null;
  }

  try {
    console.log('[HubSpot] Creating contact:', properties.email);

    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: cleanProperties(properties),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[HubSpot] Create failed:', error);
      return null;
    }

    const contact = await response.json();
    console.log('[HubSpot] Contact created:', contact.id);
    return contact;
  } catch (error) {
    console.error('[HubSpot] Create error:', error);
    return null;
  }
}

/**
 * Update an existing contact in HubSpot
 */
export async function updateContact(contactId: string, properties: Partial<HubSpotContactProperties>): Promise<HubSpotContact | null> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error('[HubSpot] Missing HUBSPOT_ACCESS_TOKEN');
    return null;
  }

  try {
    console.log('[HubSpot] Updating contact:', contactId);

    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: cleanProperties(properties),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[HubSpot] Update failed:', error);
      return null;
    }

    const contact = await response.json();
    console.log('[HubSpot] Contact updated:', contact.id);
    return contact;
  } catch (error) {
    console.error('[HubSpot] Update error:', error);
    return null;
  }
}

/**
 * Create or update a contact (upsert)
 * - If contact exists by email, update it
 * - If not, create new contact
 */
export async function createOrUpdateContact(properties: HubSpotContactProperties): Promise<{ contact: HubSpotContact | null; isNew: boolean }> {
  if (!properties.email) {
    console.error('[HubSpot] Email required for upsert');
    return { contact: null, isNew: false };
  }

  // Check if contact exists
  const existing = await searchContactByEmail(properties.email);

  if (existing) {
    // Update existing contact
    const updated = await updateContact(existing.id, properties);
    return { contact: updated, isNew: false };
  } else {
    // Create new contact
    const created = await createContact(properties);
    return { contact: created, isNew: true };
  }
}

/**
 * Sync a CRM lead capture contact to HubSpot
 * Maps CRM fields to HubSpot properties
 */
export async function syncCRMContactToHubSpot(contact: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  segment?: string;
  event?: string;
  notes?: string;
}): Promise<{ success: boolean; hubspotId?: string; isNew?: boolean; error?: string }> {
  if (!contact.email) {
    return { success: false, error: 'Email required' };
  }

  try {
    const properties: HubSpotContactProperties = {
      email: contact.email.toLowerCase(),
      firstname: contact.firstName || undefined,
      lastname: contact.lastName || undefined,
      phone: contact.phone || undefined,
      company: contact.company || undefined,
      jobtitle: contact.title || undefined,
      website: contact.website || undefined,
      lead_source: contact.event || 'CRM Lead Capture',
      segment: contact.segment || undefined,
      notes: contact.notes || undefined,
    };

    const result = await createOrUpdateContact(properties);

    if (result.contact) {
      return {
        success: true,
        hubspotId: result.contact.id,
        isNew: result.isNew,
      };
    } else {
      return { success: false, error: 'Failed to sync to HubSpot' };
    }
  } catch (error: any) {
    console.error('[HubSpot] Sync error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean properties - remove undefined/null values
 */
function cleanProperties(props: Record<string, any>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = String(value);
    }
  }
  return cleaned;
}

/**
 * Test HubSpot connection
 */
export async function testConnection(): Promise<boolean> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.error('[HubSpot] Missing HUBSPOT_ACCESS_TOKEN');
    return false;
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=1`, {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      },
    });

    const isConnected = response.ok;
    console.log('[HubSpot] Connection test:', isConnected ? 'SUCCESS' : 'FAILED');
    return isConnected;
  } catch (error) {
    console.error('[HubSpot] Connection test error:', error);
    return false;
  }
}
