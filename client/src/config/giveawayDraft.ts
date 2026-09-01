import {
  GIVEAWAY_CUSTOMER_TYPES,
  GIVEAWAY_FOLLOW_COPY,
  GIVEAWAY_GARDEN_STATUSES,
  GIVEAWAY_GROWING_OPTIONS,
  GIVEAWAY_SOCIAL_CHANNELS,
  GIVEAWAY_SOURCE,
} from "@shared/giveawayEntries.js";

/**
 * Registration-to-win landing page draft.
 *
 * Keep `acceptingEntries` false until the complete prize, eligibility,
 * official rules, privacy language, delivery limits, and campaign dates
 * have been approved. Server also requires GIVEAWAY_ENTRIES_OPEN=true.
 */
export const GIVEAWAY_DRAFT = {
  acceptingEntries: false,
  source: GIVEAWAY_SOURCE,
  statusLabel: "Draft preview — entries are not being accepted",
  campaignName: "September Big Garden Giveaway",
  eyebrow: "Phoenix fall garden giveaway",
  headline: "Win a complete fall garden.",
  subheadline:
    "A ready-to-grow garden package built around real Soil Seed & Water soil, compost, castings, and mulch.",
  cta: "Preview registration",
  heroImage: "/images/giveaway/complete-fall-garden-hero-v9.png",
  heroImageAlt:
    "Near-ground view of two tall eight-by-four raised beds full of harvest-ready vegetables, with open trellises, four product pallets, and separate raw-mulch and pea-gravel totes",
  prizeHighlights: [
    "Two long 8×4 raised garden beds",
    "Four product pallets plus raw-mulch and pea-gravel totes",
    "Proposed Phoenix-area delivery",
  ],
  supportVisuals: [
    {
      title: "Two full-size beds.",
      caption:
        "Each concept bed uses natural 2×8 lumber, three boards per side, with fabricated metal corner assemblies.",
      image: "/images/giveaway/rectangular-bed-view-v1.png",
      alt: "Straight wide view of two long rectangular raised beds with four product pallets behind them",
      items: [],
    },
    {
      title: "The build and ground prep.",
      caption:
        "The raw-mulch tote and pea-gravel tote are separate. Final supplied quantities remain pending approval.",
      image: "/images/giveaway/two-bed-components-v2.png",
      alt: "Organized raised-bed components with separate raw-mulch and pea-gravel totes, lumber, metal posts, cloth, screws, and dark mulch bags",
      items: [
        "Raw mulch tote",
        "Pea gravel tote",
        "Nature’s Blanket bags",
        "Landscape cloth",
        "2×8 lumber + posts",
        "Assembly hardware",
      ],
    },
  ],
  form: {
    title: "One simple entry.",
    intro: "Fill this out to see how entry will work. Nothing is saved until entries officially open.",
    followCopy: GIVEAWAY_FOLLOW_COPY,
    customerTypes: GIVEAWAY_CUSTOMER_TYPES,
    gardenStatuses: GIVEAWAY_GARDEN_STATUSES,
    growingOptions: GIVEAWAY_GROWING_OPTIONS,
    socialChannels: GIVEAWAY_SOCIAL_CHANNELS,
    emailConsent:
      "Email me if I win and send garden updates about this giveaway. I can unsubscribe any time.",
    rulesConsent:
      "I am 18 or older, this is my only entry for this email, no purchase is necessary, and I can receive a Phoenix-area prize as stated.",
  },
  launchRequirements: [
    "Final prize contents, value, and fulfillment scope",
    "Eligible ages, locations, and any exclusions",
    "Entry opening and closing dates with time zone",
    "Winner selection, notification, and response process",
    "Approved Official Rules and required disclosures",
    "Privacy notice, data retention, and consent language",
    "Delivery area, access limits, and substitution terms",
  ],
} as const;
