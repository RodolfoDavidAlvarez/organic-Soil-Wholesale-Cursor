/**
 * CRM Analytics API
 * Comprehensive analytics for contacts, email campaigns, and pipeline metrics
 */

import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

router.use(adminAuthMiddleware);

/**
 * GET /api/admin/analytics
 * Returns comprehensive CRM analytics
 */
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { range = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch all contacts in date range for analytics
    const { data: contacts, error: contactsError } = await supabase
      .from("representative_contacts")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (contactsError) throw contactsError;

    // Also fetch all-time contacts for comparison
    const { data: allContacts, error: allError } = await supabase
      .from("representative_contacts")
      .select("*");

    if (allError) throw allError;

    // Calculate metrics
    const analytics = {
      // Overview metrics
      totalContacts: contacts?.length || 0,
      totalAllTime: allContacts?.length || 0,

      // Contacts by status
      byStatus: countBy(contacts, "status"),

      // Contacts by segment
      bySegment: countBy(contacts, "segment"),

      // Contacts by lead source
      byLeadSource: countBy(contacts, "lead_source"),

      // Contacts by partner owner
      byPartnerOwner: countBy(contacts, "partner_owner"),

      // Pipeline metrics
      byPipelineStage: countBy(contacts, "pipeline_stage"),

      // Email metrics
      emailMetrics: calculateEmailMetrics(contacts),

      // Campaign performance (group by lead_source as campaigns)
      campaignPerformance: calculateCampaignPerformance(contacts),

      // Daily trend data
      dailyTrend: calculateDailyTrend(contacts, startDate),

      // Conversion funnel
      conversionFunnel: calculateConversionFunnel(contacts),

      // Top performers
      topSegments: getTopItems(countBy(contacts, "segment"), 5),
      topSources: getTopItems(countBy(contacts, "lead_source"), 5),
    };

    res.json(analytics);
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch analytics" });
  }
});

/**
 * GET /api/admin/analytics/email-campaigns
 * Detailed email campaign analytics
 */
router.get("/email-campaigns", async (req: AdminRequest, res) => {
  try {
    // Get all contacts with email data
    const { data: contacts, error } = await supabase
      .from("representative_contacts")
      .select("*")
      .not("first_email_sent_at", "is", null);

    if (error) throw error;

    // Group by lead_source as campaigns
    const campaigns: Record<string, any> = {};

    (contacts || []).forEach((contact) => {
      const campaign = contact.lead_source || "other";
      if (!campaigns[campaign]) {
        campaigns[campaign] = {
          name: campaign,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          replied: 0,
          contacts: [],
        };
      }

      campaigns[campaign].sent++;
      campaigns[campaign].contacts.push({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        company: contact.company_name,
        status: contact.email_status,
        sentAt: contact.first_email_sent_at,
      });

      // Count by email status
      switch (contact.email_status) {
        case "delivered":
          campaigns[campaign].delivered++;
          break;
        case "opened":
          campaigns[campaign].opened++;
          campaigns[campaign].delivered++; // Opened implies delivered
          break;
        case "clicked":
          campaigns[campaign].clicked++;
          campaigns[campaign].opened++;
          campaigns[campaign].delivered++;
          break;
        case "replied":
          campaigns[campaign].replied++;
          campaigns[campaign].opened++;
          campaigns[campaign].delivered++;
          break;
        case "bounced":
          campaigns[campaign].bounced++;
          break;
      }
    });

    // Calculate rates
    const campaignList = Object.values(campaigns).map((campaign: any) => ({
      ...campaign,
      deliveryRate: campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : "0.0",
      openRate: campaign.delivered > 0 ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : "0.0",
      clickRate: campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : "0.0",
      replyRate: campaign.delivered > 0 ? ((campaign.replied / campaign.delivered) * 100).toFixed(1) : "0.0",
      bounceRate: campaign.sent > 0 ? ((campaign.bounced / campaign.sent) * 100).toFixed(1) : "0.0",
    }));

    res.json({
      campaigns: campaignList.sort((a, b) => b.sent - a.sent),
      totals: {
        totalSent: contacts?.length || 0,
        totalOpened: campaignList.reduce((sum, c) => sum + c.opened, 0),
        totalClicked: campaignList.reduce((sum, c) => sum + c.clicked, 0),
        totalReplied: campaignList.reduce((sum, c) => sum + c.replied, 0),
        totalBounced: campaignList.reduce((sum, c) => sum + c.bounced, 0),
      },
    });
  } catch (error: any) {
    console.error("Email campaigns error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email campaigns" });
  }
});

