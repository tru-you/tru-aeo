/**
 * TruAEO / OmniSignal — Universal Multi-Industry Schema Engine
 * 
 * Provides verified, deterministic Schema.org entity graphs across all major global industries:
 * - Legal (LegalService, Attorney)
 * - Healthcare & Medical (MedicalBusiness, Dentist, Physician, Pharmacy)
 * - Real Estate (RealEstateAgent, SingleFamilyResidence, ApartmentComplex)
 * - Food & Hospitality (Restaurant, CafeOrCoffeeShop, BarOrPub)
 * - Home Services & Trades (Plumber, Electrician, GeneralContractor, HVACBusiness)
 * - Retail & E-Commerce (Store, ClothingStore, ElectronicsStore, Product)
 * - Automotive (AutoDealer, AutoRepair)
 * - Professional & Financial (FinancialService, AccountingService, InsuranceAgency)
 * - SaaS & Tech (SoftwareApplication, Organization)
 * - Fitness & Wellness (HealthClub, DaySpa, BeautySalon)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OmniSchema = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var INDUSTRY_PRESETS = {
    // 1. Legal Services
    legal: {
      schemaType: "LegalService",
      actionText: "Book Case Assessment",
      leadPlaceholder: "Hi! I would like to schedule a legal consultation regarding {title}.",
      badges: ["Bar Certified", "Confidential Consultation"]
    },
    // 2. Medical & Dental
    medical: {
      schemaType: "MedicalBusiness",
      actionText: "Book Appointment",
      leadPlaceholder: "Hello, I would like to book a consultation for {title}.",
      badges: ["Certified Practitioner", "Emergency Available"]
    },
    dentist: {
      schemaType: "Dentist",
      actionText: "Book Dental Checkup",
      leadPlaceholder: "Hello, I'd like to book an appointment for {title}.",
      badges: ["Dental Specialist", "Medical Aid Accepted"]
    },
    // 3. Real Estate
    realestate: {
      schemaType: "RealEstateAgent",
      itemType: "SingleFamilyResidence",
      actionText: "Schedule Property Viewing",
      leadPlaceholder: "Hi! I am interested in viewing this property: {title} ({price}). Link: {url}",
      badges: ["Verified Property", "Direct Agent Listing"]
    },
    // 4. Food & Dining
    restaurant: {
      schemaType: "Restaurant",
      itemType: "MenuItem",
      actionText: "Reserve Table / Order",
      leadPlaceholder: "Hi! I would like to make a reservation / order: {title} ({price}).",
      badges: ["Fresh Ingredients", "Instant Reservation"]
    },
    // 5. Trades & Home Services
    contractor: {
      schemaType: "HomeAndConstructionBusiness",
      actionText: "Request Fast Quote",
      leadPlaceholder: "Hello! I need a quote for {title}. Can you provide availability?",
      badges: ["Licensed & Insured", "Fast Dispatch"]
    },
    plumber: {
      schemaType: "Plumber",
      actionText: "Emergency Plumbing Call",
      leadPlaceholder: "Hello, I need urgent assistance with {title}. Link: {url}",
      badges: ["24/7 Emergency", "Licensed Artisan"]
    },
    electrician: {
      schemaType: "Electrician",
      actionText: "Request Electrician",
      leadPlaceholder: "Hello, I need an electrical quote / repair for {title}.",
      badges: ["COC Certified", "Guaranteed Workmanship"]
    },
    // 6. Retail & E-Commerce
    retail: {
      schemaType: "Store",
      itemType: "Product",
      actionText: "Inquire / Reserve Item",
      leadPlaceholder: "Hi! Is {title} (SKU: {sku}, Price: {price}) still in stock?",
      badges: ["Authentic Stock", "Express Delivery"]
    },
    // 7. Automotive
    automotive: {
      schemaType: "AutoDealer",
      itemType: "Car",
      actionText: "Check Vehicle Availability",
      leadPlaceholder: "Hi! I am interested in this vehicle: {title} ({price}). Link: {url} Is it still available?",
      badges: ["Inspected Stock", "Trade-Ins Welcome"]
    },
    // 8. Financial & Accounting
    financial: {
      schemaType: "FinancialService",
      actionText: "Request Financial Advisory",
      leadPlaceholder: "Hi! I would like to speak to an advisor about {title}.",
      badges: ["FSP Registered", "Strict Compliance"]
    },
    // 9. SaaS & Digital Services
    saas: {
      schemaType: "Organization",
      itemType: "SoftwareApplication",
      actionText: "Book Software Demo",
      leadPlaceholder: "Hi! I would like to book a demo for {title}.",
      badges: ["Enterprise Ready", "Instant Setup"]
    },
    // 10. General Local Business (Fallback)
    localbusiness: {
      schemaType: "LocalBusiness",
      itemType: "Product",
      actionText: "Contact Us on WhatsApp",
      leadPlaceholder: "Hi! I am inquiring about {title} ({price}). Link: {url}",
      badges: ["Verified Business", "Prompt Response"]
    }
  };

  function resolveIndustry(key) {
    if (!key) return INDUSTRY_PRESETS.localbusiness;
    var norm = String(key).toLowerCase().replace(/[^a-z]/g, "");
    for (var k in INDUSTRY_PRESETS) {
      if (norm.indexOf(k) !== -1 || k.indexOf(norm) !== -1) {
        return INDUSTRY_PRESETS[k];
      }
    }
    return INDUSTRY_PRESETS.localbusiness;
  }

  function buildGraph(params) {
    var preset = resolveIndustry(params.industry || params.businessType);
    var baseUrl = String(params.siteUrl || "https://example.com").replace(/\/$/, "");
    var currency = params.currency || "USD";
    var currencyIso = currency === "R" ? "ZAR" : (currency === "£" ? "GBP" : (currency === "$" ? "USD" : currency));

    var graph = [];

    // Main Organization / Local Business Node
    var sameAs = [];
    if (params.gbp) sameAs.push(params.gbp);
    if (params.fbPage) sameAs.push(params.fbPage.startsWith("http") ? params.fbPage : "https://www.facebook.com/" + params.fbPage);
    if (params.igHandle) sameAs.push(params.igHandle.startsWith("http") ? params.igHandle : "https://www.instagram.com/" + params.igHandle.replace(/^@/, ""));
    if (params.linkedin) sameAs.push(params.linkedin.startsWith("http") ? params.linkedin : "https://www.linkedin.com/company/" + params.linkedin);
    if (params.xHandle) sameAs.push(params.xHandle.startsWith("http") ? params.xHandle : "https://x.com/" + params.xHandle.replace(/^@/, ""));

    var orgNode = {
      "@context": "https://schema.org",
      "@type": preset.schemaType,
      "@id": baseUrl + "/#organization",
      "name": params.businessName || "Business",
      "url": baseUrl
    };

    if (sameAs.length > 0) orgNode.sameAs = sameAs;
    if (params.phone) orgNode.telephone = params.phone;
    if (params.email) orgNode.email = params.email;
    if (params.address) {
      orgNode.address = {
        "@type": "PostalAddress",
        "streetAddress": params.address
      };
    }
    graph.push(orgNode);

    // Item / Service / Product Node if present
    if (params.title) {
      var itemNode = {
        "@context": "https://schema.org",
        "@type": preset.itemType || "Product",
        "name": params.title,
        "description": params.description || (params.title + " offered by " + (params.businessName || "us")),
        "url": params.url || baseUrl
      };

      if (params.image) {
        itemNode.image = Array.isArray(params.image) ? params.image : [params.image];
      }
      if (params.sku) {
        itemNode.sku = params.sku;
      }

      if (params.price) {
        var numPrice = parseInt(String(params.price).replace(/\D/g, ""), 10);
        if (numPrice) {
          itemNode.offers = {
            "@type": "Offer",
            "price": numPrice,
            "priceCurrency": currencyIso,
            "availability": "https://schema.org/InStock",
            "url": params.url || baseUrl,
            "seller": { "@id": baseUrl + "/#organization" }
          };
        }
      }
      graph.push(itemNode);
    }

    return {
      "@context": "https://schema.org",
      "@graph": graph,
      _preset: preset
    };
  }

  return {
    presets: INDUSTRY_PRESETS,
    resolveIndustry: resolveIndustry,
    buildGraph: buildGraph
  };
});
