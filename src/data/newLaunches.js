export const newLaunches = [
  {
    id: "nl-001",
    slug: "harbor-one-colombo-03",
    name: "Harbor One",
    city: "Colombo",
    area: "Colombo 03",
    address: "Colombo 03, Sri Lanka",
    position: { lat: 6.9106, lng: 79.8523 },

    status: "Pre-Selling", // keep this fixed for launches
    developer: "Example Developments",
    expectedCompletionYear: 2027,

    floors: 42,
    units: 280,
    unitMix: ["Studio", "1BR", "2BR", "3BR"],

    pricing: {
      fromLkr: 65000000, // optional
      notes: "Early-bird pricing available for select stacks.",
    },

    keyHighlights: [
      "Sea-facing units on higher floors",
      "Rooftop pool + gym",
      "High rental demand location",
    ],

    gallery: [
      "https://YOUR_CDN_OR_S3/new-launches/harbor-one/gallery/1.jpg",
      "https://YOUR_CDN_OR_S3/new-launches/harbor-one/gallery/2.jpg",
      "https://YOUR_CDN_OR_S3/new-launches/harbor-one/gallery/3.jpg",
    ],
    pinImageUrl: "https://YOUR_CDN_OR_S3/new-launches/harbor-one/pins/96.webp",

    brochureUrl: "https://YOUR_CDN_OR_S3/new-launches/harbor-one/brochure.pdf",
    websiteUrl: "https://example.com",

    enquiry: {
      whatsappPrefill:
        "Hi, I’m interested in Harbor One (pre-sale). Please share price list, availability, and payment plan.",
    },
    // add these to each launch item (recommended)
    priceFromLkr: 45000000, // number
    priceToLkr: 85000000, // number (optional)
    bedrooms: [1, 2, 3], // array of ints
    tenure: "Freehold", // "Freehold" | "Leasehold" | etc
    propertyType: "Condominium", // "Condominium" | "Apartment" | "Service Residence" etc
    completionYear: 2029, // number
    coverImageUrl: "https://.../cover.jpg", // use first gallery if not set
  },
  {
    id: "nl-002",
    slug: "city-gardens-rajagiriya",
    name: "City Gardens",
    city: "Colombo",
    area: "Rajagiriya",
    address: "Rajagiriya, Sri Lanka",
    position: { lat: 6.9119, lng: 79.9107 },

    status: "Pre-Selling",
    developer: "Urban Towers PLC",
    expectedCompletionYear: 2028,
    floors: 30,
    units: 220,
    unitMix: ["1BR", "2BR", "3BR"],

    keyHighlights: [
      "Family-focused layout",
      "Better parking ratio",
      "Quieter street",
    ],
    gallery: ["https://YOUR_CDN_OR_S3/new-launches/city-gardens/gallery/1.jpg"],
    pinImageUrl:
      "https://YOUR_CDN_OR_S3/new-launches/city-gardens/pins/96.webp",
    enquiry: {
      whatsappPrefill:
        "Hi, please share the latest pre-sale details for City Gardens.",
    },
    // add these to each launch item (recommended)
    priceFromLkr: 45000000, // number
    priceToLkr: 85000000, // number (optional)
    bedrooms: [1, 2, 3], // array of ints
    tenure: "Freehold", // "Freehold" | "Leasehold" | etc
    propertyType: "Condominium", // "Condominium" | "Apartment" | "Service Residence" etc
    completionYear: 2029, // number
    coverImageUrl: "https://.../cover.jpg", // use first gallery if not set
  },
  {
    id: "nl-003",
    slug: "viman-ja-ela",
    name: "VIMAN Ja-Ela",
    city: "Ja-Ela",
    area: "Ja-Ela",
    address: "525, Colombo-Negombo Road, Ja-Ela",
    position: { lat: 7.060619042508646, lng: 79.89544706847356 },

    status: "Pre-Selling",
    developer: "John Keells Properties",
    expectedCompletionYear: 2028,

    floors: 4,
    units: 418,
    unitMix: ["1BR", "2BR"],

    pricing: {
      fromLkr: 32800000,
      toLkr: 42000000,
      notes: "Unit sizes 800-1000 sqft",
    },

    keyHighlights: [
      "Prime Colombo-Negombo Road location",
      "Comprehensive family amenities",
      "Compact and efficient unit designs",
    ],

    gallery: [
      "https://customer-apps-techhq.s3.eu-west-2.amazonaws.com/mvp-property-search/new-launches/viman/gallery/render-courtyard.webp",
      "https://customer-apps-techhq.s3.eu-west-2.amazonaws.com/mvp-property-search/new-launches/viman/gallery/render-garden.webp",
    ],
    pinImageUrl:
      "https://YOUR_CDN_OR_S3/new-launches/viman-ja-ela/pins/96.webp",

    brochureUrl:
      "https://YOUR_CDN_OR_S3/new-launches/viman-ja-ela/brochure.pdf",
    websiteUrl: "https://johnkeells.com",

    enquiry: {
      whatsappPrefill:
        "Hi, I'm interested in VIMAN Ja-Ela (pre-sale). Please share price list, availability, and payment plan.",
    },

    // recommended fields
    priceFromLkr: 32800000,
    priceToLkr: 42000000,
    bedrooms: [1, 2],
    tenure: "Freehold",
    propertyType: "Condominium",
    completionYear: 2028,
    coverImageUrl:
      "https://customer-apps-techhq.s3.eu-west-2.amazonaws.com/mvp-property-search/new-launches/viman/cover/render-pool-residences.jpg",

    amenities: [
      "Gym",
      "Swimming Pool",
      "Kids Play Area",
      "Club House",
      "Restaurant",
      "Lift",
    ],
  },
];