// Helper functions
function countBy(items: any[] | null, field: string): Record<string, number> {
  if (!items) return {};
  return items.reduce((acc, item) => {
    const key = item[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateEmailMetrics(contacts: any[] | null): any {
  if (!contacts) return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, replied: 0 };

  const emailsSent = contacts.filter((c) => c.first_email_sent_at);
  const metrics = {
    sent: emailsSent.length,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    replied: 0,
    openRate: "0.0",
    clickRate: "0.0",
    replyRate: "0.0",
  };

  emailsSent.forEach((contact) => {
    switch (contact.email_status) {
      case "delivered":
        metrics.delivered++;
        break;
      case "opened":
        metrics.opened++;
        metrics.delivered++;
        break;
      case "clicked":
        metrics.clicked++;
        metrics.opened++;
        metrics.delivered++;
        break;
      case "replied":
        metrics.replied++;
        metrics.opened++;
        metrics.delivered++;
        break;
      case "bounced":
        metrics.bounced++;
        break;
    }
  });

  // Calculate rates
  if (metrics.delivered > 0) {
    metrics.openRate = ((metrics.opened / metrics.delivered) * 100).toFixed(1);
    metrics.replyRate = ((metrics.replied / metrics.delivered) * 100).toFixed(1);
  }
  if (metrics.opened > 0) {
    metrics.clickRate = ((metrics.clicked / metrics.opened) * 100).toFixed(1);
  }

  return metrics;
}

function calculateCampaignPerformance(contacts: any[] | null): any[] {
  if (!contacts) return [];

  const campaigns: Record<string, any> = {};

  contacts.forEach((contact) => {
    const source = contact.lead_source || "other";
    if (!campaigns[source]) {
      campaigns[source] = {
        name: source,
        total: 0,
        emailsSent: 0,
        opened: 0,
        replied: 0,
        converted: 0,
      };
    }

    campaigns[source].total++;
    if (contact.first_email_sent_at) campaigns[source].emailsSent++;
    if (contact.email_status === "opened" || contact.email_status === "clicked" || contact.email_status === "replied") {
      campaigns[source].opened++;
    }
    if (contact.email_status === "replied" || contact.status === "replied") {
      campaigns[source].replied++;
    }
    if (contact.status === "converted" || contact.pipeline_stage === "conversion") {
      campaigns[source].converted++;
    }
  });

  return Object.values(campaigns)
    .map((campaign: any) => ({
      ...campaign,
      openRate: campaign.emailsSent > 0 ? ((campaign.opened / campaign.emailsSent) * 100).toFixed(1) : "0.0",
      conversionRate: campaign.total > 0 ? ((campaign.converted / campaign.total) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.total - a.total);
}

function calculateDailyTrend(contacts: any[] | null, startDate: Date): any[] {
  if (!contacts) return [];

  const dailyCounts: Record<string, { date: string; contacts: number; emails: number }> = {};

  // Initialize all dates in range
  const current = new Date(startDate);
  const end = new Date();
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    dailyCounts[dateStr] = { date: dateStr, contacts: 0, emails: 0 };
    current.setDate(current.getDate() + 1);
  }

  // Count contacts and emails per day
  contacts.forEach((contact) => {
    const dateStr = new Date(contact.created_at).toISOString().split("T")[0];
    if (dailyCounts[dateStr]) {
      dailyCounts[dateStr].contacts++;
      if (contact.first_email_sent_at) {
        dailyCounts[dateStr].emails++;
      }
    }
  });

  return Object.values(dailyCounts).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateConversionFunnel(contacts: any[] | null): any {
  if (!contacts) return { awareness: 0, interest: 0, consideration: 0, conversion: 0 };

  const funnel = {
    awareness: 0,
    interest: 0,
    consideration: 0,
    conversion: 0,
  };

  contacts.forEach((contact) => {
    const stage = contact.pipeline_stage || "awareness";
    switch (stage) {
      case "awareness":
        funnel.awareness++;
        break;
      case "interest":
        funnel.interest++;
        break;
      case "consideration":
        funnel.consideration++;
        break;
      case "conversion":
        funnel.conversion++;
        break;
    }
  });

  return funnel;
}

function getTopItems(counts: Record<string, number>, limit: number): { name: string; count: number }[] {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default router;
