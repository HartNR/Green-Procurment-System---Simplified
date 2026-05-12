/**
 * Green Procurement System — simplified static client.
 * Mirrors Prisma models: Supplier, Certification, Purchase, Purchase, GppbCriteria.
 * Default persistence: localStorage.
 * Optional: MySQL-backed API (see README.md).
 */
(function () {
  "use strict";

  // Core app constants and configuration values used throughout the UI.
  const STORAGE_KEY = "gps_simplified_v1";

  // App constants: static descriptions, labels, and configuration used by the UI.
  const PROCUREMENT_DEFINITION =
    "Procurement is the strategic, end-to-end process of sourcing, negotiating, and acquiring goods, services, or works from external sources, typically for business or government purposes. It goes beyond transactional purchasing to ensure quality, cost-efficiency, and supply chain stability.";

  const PROCUREMENT_LOG_SCOPE =
    "This module documents acquisition outcomes—supplier, category, cost, timing, and sustainability signals—so governance and reporting reflect the full procurement lifecycle, not isolated transactions.";

  const SITE_METADATA_DESCRIPTION =
    "Strategic green procurement: sourcing through acquisition, supplier posture, and GPPB-aligned compliance—beyond transactional purchasing alone.";

  const APP_HEADER_TAGLINE =
    "End-to-end procurement view—sourcing, negotiation, acquisition, and compliance—for institutional reporting.";

  const DASHBOARD_INTRO = `${PROCUREMENT_DEFINITION} The metrics below summarise recorded acquisition activity, green spend, and supplier compliance drawn from that pipeline.`;

  const PROCUREMENT_CATEGORIES = [
    { value: "IT", label: "IT" },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
    { value: "FURNITURE", label: "Furniture" },
    { value: "FACILITIES", label: "Facilities" },
    { value: "LAB_EQUIPMENT", label: "Lab Equipment" },
    { value: "OTHER", label: "Other" },
  ];

  const GPPB_GREEN_KEYWORDS = [
    "energy star",
    "fsc certified",
    "recycled content",
    "low voc",
    "eco label",
    "water efficient",
    "led",
    "renewable material",
    "biodegradable",
  ];

  const ITEM_ATTRIBUTE_SUGGESTIONS = [
    { keywords: ["monitor", "display", "screen"], attributes: ["Energy Star", "LED", "Low Power Mode"] },
    { keywords: ["laptop", "notebook computer"], attributes: ["Energy Star", "EPEAT", "Low Power Mode"] },
    { keywords: ["desktop", "system unit", "cpu"], attributes: ["Energy Star", "EPEAT", "Power Management Enabled"] },
    { keywords: ["keyboard", "mouse", "webcam", "headset"], attributes: ["Recyclable Material", "Low Power Mode", "RoHS Compliant"] },
    { keywords: ["projector", "smart tv", "television"], attributes: ["Energy Star", "LED", "Auto Power-Off"] },
    { keywords: ["printer", "multifunction printer"], attributes: ["Energy Star", "Duplex Printing", "Low VOC"] },
    { keywords: ["ink", "toner", "cartridge"], attributes: ["Recycled Content", "Take-Back Program", "Low VOC"] },
    { keywords: ["paper", "bond paper", "notebook paper"], attributes: ["Recycled Content", "FSC Certified"] },
    { keywords: ["pen", "pencil", "marker", "notebook", "folder"], attributes: ["Recycled Content", "Refillable", "Non-Toxic"] },
    { keywords: ["chair", "office chair", "desk"], attributes: ["FSC Certified", "Low VOC", "Recyclable Material"] },
    { keywords: ["cabinet", "table", "shelf"], attributes: ["FSC Certified", "Durable Design", "Low VOC"] },
    { keywords: ["light bulb", "lamp", "lighting"], attributes: ["LED", "Energy Efficient", "Long Lifespan"] },
    { keywords: ["aircon", "air conditioner", "fan", "cooler"], attributes: ["Energy Efficient", "Inverter Technology", "Low Noise"] },
    { keywords: ["water dispenser", "faucet", "toilet", "shower"], attributes: ["Water Efficient", "Low Flow", "Leak Resistant"] },
    { keywords: ["cleaner", "detergent", "disinfectant"], attributes: ["Biodegradable", "Low VOC", "Non-Toxic"] },
    { keywords: ["soap", "sanitizer", "tissue", "trash bag"], attributes: ["Biodegradable", "Recycled Content", "Non-Toxic"] },
    { keywords: ["microscope", "centrifuge", "lab kit", "beaker"], attributes: ["Reusable", "Durable Design", "Low Hazard Materials"] },
  ];

  const CATEGORY_DEFAULT_ATTRIBUTES = {
    IT: ["Energy Efficient", "Low Power Mode", "RoHS Compliant"],
    OFFICE_SUPPLIES: ["Recycled Content", "FSC Certified", "Refillable"],
    FURNITURE: ["FSC Certified", "Low VOC", "Durable Design"],
    FACILITIES: ["Energy Efficient", "Water Efficient", "Low VOC"],
    LAB_EQUIPMENT: ["Reusable", "Durable Design", "Low Hazard Materials"],
    OTHER: ["Recyclable Material", "Low Waste Packaging"],
  };

  // Navigation data: route names, links, and menu labels.
  const NAV = [
    { route: "dashboard", label: "Dashboard", icon: "\u25A3", title: "" },
    { route: "procurement-log", label: "Procurement Log", icon: "\u2630", title: "Strategic procurement outcomes with green compliance" },
    { route: "suppliers", label: "Supplier Profiles", icon: "\u25B6" },
    { route: "modify-data", label: "Modify Data", icon: "\u270E" },
    { route: "gppb-reference", label: "GPPB Reference", icon: "\u2713" },
  ];
  const ROUTE_TO_FILE = {
    "procurement-log": "procurement-log.html",
    dashboard: "index.html",
    suppliers: "suppliers.html",
    "modify-data": "modify-data.html",
    "gppb-reference": "gppb-reference.html",
  };
  const FORCED_ROUTE = window.__FORCE_ROUTE || null;

  const pesoFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  const YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => 2015 + i);

  /** @type {{ suppliers: object[], certifications: object[], purchases: object[], gppbCriteria: object[] }} */
  let state = { suppliers: [], certifications: [], purchases: [], gppbCriteria: [] };

  let dashboardPeriod = { filterType: "month", y: new Date().getUTCFullYear(), m: new Date().getUTCMonth() + 1, from: "", to: "" };

  function generateId() {
    return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getCategoryLabel(v) {
    return PROCUREMENT_CATEGORIES.find((e) => e.value === v)?.label ?? v;
  }

  function categoryFromLabelOrCode(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const exact = PROCUREMENT_CATEGORIES.find((c) => c.value === s);
    if (exact) return exact.value;
    const lower = s.toLowerCase();
    const byLabel = PROCUREMENT_CATEGORIES.find((c) => c.label.toLowerCase() === lower);
    if (byLabel) return byLabel.value;
    // accept loose label contains (e.g. "Office Supplies")
    const loose = PROCUREMENT_CATEGORIES.find((c) => lower.includes(c.label.toLowerCase()));
    return loose ? loose.value : s;
  }

  function checkGPPBCompliance(itemAttributes) {
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const normalizedAttributes = itemAttributes.map((a) => normalize(a)).filter(Boolean);
    const keywords = GPPB_GREEN_KEYWORDS.map((kw) => normalize(kw)).filter(Boolean);
    return normalizedAttributes.some((attr) =>
      keywords.some((kw) => attr.includes(kw) || kw.includes(attr)),
    );
  }

  function getSuggestedAttributesForItem(itemName, category) {
    const normalized = itemName.trim().toLowerCase();
    const categoryFallback = category ? CATEGORY_DEFAULT_ATTRIBUTES[category] ?? [] : [];
    if (!normalized) return categoryFallback.slice();
    const matched = ITEM_ATTRIBUTE_SUGGESTIONS.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword)),
    )?.attributes;
    if (!matched) return categoryFallback.slice();
    return Array.from(new Set([...matched, ...categoryFallback]));
  }

  function suggestedGreenFromAttributes(category, itemAttributes) {
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const activeCriteria = state.gppbCriteria.filter(
      (c) => c.isActive && (c.category === category || c.category === "OTHER"),
    );
    const criteriaKeywords = activeCriteria.map((e) => normalize(e.keyword)).filter(Boolean);
    // Keep built-ins active as a baseline so obvious green attributes are not flagged non-green.
    const fallbackKeywords = GPPB_GREEN_KEYWORDS.map((kw) => normalize(kw)).filter(Boolean);
    const allKeywords = Array.from(new Set([...criteriaKeywords, ...fallbackKeywords]));

    const normalizedAttributes = itemAttributes.map((a) => normalize(a)).filter(Boolean);
    const matchedKeywords = normalizedAttributes.flatMap((attr) =>
      allKeywords.filter((kw) => attr.includes(kw) || kw.includes(attr)),
    );
    const suggested = matchedKeywords.length > 0;
    return { suggested, matchedKeywords };
  }

  function buildClassificationLog(itemAttributes, matchedKeywords, suggested) {
    if (!itemAttributes.length) return "No attributes provided; default classification applied.";
    return `Attributes: ${itemAttributes.join(", ")} | Matched keywords: ${matchedKeywords.length ? matchedKeywords.join(", ") : "none"} | Suggested: ${suggested ? "Green" : "Non-Green"}`;
  }

  function institutionGreenVerdict(spendGreenPct, countGreenPct, hasAcquisitions) {
    if (!hasAcquisitions) {
      return {
        headline: "No acquisition data yet",
        summary: "Log acquisitions in the Procurement Log to produce an institutional GREEN vs NON-GREEN report.",
        tone: "slate",
      };
    }
    const spendOk = spendGreenPct >= 55;
    const spendLow = spendGreenPct <= 45;
    const countOk = countGreenPct >= 55;
    const countLow = countGreenPct <= 45;
    if (spendOk && countOk) {
      return {
        headline: "Institution is predominantly GREEN",
        summary:
          "Both share of spend and share of acquisition records classified as green are above the mid-range—indicating procurement outcomes are broadly aligned with green criteria in this dataset.",
        tone: "green",
      };
    }
    if (spendLow && countLow) {
      return {
        headline: "Institution is predominantly NON-GREEN",
        summary:
          "Both green spend share and the share of green-classified acquisitions are below the mid-range—indicating most recorded outcomes are not meeting green classification in this dataset.",
        tone: "slate",
      };
    }
    return {
      headline: "Mixed GREEN and NON-GREEN profile",
      summary:
        "Spend and acquisition-count signals do not point the same way (e.g. high green spend but fewer green line items, or the reverse). Review categories, suppliers, and attributes in the Procurement Log.",
      tone: "amber",
    };
  }

  function parseYmd(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function addUtcDays(d, days) {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
  }

  function monthLabel(start) {
    return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  }

  function rangeLabel(start, endInclusive) {
    const fmt = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
    return `${fmt.format(start)} \u2013 ${fmt.format(endInclusive)}`;
  }

  function resolveProcurementPeriod() {
    const f = dashboardPeriod.filterType;
    if (f === "overall") {
      return { filterType: "overall", start: new Date(0), endExclusive: new Date(0), label: "Overall" };
    }
    if (f === "range") {
      const start = parseYmd(dashboardPeriod.from);
      const endInclusive = parseYmd(dashboardPeriod.to);
      if (start && endInclusive && endInclusive.getTime() >= start.getTime()) {
        return {
          filterType: "range",
          start,
          endExclusive: addUtcDays(endInclusive, 1),
          label: rangeLabel(start, endInclusive),
        };
      }
    }
    const y = Math.min(2100, Math.max(2000, Number(dashboardPeriod.y) || new Date().getUTCFullYear()));
    const m = Math.min(12, Math.max(1, Number(dashboardPeriod.m) || new Date().getUTCMonth() + 1));
    const start = new Date(Date.UTC(y, m - 1, 1));
    const endExclusive = new Date(Date.UTC(y, m, 1));
    return { filterType: "month", start, endExclusive, label: monthLabel(start) };
  }

  function formatUtcYmd(d) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function endInclusiveFromExclusive(endExclusive) {
    return addUtcDays(endExclusive, -1);
  }

  function currentUtcMonthDefaults() {
    const n = new Date();
    const y = n.getUTCFullYear();
    const m = n.getUTCMonth() + 1;
    const start = new Date(Date.UTC(y, m - 1, 1));
    const endExclusive = new Date(Date.UTC(y, m, 1));
    return {
      y,
      m,
      from: formatUtcYmd(start),
      to: formatUtcYmd(endInclusiveFromExclusive(endExclusive)),
    };
  }

  function purchaseInPeriod(p, period) {
    if (period.filterType === "overall") return true;
    const t = new Date(p.purchaseDate).getTime();
    return t >= period.start.getTime() && t < period.endExclusive.getTime();
  }

  // Persistent state loader: reads saved app state from localStorage
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      state.suppliers = parsed.suppliers || [];
      state.certifications = parsed.certifications || [];
      state.purchases = parsed.purchases || [];
      state.gppbCriteria = parsed.gppbCriteria || [];
      if (parsed.dashboardPeriod) dashboardPeriod = { ...dashboardPeriod, ...parsed.dashboardPeriod };
      return true;
    } catch {
      return false;
    }
  }

  function saveState() {
    const payload = {
      suppliers: state.suppliers,
      certifications: state.certifications,
      purchases: state.purchases,
      gppbCriteria: state.gppbCriteria,
      dashboardPeriod,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  // Demo seed helpers: create default data for initial state when needed
  // localStorage-only (no server)

  function seedGppb() {
    const seeds = [
      ["IT", "energy star", "Energy-efficient electronics"],
      ["IT", "epeat", "EPEAT-registered equipment"],
      ["OFFICE_SUPPLIES", "recycled content", "Post-consumer recycled material"],
      ["OFFICE_SUPPLIES", "fsc", "Forest stewardship chain of custody"],
      ["FURNITURE", "low voc", "Indoor air quality"],
      ["FACILITIES", "led", "Efficient lighting"],
      ["LAB_EQUIPMENT", "reusable", "Durable / reusable lab goods"],
      ["OTHER", "iso 14001", "Environmental management certification"],
    ];
    const t = nowIso();
    state.gppbCriteria = seeds.map(([category, keyword, description]) => ({
      id: generateId(),
      category,
      keyword: keyword.toLowerCase(),
      description,
      isActive: true,
      createdAt: t,
      updatedAt: t,
    }));
  }

  function seedDemo() {
    const t = nowIso();
    const s1 = {
      id: generateId(),
      name: "Eco Office Supplies Inc.",
      contactEmail: "hello@ecooffice.example",
      contactNumber: "+63 2 0000 0000",
      address: "Quezon City",
      complianceNote: "ISO 14001, green packaging policy",
      isCompliant: true,
      createdAt: t,
      updatedAt: t,
    };
    const s2 = {
      id: generateId(),
      name: "Standard Trade Partners",
      contactEmail: null,
      contactNumber: null,
      address: null,
      complianceNote: null,
      isCompliant: false,
      createdAt: t,
      updatedAt: t,
    };
    state.suppliers = [s1, s2];
    state.certifications = [
      {
        id: generateId(),
        supplierId: s1.id,
        title: "ISO 14001",
        fileUrl: "https://example.org/certificates/iso14001.pdf",
        fileType: "application/pdf",
        issuedAt: t,
        expiresAt: null,
        createdAt: t,
        updatedAt: t,
      },
    ];
    const d1 = new Date();
    d1.setUTCDate(15);
    state.purchases = [
      {
        id: generateId(),
        itemName: "Energy Efficient Monitor 24\"",
        category: "IT",
        itemAttributes: ["Energy Star", "LED"],
        supplierId: s1.id,
        cost: "12500.00",
        purchaseDate: d1.toISOString(),
        isGreen: true,
        classificationLog: "",
        createdAt: t,
        updatedAt: t,
      },
      {
        id: generateId(),
        itemName: "Bulk bond paper (reams)",
        category: "OFFICE_SUPPLIES",
        itemAttributes: ["Virgin pulp"],
        supplierId: s2.id,
        cost: "4800.00",
        purchaseDate: d1.toISOString(),
        isGreen: false,
        classificationLog: "",
        createdAt: t,
        updatedAt: t,
      },
    ];
    state.purchases.forEach((p) => {
      const attrs = p.itemAttributes;
      const { suggested, matchedKeywords } = suggestedGreenFromAttributes(p.category, attrs);
      p.isGreen = suggested;
      p.classificationLog = buildClassificationLog(attrs, matchedKeywords, suggested);
    });
    seedGppb();
    saveState();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getRoute() {
    if (FORCED_ROUTE) return FORCED_ROUTE;
    const h = window.location.hash.replace(/^#\/?/, "") || "dashboard";
    const [path] = h.split("?");
    return path || "dashboard";
  }

  function setHash(route) {
    if (FORCED_ROUTE) {
      const target = ROUTE_TO_FILE[route] || ROUTE_TO_FILE["procurement-log"];
      window.location.href = target;
      return;
    }
    window.location.hash = "#/" + route;
  }

  function routeHref(route) {
    if (FORCED_ROUTE) return ROUTE_TO_FILE[route] || ROUTE_TO_FILE["procurement-log"];
    return "#/" + route;
  }

  function supplierById(id) {
    return state.suppliers.find((s) => s.id === id);
  }

  function countCerts(supplierId) {
    return state.certifications.filter((c) => c.supplierId === supplierId).length;
  }

  function countPurchases(supplierId) {
    return state.purchases.filter((p) => p.supplierId === supplierId).length;
  }

  function deleteSupplierCascade(supplierId) {
    state.purchases = state.purchases.filter((p) => p.supplierId !== supplierId);
    state.certifications = state.certifications.filter((c) => c.supplierId !== supplierId);
    state.suppliers = state.suppliers.filter((s) => s.id !== supplierId);
  }

  // Render the circular dashboard donut chart plus outside callouts.
  function svgDonutChart(opts) {
    const {
      id,
      aLabel,
      aValue,
      aColor,
      bLabel,
      bValue,
      bColor,
    } = opts;

    const total = (aValue || 0) + (bValue || 0);
    const aPct = total > 0 ? aValue / total : 0;

    const size = 700;
    const cx = size / 2;
    const cy = size / 2;
    const r = 176;
    const stroke = 68;

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    }

    function describeArc(x, y, radius, startAngle, endAngle) {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    }

    const aEnd = Math.max(0, Math.min(359.999, aPct * 360));
    const aArc = aEnd > 0.0001 ? describeArc(cx, cy, r, 0, aEnd) : "";
    const bArc = aEnd < 359.999 ? describeArc(cx, cy, r, aEnd, 359.999) : "";

    const aPercentText = total > 0 ? `${(aPct * 100).toFixed(1)}%` : "0.0%";
    const bPercentText = total > 0 ? `${((1 - aPct) * 100).toFixed(1)}%` : "0.0%";

    // Use outside callout anchors so label text renders on the left and right outside the donut.
    const aMid = aEnd / 2;
    const bMid = aEnd + (359.999 - aEnd) / 2;

    function makeCallout(angle, side) {
      const pointA = polarToCartesian(cx, cy, r + stroke / 2, angle);
      const pointB = polarToCartesian(cx, cy, r + 60, angle);
      const pointC = polarToCartesian(cx, cy, r + 140, angle);
      const labelY = Math.min(size - 22, Math.max(22, pointC.y));
      const endX = side > 0 ? size - 60 : 60;
      return {
        startX: pointA.x,
        startY: pointA.y,
        midX: pointB.x,
        midY: pointB.y,
        endX,
        endY: labelY,
        labelX: endX + side * 20,
        labelY,
        anchor: side > 0 ? "start" : "end",
      };
    }

    const aCallout = makeCallout(aMid, aMid < 180 ? 1 : -1);
    const bCallout = makeCallout(bMid, bMid < 180 ? 1 : -1);

    return `
      <div class="donut-wrap" data-pie-root="${escapeHtml(id)}">
        <svg class="donut-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(id)} chart" overflow="visible">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(226,232,240,0.7)" stroke-width="${stroke}" />
          ${
            aArc
              ? `<path data-pie-seg="a" data-name="${escapeHtml(aLabel)}" data-value="${escapeHtml(String(aValue))}" data-total="${escapeHtml(String(total))}" data-color="${escapeHtml(aColor)}"
                    d="${aArc}" fill="none" stroke="${escapeHtml(aColor)}" stroke-width="${stroke}" stroke-linecap="butt" />`
              : ""
          }
          ${
            bArc
              ? `<path data-pie-seg="b" data-name="${escapeHtml(bLabel)}" data-value="${escapeHtml(String(bValue))}" data-total="${escapeHtml(String(total))}" data-color="${escapeHtml(bColor)}"
                    d="${bArc}" fill="none" stroke="${escapeHtml(bColor)}" stroke-width="${stroke}" stroke-linecap="butt" />`
              : ""
          }
          <circle cx="${cx}" cy="${cy}" r="${r - stroke / 2}" fill="#fff" />
          ${
            total > 0
              ? `<path class="pie-callout-line" d="M ${aCallout.startX} ${aCallout.startY} L ${aCallout.midX} ${aCallout.midY} L ${aCallout.endX} ${aCallout.endY}" fill="none" />`
              : ""
          }
          ${
            total > 0
              ? `<path class="pie-callout-line" d="M ${bCallout.startX} ${bCallout.startY} L ${bCallout.midX} ${bCallout.midY} L ${bCallout.endX} ${bCallout.endY}" fill="none" />`
              : ""
          }
          ${
            total > 0
              ? `<text x="${aCallout.labelX}" y="${aCallout.labelY - 6}" class="pie-label green" text-anchor="${aCallout.anchor}">${escapeHtml(aLabel)}</text>
                 <text x="${aCallout.labelX}" y="${aCallout.labelY + 50}" class="pie-label-value green" text-anchor="${aCallout.anchor}">${escapeHtml(pesoFormatter.format(aValue))} · ${escapeHtml(aPercentText)}</text>`
              : ""
          }
          ${
            total > 0
              ? `<text x="${bCallout.labelX}" y="${bCallout.labelY - 6}" class="pie-label non" text-anchor="${bCallout.anchor}">${escapeHtml(bLabel)}</text>
                 <text x="${bCallout.labelX}" y="${bCallout.labelY + 50}" class="pie-label-value non" text-anchor="${bCallout.anchor}">${escapeHtml(pesoFormatter.format(bValue))} · ${escapeHtml(bPercentText)}</text>`
              : ""
          }
        </svg>
        <div class="pie-legend">
          <span><i class="swatch" style="background:${escapeHtml(aColor)}"></i>${escapeHtml(aLabel)} ${escapeHtml(aPercentText)}</span>
          <span><i class="swatch" style="background:${escapeHtml(bColor)}"></i>${escapeHtml(bLabel)} ${escapeHtml(bPercentText)}</span>
        </div>
      </div>
    `;
  }

  function ensurePieTooltip() {
    let el = document.getElementById("pie-tooltip");
    if (el) return el;
    el = document.createElement("div");
    el.id = "pie-tooltip";
    el.className = "pie-tooltip";
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }

  function bindPieHover(container) {
    const tooltip = ensurePieTooltip();
    const segs = container.querySelectorAll("[data-pie-seg]");

    function hide() {
      tooltip.style.display = "none";
    }

    function show(ev, seg) {
      const name = seg.getAttribute("data-name") || "";
      const value = Number(seg.getAttribute("data-value") || "0");
      const total = Number(seg.getAttribute("data-total") || "0");
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
      const color = seg.getAttribute("data-color") || "#64748b";

      const kind = container.getAttribute("data-pie-kind") || "";
      const valueLine =
        kind === "spend"
          ? pesoFormatter.format(value)
          : `${value} acquisition(s)`;

      tooltip.innerHTML = `<p class="tt-title"><span style="display:inline-block;width:0.6rem;height:0.6rem;border-radius:2px;background:${escapeHtml(color)};margin-right:0.4rem"></span>${escapeHtml(name)}</p><p class="tt-body">${escapeHtml(valueLine)} · ${escapeHtml(pct)}%</p>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${Math.min(window.innerWidth - 220, ev.clientX + 12)}px`;
      tooltip.style.top = `${Math.min(window.innerHeight - 80, ev.clientY + 12)}px`;
    }

    segs.forEach((seg) => {
      seg.addEventListener("mousemove", (ev) => show(ev, seg));
      seg.addEventListener("mouseenter", (ev) => show(ev, seg));
      seg.addEventListener("mouseleave", hide);
      seg.addEventListener("blur", hide);
    });
  }

  // Navigation rendering: build the sidebar menu for the current route
  function renderNav() {
    const route = getRoute();
    const el = document.getElementById("main-nav");
    el.innerHTML = NAV.map(
      (n) =>
        `<a href="${escapeHtml(routeHref(n.route))}" class="${n.route === route ? "active" : ""}" title="${escapeHtml(n.title || "")}"><span class="nav-emoji">${n.icon}</span>${escapeHtml(n.label)}</a>`,
    ).join("");
  }

  // Dashboard renderer: create the HTML for the main dashboard view
  function renderDashboard() {
    const period = resolveProcurementPeriod();
    const filtered = state.purchases.filter((p) => purchaseInPeriod(p, period));

    let greenSpend = 0;
    let nonGreenSpend = 0;
    let greenCount = 0;
    let nonGreenCount = 0;
    const categorySpend = {};

    filtered.forEach((p) => {
      const cost = Number(p.cost);
      if (p.isGreen) {
        greenSpend += cost;
        greenCount += 1;
      } else {
        nonGreenSpend += cost;
        nonGreenCount += 1;
      }
      categorySpend[p.category] = (categorySpend[p.category] || 0) + cost;
    });

    const totalSpend = greenSpend + nonGreenSpend;
    const totalAcquisitionCount = greenCount + nonGreenCount;
    const spendGreenPct = totalSpend > 0 ? (greenSpend / totalSpend) * 100 : 0;
    const countGreenPct = totalAcquisitionCount > 0 ? (greenCount / totalAcquisitionCount) * 100 : 0;
    const verdict = institutionGreenVerdict(spendGreenPct, countGreenPct, totalAcquisitionCount > 0);

    const verdictClass =
      verdict.tone === "green" ? "tone-green" : verdict.tone === "amber" ? "tone-amber" : "tone-slate";
    const verdictTitleStyle =
      verdict.tone === "green"
        ? "color:var(--emerald-950)"
        : verdict.tone === "amber"
          ? "color:var(--amber-950)"
          : "color:var(--slate-900)";

    const suppliers = state.suppliers;
    const supplierComplianceRate =
      suppliers.length > 0 ? (suppliers.filter((s) => s.isCompliant).length / suppliers.length) * 100 : 0;
    const compliantSuppliers = suppliers.filter((s) => s.isCompliant).length;

    const recent = filtered.slice().sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)).slice(0, 5);

    const categoryGroups = PROCUREMENT_CATEGORIES.map((c) => ({
      ...c,
      sum: categorySpend[c.value] || 0,
    })).filter((g) => g.sum > 0);

    const spendGreenPie = totalSpend > 0 ? greenSpend / totalSpend : 0;
    const countGreenPie = totalAcquisitionCount > 0 ? greenCount / totalAcquisitionCount : 0;

    const periodNote =
      period.filterType === "overall"
        ? "Figures include <strong>all</strong> logged acquisitions—no date filter. Verdict uses the same 55% / 45% bands on green share of spend and of transaction counts."
        : "Figures include only acquisitions with <strong>purchase dates</strong> in the selected period (UTC day boundaries). Verdict uses the same 55% / 45% bands.";

    return `
      <div class="stack">
        <section>
          <h1 class="page-title">Dashboard</h1>
          <p class="lead">${DASHBOARD_INTRO}</p>
        </section>

        <section class="report-panel ${verdictClass}" id="institution-green-report">
          <h2 class="page-title" style="font-size:1rem;margin-bottom:0.25rem">GREEN vs NON-GREEN report
            <span class="lead" style="display:block;margin-top:0.25rem">${escapeHtml(period.label)}</span>
          </h2>
          <div class="report-filter-card mt-4">
            <p class="rf-title">Report period</p>
            <p class="rf-sub">
              By month or a custom UTC date range. Use <span class="rf-strong">Overall</span> below
              to include every acquisition on file.
            </p>

            <fieldset class="rf-types">
              <legend class="sr-only">Period type</legend>
              <label class="rf-radio">
                <input type="radio" name="dashPeriodType" id="dash-type-month" ${dashboardPeriod.filterType === "month" ? "checked" : ""} />
                By month
              </label>
              <label class="rf-radio">
                <input type="radio" name="dashPeriodType" id="dash-type-range" ${dashboardPeriod.filterType === "range" ? "checked" : ""} />
                Date range
              </label>
            </fieldset>

            <div id="dash-fields"></div>

            <div class="rf-actions">
              <button type="button" class="btn btn-dark" id="dash-apply">Apply filter</button>
              <button type="button" class="btn btn-emerald-outline" id="dash-overall">Overall</button>
              <button type="button" class="btn btn-outline" id="dash-reset">Reset to current month</button>
            </div>

            <p class="rf-active">
              Active period: <span class="rf-active-val">${escapeHtml(period.label)}</span>
            </p>

            <p class="hint mt-3">${periodNote}</p>
          </div>
          <p class="mt-3" style="font-size:1.125rem;font-weight:600;margin-bottom:0;${verdictTitleStyle}">${escapeHtml(verdict.headline)}</p>
          <p class="lead tight">${escapeHtml(verdict.summary)}</p>
          ${
            totalSpend <= 0 && totalAcquisitionCount <= 0
              ? `<div class="empty-dashed">No acquisitions in <span class="mono">${escapeHtml(period.label)}</span>. Try another period or log records in the Procurement Log.</div>`
              : `<div class="pie-grid">
              <div class="pie-block card">
                <h3>Procurement amount (PHP)</h3>
                <p class="pie-sub">Total: <strong>${escapeHtml(pesoFormatter.format(totalSpend))}</strong> · Green vs non-green share</p>
                ${
                  totalSpend > 0
                    ? `<div data-pie-kind="spend" data-pie-container>${svgDonutChart({
                        id: "spend",
                        aLabel: "Green",
                        aValue: greenSpend,
                        aColor: "#047857",
                        bLabel: "Non-Green",
                        bValue: nonGreenSpend,
                        bColor: "#64748b",
                      })}</div>`
                    : `<p class="hint">No spend in this period.</p>`
                }
              </div>
              <div class="pie-block card">
                <h3>Transactions</h3>
                <p class="pie-sub">Total: <strong>${totalAcquisitionCount}</strong> acquisitions · Green vs non-green count</p>
                ${
                  totalAcquisitionCount > 0
                    ? `<div data-pie-kind="count" data-pie-container>${svgDonutChart({
                        id: "count",
                        aLabel: "Green",
                        aValue: greenCount,
                        aColor: "#059669",
                        bLabel: "Non-Green",
                        bValue: nonGreenCount,
                        bColor: "#475569",
                      })}</div>`
                    : `<p class="hint">No transactions in this period.</p>`
                }
              </div>
            </div>`
          }
        </section>

        <section class="grid-kpi">
          <div class="kpi">
            <p class="kpi-label">Total acquisition spend</p>
            <p class="kpi-value">${escapeHtml(pesoFormatter.format(totalSpend))}</p>
            <p class="kpi-meta">${totalAcquisitionCount} record(s) in period · ${escapeHtml(period.label)}</p>
          </div>
          <div class="kpi emerald">
            <p class="kpi-label">Green spend (period)</p>
            <p class="kpi-value">${escapeHtml(pesoFormatter.format(greenSpend))}</p>
            <p class="kpi-meta">${totalSpend > 0 ? `${((greenSpend / totalSpend) * 100).toFixed(1)}% of period spend` : "0.0% of period spend"}</p>
          </div>
          <div class="kpi">
            <p class="kpi-label">% green acquisitions</p>
            <p class="kpi-value">${countGreenPct.toFixed(1)}%</p>
            <p class="kpi-meta">${greenCount} of ${totalAcquisitionCount} in period</p>
          </div>
          <div class="kpi">
            <p class="kpi-label">Supplier compliance</p>
            <p class="kpi-value">${supplierComplianceRate.toFixed(1)}%</p>
            <p class="kpi-meta">${compliantSuppliers} compliant of ${suppliers.length} (all suppliers, not filtered by period)</p>
          </div>
        </section>

        <section class="grid-2">
          <div class="card">
            <h2>Spend by category (${escapeHtml(period.label)})</h2>
            <div class="mt-3">
              ${categoryGroups.length === 0 ? `<p class="lead mb-0">No acquisitions in this period.</p>` : categoryGroups.map((g) => `<div class="flex-between" style="border:1px solid var(--slate-200);border-radius:0.5rem;padding:0.5rem 0.75rem;margin-bottom:0.5rem"><span class="text-xs" style="font-size:0.875rem;color:var(--slate-700)">${escapeHtml(g.label)}</span><span style="font-weight:600">${escapeHtml(pesoFormatter.format(g.sum))}</span></div>`).join("")}
            </div>
          </div>
          <div class="card">
            <h2>Recent Acquisition(s)</h2>
            <div class="mt-3">
              ${recent.length === 0 ? `<p class="lead mb-0">No acquisitions in this period.</p>` : recent.map((p) => `<div class="flex-between" style="border:1px solid var(--slate-200);border-radius:0.5rem;padding:0.5rem 0.75rem;margin-bottom:0.5rem"><div><p style="margin:0;font-weight:500;font-size:0.875rem">${escapeHtml(p.itemName)}</p><p class="hint" style="margin:0">${escapeHtml(getCategoryLabel(p.category))} \u2022 ${escapeHtml(new Date(p.purchaseDate).toLocaleDateString("en-PH"))}</p></div><span class="badge ${p.isGreen ? "badge-green" : "badge-slate"}" style="align-self:center">${p.isGreen ? "Green" : "Non-Green"}</span></div>`).join("")}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function bindDashboard() {
    const fields = document.getElementById("dash-fields");
    const monthRadio = document.getElementById("dash-type-month");
    const rangeRadio = document.getElementById("dash-type-range");
    const applyBtn = document.getElementById("dash-apply");
    const overallBtn = document.getElementById("dash-overall");
    const resetBtn = document.getElementById("dash-reset");
    if (!fields || !monthRadio || !rangeRadio || !applyBtn || !overallBtn || !resetBtn) return;

    const dm = currentUtcMonthDefaults();

    let filterType = dashboardPeriod.filterType || "month";
    let y =
      filterType === "month"
        ? dashboardPeriod.y || dm.y
        : filterType === "range"
          ? Number(String(dashboardPeriod.from || dm.from).slice(0, 4))
          : dm.y;
    let m =
      filterType === "month"
        ? dashboardPeriod.m || dm.m
        : filterType === "range"
          ? Number(String(dashboardPeriod.from || dm.from).slice(5, 7))
          : dm.m;
    let from = filterType === "range" ? dashboardPeriod.from || dm.from : dm.from;
    let to = filterType === "range" ? dashboardPeriod.to || dm.to : dm.to;

    function renderFields() {
      if (filterType === "overall") {
        fields.innerHTML = `<p class="rf-none">No date fields—every acquisition in the database is included.</p>`;
        return;
      }
      if (filterType === "month") {
        fields.innerHTML = `
          <div class="rf-row">
            <label class="rf-field">
              <span class="rf-label">Year</span>
              <select id="dash-y">
                ${YEAR_OPTIONS.map((yy) => `<option value="${yy}" ${yy === Number(y) ? "selected" : ""}>${yy}</option>`).join("")}
              </select>
            </label>
            <label class="rf-field">
              <span class="rf-label">Month</span>
              <select id="dash-m" class="rf-month">
                ${MONTHS.map((mo) => `<option value="${mo.value}" ${mo.value === Number(m) ? "selected" : ""}>${escapeHtml(mo.label)}</option>`).join("")}
              </select>
            </label>
          </div>
        `;
        document.getElementById("dash-y")?.addEventListener("change", (e) => {
          y = Number(e.target.value);
        });
        document.getElementById("dash-m")?.addEventListener("change", (e) => {
          m = Number(e.target.value);
        });
        return;
      }

      fields.innerHTML = `
        <div class="rf-row">
          <label class="rf-field">
            <span class="rf-label">From</span>
            <input type="date" id="dash-from" value="${escapeHtml(from)}" />
          </label>
          <label class="rf-field">
            <span class="rf-label">To</span>
            <input type="date" id="dash-to" value="${escapeHtml(to)}" />
          </label>
        </div>
      `;
      document.getElementById("dash-from")?.addEventListener("change", (e) => {
        from = e.target.value;
      });
      document.getElementById("dash-to")?.addEventListener("change", (e) => {
        to = e.target.value;
      });
    }

    monthRadio.checked = filterType === "month";
    rangeRadio.checked = filterType === "range";
    renderFields();

    function apply() {
      if (filterType === "overall") {
        dashboardPeriod = { filterType: "overall", y: dm.y, m: dm.m, from: dm.from, to: dm.to };
      } else if (filterType === "month") {
        dashboardPeriod = { filterType: "month", y: Number(y) || dm.y, m: Number(m) || dm.m, from: dm.from, to: dm.to };
      } else {
        dashboardPeriod = { filterType: "range", y: dm.y, m: dm.m, from: String(from || dm.from), to: String(to || dm.to) };
      }
      saveState();
      render();
    }

    monthRadio.addEventListener("change", () => {
      filterType = "month";
      renderFields();
    });
    rangeRadio.addEventListener("change", () => {
      filterType = "range";
      if (!from || !to) {
        const start = new Date(Date.UTC(y, m - 1, 1));
        const endExclusive = new Date(Date.UTC(y, m, 1));
        from = formatUtcYmd(start);
        to = formatUtcYmd(endInclusiveFromExclusive(endExclusive));
      }
      renderFields();
    });

    applyBtn.addEventListener("click", apply);
    overallBtn.addEventListener("click", () => {
      filterType = "overall";
      renderFields();
      apply();
    });
    resetBtn.addEventListener("click", () => {
      const d = currentUtcMonthDefaults();
      filterType = "month";
      y = d.y;
      m = d.m;
      from = d.from;
      to = d.to;
      renderFields();
      apply();
    });
  }

  function bindDashboardCharts() {
    document.querySelectorAll("[data-pie-container]").forEach((container) => {
      bindPieHover(container);
    });
  }

  // --- continue in part 2: procurement log, suppliers, modify, gppb, router ---

  function renderProcurementLog() {
    const q = (window._procLogQ || "").trim().toLowerCase();
    const purchases = state.purchases
      .filter((p) => {
        if (!q) return true;
        const sup = supplierById(p.supplierId);
        const sn = (sup && sup.name) || "";
        return (
          p.itemName.toLowerCase().includes(q) ||
          sn.toLowerCase().includes(q) ||
          p.itemAttributes.some((a) => a.toLowerCase().includes(q)) ||
          getCategoryLabel(p.category).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      .slice(0, 50);

    const suppliers = state.suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));

    return `
      <div class="stack">
        <section>
          <h1 class="page-title">Procurement Log</h1>
          <p class="lead">${PROCUREMENT_LOG_SCOPE} Use GPPB-aligned criteria when classifying acquisitions.</p>
        </section>

      <section class="card">
          <h2>Import from file</h2>
          <p class="card-desc">
            Speed up acquisition logging after sourcing and negotiation: bulk-load rows from Excel, or scan a receipt image
            to prefill one entry (OCR is approximate—verify cost, date, supplier, and category before saving).
          </p>

          <div class="import-grid">
            <div class="import-subcard">
              <h3>Excel (.xlsx / .xls)</h3>
              <p>
                First row = headers. Required columns: ItemName, Category, SupplierName, Cost, PurchaseDate. Optional:
                ItemAttributes, GreenStatus (AUTO / GREEN / NON_GREEN). Category may be the enum code (e.g. IT) or label
                (e.g. Office Supplies). Supplier name must match an existing profile.
              </p>
              <a href="#" class="link-emerald" id="excel-template-link">Download import template</a>
              <div class="mt-3" style="display:flex;flex-direction:column;gap:0.75rem">
                <input
                  id="excel-file"
                  class="file-input"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                />
                <button type="button" class="btn btn-dark" id="btn-excel-import" ${suppliers.length === 0 ? "disabled" : ""}>
                  Import Excel rows
                </button>
                ${
                  suppliers.length === 0
                    ? `<p class="text-xs" style="color:#be123c;margin:0">Add suppliers first—Excel import needs matching supplier names.</p>`
                    : ""
                }
              </div>
              <div class="result-box" id="excel-result" style="display:${window._excelImportResult ? "block" : "none"}">
                ${
                  window._excelImportResult
                    ? `<p class="title">Imported ${window._excelImportResult.ok} row(s).${
                        window._excelImportResult.errors && window._excelImportResult.errors.length
                          ? ` ${window._excelImportResult.errors.length} issue(s) reported.`
                          : ""
                      }</p>${
                        window._excelImportResult.errors && window._excelImportResult.errors.length
                          ? `<ul>${window._excelImportResult.errors
                              .slice(0, 25)
                              .map((e) => `<li>${escapeHtml(e)}</li>`)
                              .join("")}${
                              window._excelImportResult.errors.length > 25
                                ? `<li>…and ${window._excelImportResult.errors.length - 25} more (list truncated).</li>`
                                : ""
                            }</ul>`
                          : ""
                      }`
                    : ""
                }
              </div>
            </div>

            <div class="import-subcard">
              <h3>Receipt image (OCR)</h3>
              <p>
                Recognition runs in your browser. Results depend on print quality and layout; totals and dates are guessed
                with simple rules.
              </p>
              <div class="mt-3">
                <input id="receipt-file" class="file-input" type="file" accept="image/png,image/jpeg,image/webp" />
              </div>
              <p class="hint mt-3" id="receipt-msg"></p>
              <details class="mt-3 text-xs" id="receipt-details" style="display:none">
                <summary class="hint" style="cursor:pointer;font-weight:500;color:var(--slate-700)">Raw OCR text (preview)</summary>
                <pre class="mt-2 mono" id="receipt-preview" style="max-height:8rem;overflow:auto;white-space:pre-wrap;border:1px solid var(--slate-200);background:#fff;border-radius:0.375rem;padding:0.5rem;color:var(--slate-600)"></pre>
              </details>
            </div>
          </div>
        </section>

        <section class="card">
          <h2>Log an acquisition</h2>
          <p class="card-desc">Supplier must exist in Supplier Profiles. Attributes drive automatic green suggestions.</p>
          <form id="form-purchase" class="stack" style="gap:1rem">
            <div class="form-grid cols-2">
              <label class="block"><span>Item Name</span><input required type="text" name="itemName" id="pl-item" placeholder="Energy Efficient Monitor" /></label>
              <label class="block"><span>Category</span>
                <select required name="category" id="pl-cat"><option value="">Select category</option>${PROCUREMENT_CATEGORIES.map((c) => `<option value="${c.value}">${escapeHtml(c.label)}</option>`).join("")}</select>
              </label>
              <label class="block" style="grid-column:1/-1"><span>Supplier</span>
                <select required name="supplierId" id="pl-sup" ${suppliers.length === 0 ? "disabled" : ""}>
                  <option value="">${suppliers.length === 0 ? "No suppliers yet" : "Select supplier"}</option>
                  ${suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
                </select>
                ${suppliers.length === 0 ? `<span class="hint">Add suppliers in Supplier Profiles first.</span>` : ""}
              </label>
              <label class="block"><span>Cost (PHP)</span><input required name="cost" id="pl-cost" type="number" min="0" step="0.01" /></label>
              <label class="block"><span>Date</span><input required name="purchaseDate" id="pl-date" type="date" max="${new Date().toISOString().slice(0, 10)}" /></label>
            </div>
            <label class="block"><span>Item Attributes (comma-separated)</span><input name="itemAttributes" id="pl-attr" placeholder="Energy Star, Recycled Content" /></label>
            <p class="hint" id="pl-suggest-attr-wrap" style="display:none"></p>
            <div class="suggest-box" id="pl-suggest-green"></div>
            <fieldset class="plain">
              <legend>Final Green Status</legend>
              <p class="hint">Auto uses active GPPB keywords for this category (and Other), else built-in keyword list.</p>
              <div class="radio-row">
                <label><input type="radio" name="greenStatus" value="AUTO" checked /> Auto (use suggestion)</label>
                <label><input type="radio" name="greenStatus" value="GREEN" /> Force Green</label>
                <label><input type="radio" name="greenStatus" value="NON_GREEN" /> Force Non-Green</label>
              </div>
            </fieldset>
            <div class="final-box" id="pl-final"></div>
            <p class="msg-error" id="pl-err"></p>
            <p class="msg-success" id="pl-ok"></p>
            <button type="submit" class="btn btn-primary" ${suppliers.length === 0 ? "disabled" : ""}>Log acquisition</button>
          </form>
        </section>

        <section class="card">
          <div class="flex-between" style="gap:1rem;flex-wrap:wrap;align-items:center;">
            <h2 class="mb-0">Acquisition register</h2>
            <form id="form-search-pl" style="width:100%;max-width:20rem">
              <input type="search" name="q" placeholder="Search item, supplier, attribute..." value="${escapeHtml(window._procLogQ || "")}" />
            </form>
          </div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>Item</th><th>Category</th><th>Supplier</th><th>Cost</th><th>Date</th><th>Green Status</th><th>Attributes</th></tr></thead>
              <tbody>
                ${purchases.length === 0 ? `<tr><td colspan="7" class="hint">No acquisition records found.</td></tr>` : purchases.map((p) => {
                  const sup = supplierById(p.supplierId);
                  return `<tr><td>${escapeHtml(p.itemName)}</td><td>${escapeHtml(getCategoryLabel(p.category))}</td><td>${escapeHtml(sup ? sup.name : "?")}</td><td>${escapeHtml(pesoFormatter.format(Number(p.cost)))}</td><td>${escapeHtml(new Date(p.purchaseDate).toLocaleDateString("en-PH"))}</td><td><span class="badge ${p.isGreen ? "badge-green" : "badge-slate"}">${p.isGreen ? "Green" : "Non-Green"}</span></td><td>${p.itemAttributes.length ? escapeHtml(p.itemAttributes.join(", ")) : "-"}</td></tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
            <button type="button" id="btn-export-excel" class="btn btn-outline">Export to Excel</button>
          </div>
        </section>
      </div>
    `;
  }

  function bindProcurementLog() {
    const form = document.getElementById("form-purchase");
    const item = document.getElementById("pl-item");
    const cat = document.getElementById("pl-cat");
    const attr = document.getElementById("pl-attr");
    const suggestWrap = document.getElementById("pl-suggest-attr-wrap");
    const suggestGreen = document.getElementById("pl-suggest-green");
    const finalEl = document.getElementById("pl-final");
    let attrManual = false;

    function attrList() {
      return attr.value.split(",").map((x) => x.trim()).filter(Boolean);
    }

    function refreshSuggestion() {
      const list = attrList();
      const { suggested } = suggestedGreenFromAttributes(cat.value || "OTHER", list);
      suggestGreen.textContent = `Suggested classification: ${suggested ? "Green" : "Non-Green"}`;
      const mode = form.querySelector('input[name="greenStatus"]:checked').value;
      const final =
        mode === "GREEN" ? true : mode === "NON_GREEN" ? false : suggested;
      finalEl.innerHTML = `Final status to save: <strong>${final ? "Green" : "Non-Green"}</strong> <span class="hint">(${mode === "AUTO" ? "Auto mode" : "Manual override"})</span>`;
    }

    function maybeAutoAttributes() {
      if (attrManual) return;
      const sug = getSuggestedAttributesForItem(item.value, cat.value);
      if (sug.length) {
        attr.value = sug.join(", ");
        suggestWrap.style.display = "block";
        suggestWrap.innerHTML = `Suggested: ${sug.map(escapeHtml).join(", ")} <button type="button" class="btn btn-sm btn-outline" id="btn-use-sug">Use suggested</button>`;
        document.getElementById("btn-use-sug")?.addEventListener("click", () => {
          attrManual = false;
          maybeAutoAttributes();
          refreshSuggestion();
        });
      } else {
        suggestWrap.style.display = "none";
      }
    }

    item?.addEventListener("input", () => {
      maybeAutoAttributes();
      refreshSuggestion();
    });
    cat?.addEventListener("change", () => {
      maybeAutoAttributes();
      refreshSuggestion();
    });
    attr?.addEventListener("input", () => {
      attrManual = true;
      refreshSuggestion();
    });
    form?.querySelectorAll('input[name="greenStatus"]').forEach((r) => r.addEventListener("change", refreshSuggestion));

    maybeAutoAttributes();
    refreshSuggestion();

    form?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      document.getElementById("pl-err").textContent = "";
      document.getElementById("pl-ok").textContent = "";
      const fd = new FormData(form);
      const itemName = String(fd.get("itemName") || "").trim();
      const category = String(fd.get("category") || "").trim();
      const supplierId = String(fd.get("supplierId") || "").trim();
      const cost = Number(fd.get("cost"));
      const purchaseDate = new Date(String(fd.get("purchaseDate")));
      const itemAttributes = String(fd.get("itemAttributes") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const greenStatus = String(fd.get("greenStatus") || "AUTO");
      if (!itemName || !category || !supplierId || !Number.isFinite(cost) || cost < 0 || Number.isNaN(purchaseDate.getTime())) {
        document.getElementById("pl-err").textContent = "Please complete all required fields.";
        return;
      }
      if (!supplierById(supplierId)) {
        document.getElementById("pl-err").textContent = "Invalid supplier.";
        return;
      }
      const { suggested, matchedKeywords } = suggestedGreenFromAttributes(category, itemAttributes);
      const isGreen = greenStatus === "GREEN" ? true : greenStatus === "NON_GREEN" ? false : suggested;
      const t = nowIso();
      state.purchases.unshift({
        id: generateId(),
        itemName,
        category,
        itemAttributes,
        supplierId,
        cost: cost.toFixed(2),
        purchaseDate: purchaseDate.toISOString(),
        isGreen,
        classificationLog: buildClassificationLog(itemAttributes, matchedKeywords, suggested),
        createdAt: t,
        updatedAt: t,
      });
      saveState();
      document.getElementById("pl-ok").textContent = "Acquisition record saved.";
      form.reset();
      attrManual = false;
      render();
    });

    document.getElementById("form-search-pl")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      window._procLogQ = String(fd.get("q") || "");
      render();
    });

    function normalizeHeader(h) {
      return String(h || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
    }

    function excelCol(headerMap, ...names) {
      for (const name of names) {
        const k = headerMap[normalizeHeader(name)];
        if (k) return k;
      }
      return null;
    }

    function parseExcelDate(value) {
      if (!value) return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
      if (typeof value === "number" && window.XLSX?.SSF?.parse_date_code) {
        const d = window.XLSX.SSF.parse_date_code(value);
        if (d && d.y && d.m && d.d) return new Date(Date.UTC(d.y, d.m - 1, d.d));
      }
      const s = String(value).trim();
      if (!s) return null;
      const dt = new Date(s);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    function getProcurementLogExportRows() {
      const q = (window._procLogQ || "").trim().toLowerCase();
      return state.purchases
        .filter((p) => {
          if (!q) return true;
          const sup = supplierById(p.supplierId);
          const sn = (sup && sup.name) || "";
          return (
            p.itemName.toLowerCase().includes(q) ||
            sn.toLowerCase().includes(q) ||
            p.itemAttributes.some((a) => a.toLowerCase().includes(q)) ||
            getCategoryLabel(p.category).toLowerCase().includes(q)
          );
        })
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    }

    document.getElementById("btn-export-excel")?.addEventListener("click", () => {
      if (!window.XLSX) {
        alert("Excel export requires the XLSX library. Please reload the page if the library has not loaded.");
        return;
      }
      const rows = getProcurementLogExportRows();
      const headers = ["Item", "Category", "Supplier", "Cost", "Date", "Green Status", "Attributes"];
      const data = rows.map((p) => {
        const supplier = supplierById(p.supplierId);
        return [
          p.itemName,
          getCategoryLabel(p.category),
          supplier?.name || "Unknown supplier",
          Number(p.cost),
          new Date(p.purchaseDate).toLocaleDateString("en-PH"),
          p.isGreen ? "Green" : "Non-Green",
          p.itemAttributes.length ? p.itemAttributes.join(", ") : "",
        ];
      });
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet([headers, ...data]);
      window.XLSX.utils.book_append_sheet(wb, ws, "Acquisitions");
      window.XLSX.writeFile(wb, `procurement-log-${formatUtcYmd(new Date())}.xlsx`);
    });

    document.getElementById("excel-template-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!window.XLSX) return;
      const wb = window.XLSX.utils.book_new();
      const headers = [
        "ItemName",
        "Category",
        "SupplierName",
        "Cost",
        "PurchaseDate",
        "ItemAttributes",
        "GreenStatus",
      ];
      const example = [
        [
          'Energy Efficient Monitor 24"',
          "IT",
          "Eco Office Supplies Inc.",
          12500,
          formatUtcYmd(new Date()),
          "Energy Star, LED",
          "AUTO",
        ],
      ];
      const ws = window.XLSX.utils.aoa_to_sheet([headers, ...example]);
      window.XLSX.utils.book_append_sheet(wb, ws, "ImportTemplate");
      window.XLSX.writeFile(wb, "procurement-import-template.xlsx");
    });

    document.getElementById("btn-excel-import")?.addEventListener("click", async () => {
      const resultBox = document.getElementById("excel-result");
      if (resultBox) {
        resultBox.style.display = "none";
        resultBox.innerHTML = "";
      }

      const input = document.getElementById("excel-file");
      const file = input?.files?.[0] || null;
      if (!file) {
        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<p class="title">Choose an .xlsx/.xls file first.</p>`;
        }
        return;
      }
      if (!window.XLSX) {
        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<p class="title">XLSX library not loaded (check your internet connection).</p>`;
        }
        return;
      }

      const ab = await file.arrayBuffer();
      const wb = window.XLSX.read(ab, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<p class="title">Sheet not found.</p>`;
        }
        return;
      }

      const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
      if (!rows.length) {
        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<p class="title">No rows found in this sheet.</p>`;
        }
        return;
      }

      const headerMap = {};
      Object.keys(rows[0] || {}).forEach((k) => {
        headerMap[normalizeHeader(k)] = k;
      });

      const cItem = excelCol(headerMap, "ItemName", "itemName", "item_name", "Item Name");
      const cCat = excelCol(headerMap, "Category", "category");
      const cSup = excelCol(headerMap, "SupplierName", "supplierName", "supplier", "Supplier Name");
      const cCost = excelCol(headerMap, "Cost", "cost", "Amount", "amount");
      const cDate = excelCol(headerMap, "PurchaseDate", "purchaseDate", "Date", "date", "Purchase Date");
      const cAttr = excelCol(headerMap, "ItemAttributes", "itemAttributes", "Attributes", "attributes", "Item Attributes");
      const cGreen = excelCol(headerMap, "GreenStatus", "greenStatus", "Status", "status", "Green Status");
      if (!cItem || !cCat || !cSup || !cCost || !cDate) {
        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `<p class="title">Missing required columns. Required: ItemName, Category, SupplierName, Cost, PurchaseDate.</p>`;
        }
        return;
      }

      let ok = 0;
      const errors = [];

      rows.forEach((r, idx) => {
        const itemName = String(r[cItem] || "").trim();
        const category = categoryFromLabelOrCode(r[cCat]);
        const supplierName = String(r[cSup] || "").trim();
        const costVal = r[cCost];
        const dateVal = r[cDate];
        const attrsStr = cAttr ? String(r[cAttr] || "").trim() : "";
        const greenStr = cGreen ? String(r[cGreen] || "").trim().toUpperCase() : "AUTO";

        if (!itemName || !category || !supplierName || costVal === "" || dateVal === "") {
          errors.push(`Row ${idx + 2}: missing required fields`);
          return;
        }
        let sup = state.suppliers.find(
          (s) => s.name.toLowerCase() === supplierName.toLowerCase(),
        );
        if (!sup) {
          const tNew = nowIso();
          sup = {
            id: generateId(),
            name: supplierName,
            contactEmail: null,
            contactNumber: null,
            address: null,
            complianceNote: "Auto-created from Excel import.",
            isCompliant: false,
            createdAt: tNew,
            updatedAt: tNew,
          };
          state.suppliers.push(sup);
        }
        if (!PROCUREMENT_CATEGORIES.some((c) => c.value === category)) {
          errors.push(`Row ${idx + 2}: bad category "${category}"`);
          return;
        }
        const cost = typeof costVal === "number" ? costVal : Number(String(costVal).replace(/,/g, ""));
        if (!Number.isFinite(cost) || cost < 0) {
          errors.push(`Row ${idx + 2}: invalid cost`);
          return;
        }

        const pd = parseExcelDate(dateVal);
        if (!pd) {
          errors.push(`Row ${idx + 2}: invalid purchaseDate`);
          return;
        }

        const itemAttributes = attrsStr
          ? attrsStr.split(",").map((x) => x.trim()).filter(Boolean)
          : [];

        const { suggested, matchedKeywords } = suggestedGreenFromAttributes(category, itemAttributes);
        const mode = greenStr === "GREEN" || greenStr === "NON_GREEN" || greenStr === "AUTO" ? greenStr : "AUTO";
        const isGreen = mode === "GREEN" ? true : mode === "NON_GREEN" ? false : suggested;

        const t = nowIso();
        state.purchases.unshift({
          id: generateId(),
          itemName,
          category,
          itemAttributes,
          supplierId: sup.id,
          cost: cost.toFixed(2),
          purchaseDate: pd.toISOString(),
          isGreen,
          classificationLog: buildClassificationLog(itemAttributes, matchedKeywords, suggested),
          createdAt: t,
          updatedAt: t,
        });
        ok += 1;
      });

      saveState();
      window._excelImportResult = { ok, errors };
      if (resultBox) {
        resultBox.style.display = "block";
        resultBox.innerHTML = `<p class="title">Imported ${ok} row(s).${errors.length ? ` ${errors.length} issue(s) reported.` : ""}</p>${
          errors.length
            ? `<ul>${errors.slice(0, 25).map((e) => `<li>${escapeHtml(e)}</li>`).join("")}${
                errors.length > 25 ? `<li>…and ${errors.length - 25} more (list truncated).</li>` : ""
              }</ul>`
            : ""
        }`;
      }
      // Clear selected file after processing so user can re-import same file if needed.
      if (input) input.value = "";
      render();
    });

    document.getElementById("receipt-file")?.addEventListener("change", async (e) => {
      const msg = document.getElementById("receipt-msg");
      const preview = document.getElementById("receipt-preview");
      const details = document.getElementById("receipt-details");
      msg.textContent = "";
      if (preview) preview.textContent = "";
      if (details) details.style.display = "none";

      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!window.Tesseract) {
        msg.textContent = "Tesseract library not loaded (check your internet connection).";
        return;
      }
      if (!file.type.startsWith("image/")) {
        msg.textContent = "Please choose an image file (PNG/JPEG/WebP).";
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        msg.textContent = "Image must be 8 MB or smaller.";
        return;
      }

      msg.textContent = "Reading image… this may take a moment.";
      try {
        const result = await window.Tesseract.recognize(file, "eng");
        const text = String(result?.data?.text || "").trim();
        if (preview) preview.textContent = text.slice(0, 2000) + (text.length > 2000 ? "…" : "");
        if (details) details.style.display = text ? "block" : "none";

        // Best-effort prefill: item name (first non-empty line) + cost (first currency-ish) + date (YYYY-MM-DD)
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const firstLine = lines[0] || "";
        const money = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+(?:\.\d{2}))/g.exec(text);
        const isoDate = /(\d{4}-\d{2}-\d{2})/.exec(text);

        const itemEl = document.getElementById("pl-item");
        const costEl = document.getElementById("pl-cost");
        const dateEl = document.getElementById("pl-date");

        if (itemEl && firstLine) itemEl.value = firstLine.slice(0, 120);
        if (costEl && money) costEl.value = money[1].replace(/,/g, "");
        if (dateEl && isoDate) dateEl.value = isoDate[1];

        msg.textContent = "Best-effort values were sent to the form below. Always review cost, date, supplier, and category before saving.";
      } catch (err) {
        msg.textContent = err instanceof Error ? err.message : "Could not read this image.";
      }
    });
  }

  function renderSuppliers() {
    const suppliers = state.suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));
    return `
      <div class="stack">
        <section>
          <h1 class="page-title">Supplier Profiles</h1>
          <p class="lead">External partners in your procurement pipeline: maintain profiles and certifications so sourcing and acquisition decisions stay anchored in quality and compliance.</p>
        </section>
        <section class="card">
          <h2>Add Supplier</h2>
          <form id="form-supplier" class="form-grid cols-2 mt-3">
            <label class="block"><span>Supplier Name</span><input required name="name" placeholder="Eco Office Supplies Inc." /></label>
            <label class="block"><span>Email</span><input type="email" name="contactEmail" placeholder="supplier@email.com" /></label>
            <label class="block"><span>Contact Number</span><input name="contactNumber" placeholder="+63..." /></label>
            <label class="block"><span>Address</span><input name="address" placeholder="City, Province" /></label>
            <label class="block" style="grid-column:1/-1"><span>Compliance Note</span><textarea name="complianceNote" rows="2" placeholder="ISO 14001 certified..."></textarea></label>
            <label class="radio-row" style="grid-column:1/-1"><input type="checkbox" name="isCompliant" /> Mark as compliant</label>
            <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary">Save Supplier</button></div>
          </form>
        </section>
        <section class="card">
          <h2>Add certification</h2>
          <p class="card-desc">Sustainability certificate metadata (URL/path as text).</p>
          <form id="form-cert" class="form-grid cols-2 mt-3">
            <label class="block"><span>Supplier</span>
              <select name="supplierId" required>${suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("") || `<option value="">No suppliers</option>`}</select>
            </label>
            <label class="block"><span>Title</span><input required name="title" placeholder="ISO 14001" /></label>
            <label class="block"><span>File URL</span><input required name="fileUrl" type="url" placeholder="https://..." /></label>
            <label class="block"><span>File type</span><input required name="fileType" placeholder="application/pdf" /></label>
            <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary" ${suppliers.length === 0 ? "disabled" : ""}>Save certification</button></div>
          </form>
        </section>
        <section class="card">
          <h2>Supplier Registry</h2>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>Supplier</th><th>Contact</th><th>Acquisitions</th><th>Certifications</th><th>Compliance</th><th>Update</th></tr></thead>
              <tbody>
                ${suppliers.length === 0 ? `<tr><td colspan="6" class="hint">No suppliers yet.</td></tr>` : suppliers.map((s) => `<tr>
                  <td><p style="margin:0;font-weight:500">${escapeHtml(s.name)}</p><p class="hint" style="margin:0">${escapeHtml(s.address || "No address")}</p></td>
                  <td>${s.contactEmail || s.contactNumber ? `${escapeHtml(s.contactEmail || "-")} / ${escapeHtml(s.contactNumber || "-")}` : "No contact details"}</td>
                  <td>${countPurchases(s.id)}</td>
                  <td>${countCerts(s.id)}</td>
                  <td><span class="badge ${s.isCompliant ? "badge-green" : "badge-slate"}">${s.isCompliant ? "Compliant" : "Needs Review"}</span></td>
                  <td>
                    <form class="inline-form" data-sup-compliance="${s.id}">
                      <select name="isCompliant" class="btn-sm" style="padding:0.25rem">
                        <option value="true" ${s.isCompliant ? "selected" : ""}>Compliant</option>
                        <option value="false" ${!s.isCompliant ? "selected" : ""}>Needs Review</option>
                      </select>
                      <input name="complianceNote" placeholder="Note..." value="${escapeHtml(s.complianceNote || "")}" style="max-width:8rem" />
                      <button type="submit" class="btn btn-dark btn-sm">Save</button>
                    </form>
                  </td>
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `;
  }

  function bindSuppliers() {
    document.getElementById("form-supplier")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const t = nowIso();
      state.suppliers.push({
        id: generateId(),
        name: String(fd.get("name") || "").trim(),
        contactEmail: String(fd.get("contactEmail") || "").trim() || null,
        contactNumber: String(fd.get("contactNumber") || "").trim() || null,
        address: String(fd.get("address") || "").trim() || null,
        complianceNote: String(fd.get("complianceNote") || "").trim() || null,
        isCompliant: fd.get("isCompliant") === "on",
        createdAt: t,
        updatedAt: t,
      });
      saveState();
      e.target.reset();
      render();
    });

    document.getElementById("form-cert")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const supplierId = String(fd.get("supplierId"));
      if (!supplierById(supplierId)) return;
      const t = nowIso();
      state.certifications.push({
        id: generateId(),
        supplierId,
        title: String(fd.get("title") || "").trim(),
        fileUrl: String(fd.get("fileUrl") || "").trim(),
        fileType: String(fd.get("fileType") || "").trim(),
        issuedAt: t,
        expiresAt: null,
        createdAt: t,
        updatedAt: t,
      });
      saveState();
      e.target.reset();
      render();
    });

    document.querySelectorAll("form[data-sup-compliance]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-sup-compliance");
        const s = supplierById(id);
        if (!s) return;
        const fd = new FormData(form);
        s.isCompliant = fd.get("isCompliant") === "true";
        s.complianceNote = String(fd.get("complianceNote") || "").trim() || null;
        s.updatedAt = nowIso();
        saveState();
        render();
      });
    });
  }

  function formatDateInput(iso) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function renderModify() {
    const suppliers = state.suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));
    const purchases = state.purchases.slice().sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)).slice(0, 100);
    return `
      <div class="stack">
        <section>
          <h1 class="page-title">Modify Data</h1>
          <p class="lead">Update supplier profiles and acquisition records. Removing a supplier deletes linked purchases and certifications (same cascade as the database).</p>
        </section>
        <section class="card">
          <h2>Supplier profiles</h2>
          <div class="mt-3 stack" style="gap:0.75rem">
            ${suppliers.length === 0 ? `<p class="lead mb-0">No suppliers to edit yet.</p>` : suppliers.map((s) => `
              <details class="disclosure">
                <summary>${escapeHtml(s.name)} <span class="hint">${s.isCompliant ? "Compliant" : "Needs review"}</span></summary>
                <div class="disclosure-body">
                  <form class="form-grid cols-2" data-update-supplier="${s.id}">
                    <input type="hidden" name="supplierId" value="${s.id}" />
                    <label class="block"><span>Supplier name</span><input required name="name" value="${escapeHtml(s.name)}" /></label>
                    <label class="block"><span>Email</span><input type="email" name="contactEmail" value="${escapeHtml(s.contactEmail || "")}" /></label>
                    <label class="block"><span>Contact number</span><input name="contactNumber" value="${escapeHtml(s.contactNumber || "")}" /></label>
                    <label class="block"><span>Address</span><input name="address" value="${escapeHtml(s.address || "")}" /></label>
                    <label class="block" style="grid-column:1/-1"><span>Compliance note</span><textarea name="complianceNote" rows="2">${escapeHtml(s.complianceNote || "")}</textarea></label>
                    <label class="radio-row" style="grid-column:1/-1"><input type="checkbox" name="isCompliant" ${s.isCompliant ? "checked" : ""} /> Mark as compliant</label>
                    <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary">Save supplier</button></div>
                  </form>
                  <form data-delete-supplier="${s.id}" class="mt-3">
                    <button type="submit" class="btn btn-danger">Remove supplier (${countPurchases(s.id)} purchases, ${countCerts(s.id)} certs)</button>
                  </form>
                </div>
              </details>`).join("")}
          </div>
        </section>
        <section class="card">
          <h2>Acquisition records</h2>
          <p class="card-desc">Latest 100 logged acquisitions.</p>
          <div class="mt-3 stack" style="gap:0.75rem">
            ${purchases.length === 0 ? `<p class="lead mb-0">No records.</p>` : purchases.map((p) => {
              const sup = supplierById(p.supplierId);
              return `
              <details class="disclosure">
                <summary>${escapeHtml(p.itemName)} <span class="hint">${escapeHtml(getCategoryLabel(p.category))} · ${escapeHtml(sup ? sup.name : "?")} · ${escapeHtml(new Date(p.purchaseDate).toLocaleDateString("en-PH"))}</span></summary>
                <div class="disclosure-body">
                  <form class="form-grid cols-2" data-update-purchase="${p.id}">
                    <label class="block" style="grid-column:1/-1"><span>Item name</span><input required name="itemName" value="${escapeHtml(p.itemName)}" /></label>
                    <label class="block"><span>Category</span>
                      <select name="category">${PROCUREMENT_CATEGORIES.map((c) => `<option value="${c.value}" ${c.value === p.category ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}</select>
                    </label>
                    <label class="block"><span>Supplier</span>
                      <select name="supplierId">${suppliers.map((s) => `<option value="${s.id}" ${s.id === p.supplierId ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}</select>
                    </label>
                    <label class="block"><span>Cost (PHP)</span><input name="cost" type="number" min="0" step="0.01" required value="${escapeHtml(String(p.cost))}" /></label>
                    <label class="block"><span>Purchase date</span><input name="purchaseDate" type="date" required value="${formatDateInput(p.purchaseDate)}" /></label>
                    <label class="block" style="grid-column:1/-1"><span>Item attributes (comma-separated)</span><input name="itemAttributes" value="${escapeHtml(p.itemAttributes.join(", "))}" /></label>
                    <fieldset class="plain" style="grid-column:1/-1">
                      <legend>Final green status</legend>
                      <div class="radio-row">
                        <label><input type="radio" name="greenStatus-${p.id}" value="AUTO" checked /> Auto</label>
                        <label><input type="radio" name="greenStatus-${p.id}" value="GREEN" /> Force green</label>
                        <label><input type="radio" name="greenStatus-${p.id}" value="NON_GREEN" /> Force non-green</label>
                      </div>
                    </fieldset>
                    <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary">Save purchase</button></div>
                  </form>
                  <form data-delete-purchase="${p.id}" class="mt-3">
                    <button type="submit" class="btn btn-danger">Remove purchase</button>
                  </form>
                </div>
              </details>`;
            }).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function bindModify() {
    document.querySelectorAll("form[data-update-supplier]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-update-supplier");
        const s = supplierById(id);
        if (!s) return;
        const fd = new FormData(form);
        s.name = String(fd.get("name") || "").trim();
        s.contactEmail = String(fd.get("contactEmail") || "").trim() || null;
        s.contactNumber = String(fd.get("contactNumber") || "").trim() || null;
        s.address = String(fd.get("address") || "").trim() || null;
        s.complianceNote = String(fd.get("complianceNote") || "").trim() || null;
        s.isCompliant = fd.get("isCompliant") === "on";
        s.updatedAt = nowIso();
        saveState();
        render();
      });
    });
    document.querySelectorAll("form[data-delete-supplier]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-delete-supplier");
        if (!confirm("Remove this supplier and all linked purchases and certifications?")) return;
        deleteSupplierCascade(id);
        saveState();
        render();
      });
    });
    document.querySelectorAll("form[data-update-purchase]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-update-purchase");
        const p = state.purchases.find((x) => x.id === id);
        if (!p) return;
        const fd = new FormData(form);
        const itemAttributes = String(fd.get("itemAttributes") || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const category = String(fd.get("category"));
        const greenMode = fd.get(`greenStatus-${id}`) || "AUTO";
        const { suggested, matchedKeywords } = suggestedGreenFromAttributes(category, itemAttributes);
        const isGreen = greenMode === "GREEN" ? true : greenMode === "NON_GREEN" ? false : suggested;
        p.itemName = String(fd.get("itemName") || "").trim();
        p.category = category;
        p.supplierId = String(fd.get("supplierId"));
        p.cost = Number(fd.get("cost")).toFixed(2);
        p.purchaseDate = new Date(String(fd.get("purchaseDate"))).toISOString();
        p.itemAttributes = itemAttributes;
        p.isGreen = isGreen;
        p.classificationLog = buildClassificationLog(itemAttributes, matchedKeywords, suggested);
        p.updatedAt = nowIso();
        saveState();
        render();
      });
    });
    document.querySelectorAll("form[data-delete-purchase]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-delete-purchase");
        if (!confirm("Remove this procurement record?")) return;
        state.purchases = state.purchases.filter((x) => x.id !== id);
        saveState();
        render();
      });
    });
  }

  function renderGppb() {
    const q = (window._gppbQ || "").trim().toLowerCase();
    const catF = window._gppbCat || "";
    const stF = window._gppbStatus || "all";
    let criteria = state.gppbCriteria.slice();
    if (catF && PROCUREMENT_CATEGORIES.some((c) => c.value === catF)) {
      criteria = criteria.filter((c) => c.category === catF);
    }
    if (stF === "active") criteria = criteria.filter((c) => c.isActive);
    if (stF === "inactive") criteria = criteria.filter((c) => !c.isActive);
    if (q) {
      criteria = criteria.filter(
        (c) => c.keyword.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)),
      );
    }
    const totalAll = state.gppbCriteria.length;
    const activeAll = state.gppbCriteria.filter((c) => c.isActive).length;
    const inactiveAll = totalAll - activeAll;

    const byCategory = PROCUREMENT_CATEGORIES.map((cat) => ({
      ...cat,
      items: criteria.filter((c) => c.category === cat.value),
    }));

    return `
      <div class="stack">
        <section>
          <h1 class="page-title">GPPB Reference</h1>
          <p class="lead">Maintain your <strong>GPPB-aligned criteria library</strong>: keywords per category (plus shared <strong>Other</strong>) used when suggesting green classification for new acquisitions.</p>
        </section>
        <section class="stat-row cols-3">
          <div class="card"><p class="hint" style="margin:0;text-transform:uppercase">Total criteria</p><p class="page-title" style="font-size:1.5rem">${totalAll}</p></div>
          <div class="card border-emerald bg-emerald-soft"><p class="hint" style="margin:0;color:var(--emerald-800);text-transform:uppercase">Active</p><p class="page-title" style="font-size:1.5rem;color:var(--emerald-900)">${activeAll}</p></div>
          <div class="card" style="background:var(--slate-50)"><p class="hint" style="margin:0;text-transform:uppercase">Inactive</p><p class="page-title" style="font-size:1.5rem">${inactiveAll}</p></div>
        </section>
        <section class="card">
          <h2>How matching works</h2>
          <ul class="bullets">
            <li>Only <strong>active</strong> rows participate in classification.</li>
            <li>For each purchase category, the system loads keywords for that category <em>and</em> for <strong>Other</strong>.</li>
            <li>Each attribute is compared <strong>case-insensitively</strong>; substring match counts.</li>
            <li>If there are no active keywords for that scope, the app uses the built-in keyword list.</li>
          </ul>
        </section>
        <section class="card border-amber">
          <h2 style="color:var(--amber-950)">Starter keyword ideas</h2>
          <p class="lead" style="color:var(--amber-950)">Examples only—adapt to your policies.</p>
          <dl class="cat-grid cols-2" style="font-size:0.875rem;color:var(--amber-950)">
            <div><dt style="font-weight:600">IT</dt><dd class="mono" style="margin:0.25rem 0 0">energy star, epeat, tco certified, low power, refurbished</dd></div>
            <div><dt style="font-weight:600">Office supplies</dt><dd class="mono" style="margin:0.25rem 0 0">recycled content, fsc, soy ink, remanufactured toner</dd></div>
            <div><dt style="font-weight:600">Furniture</dt><dd class="mono" style="margin:0.25rem 0 0">fsc certified, low voc, formaldehyde free, recyclable</dd></div>
            <div><dt style="font-weight:600">Facilities / Lab / Other</dt><dd class="mono" style="margin:0.25rem 0 0">water efficient, led, non toxic, biodegradable, iso 14001</dd></div>
          </dl>
        </section>
        <section class="card">
          <h2>Filter library</h2>
          <form id="form-gppb-filter" class="filter-bar mt-3">
            <label class="block field"><span class="hint">Search</span><input name="q" value="${escapeHtml(window._gppbQ || "")}" placeholder="Keyword or description" /></label>
            <label class="block field"><span class="hint">Category</span>
              <select name="category">
                <option value="">All categories</option>
                ${PROCUREMENT_CATEGORIES.map((c) => `<option value="${c.value}" ${c.value === catF ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
              </select>
            </label>
            <label class="block field"><span class="hint">Status</span>
              <select name="status">
                <option value="all" ${stF === "all" ? "selected" : ""}>All</option>
                <option value="active" ${stF === "active" ? "selected" : ""}>Active only</option>
                <option value="inactive" ${stF === "inactive" ? "selected" : ""}>Inactive only</option>
              </select>
            </label>
            <div class="toolbar-gap">
              <button type="submit" class="btn btn-dark">Apply filters</button>
              <button type="button" class="btn btn-outline" id="gppb-clear">Clear</button>
            </div>
          </form>
          <p class="hint mt-3">Showing ${criteria.length} row(s) · ${totalAll} total in storage</p>
        </section>
        <section class="card">
          <h2>Add criterion</h2>
          <p class="card-desc">Keywords are stored in lowercase. Duplicate category + keyword updates the existing row.</p>
          <form id="form-gppb-add" class="form-grid cols-2 mt-3">
            <label class="block"><span>Category</span>
              <select name="category" required><option value="">Select</option>${PROCUREMENT_CATEGORIES.map((c) => `<option value="${c.value}">${escapeHtml(c.label)}</option>`).join("")}</select>
            </label>
            <label class="block"><span>Keyword or phrase</span><input class="mono" required name="keyword" placeholder="energy star" /></label>
            <label class="block" style="grid-column:1/-1"><span>Description (optional)</span><textarea name="description" rows="2"></textarea></label>
            <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary">Save criterion</button></div>
          </form>
        </section>
        <section class="stack">
          <h2 class="page-title" style="font-size:1rem">Criteria library</h2>
          ${criteria.length === 0 ? `<div class="empty-dashed">No criteria match filters.</div>` : byCategory.map((block) => block.items.length === 0 ? "" : `
            <div class="card">
              <div class="flex-between" style="border-bottom:1px solid var(--slate-100);padding-bottom:0.75rem;margin-bottom:0.75rem">
                <h3 style="margin:0;font-size:0.875rem">${escapeHtml(block.label)}</h3>
                <span class="hint">${block.items.length} keyword(s)</span>
              </div>
              <div class="cat-grid cols-2">
                ${block.items.map((entry) => `
                  <div class="criteria-card">
                    <div class="flex-between">
                      <p class="kw">${escapeHtml(entry.keyword)}</p>
                      <span class="badge ${entry.isActive ? "badge-green" : "badge-slate"}">${entry.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    ${entry.description ? `<p class="hint">${escapeHtml(entry.description)}</p>` : `<p class="hint" style="font-style:italic">No description</p>`}
                    <div class="toolbar-gap mt-3">
                      <button type="button" class="btn btn-outline btn-sm" data-toggle-crit="${entry.id}">${entry.isActive ? "Deactivate" : "Activate"}</button>
                    </div>
                    <details class="mt-3">
                      <summary class="text-xs" style="cursor:pointer;color:var(--emerald-800);font-weight:500">Edit or delete</summary>
                      <form class="form-grid cols-2 mt-3" data-edit-crit="${entry.id}">
                        <label class="block"><span class="text-xs">Category</span>
                          <select name="category">${PROCUREMENT_CATEGORIES.map((c) => `<option value="${c.value}" ${c.value === entry.category ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}</select>
                        </label>
                        <label class="block"><span class="text-xs">Keyword</span><input class="mono" name="keyword" required value="${escapeHtml(entry.keyword)}" /></label>
                        <label class="block" style="grid-column:1/-1"><span class="text-xs">Description</span><textarea name="description" rows="2">${escapeHtml(entry.description || "")}</textarea></label>
                        <label class="radio-row" style="grid-column:1/-1"><input type="checkbox" name="isActive" ${entry.isActive ? "checked" : ""} /> Active</label>
                        <div style="grid-column:1/-1"><button type="submit" class="btn btn-primary btn-sm">Save changes</button></div>
                      </form>
                      <form data-del-crit="${entry.id}" class="mt-3"><button type="submit" class="btn btn-danger btn-sm">Delete criterion</button></form>
                    </details>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </section>
      </div>
    `;
  }

  function bindGppb() {
    document.getElementById("form-gppb-filter")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      window._gppbQ = String(fd.get("q") || "");
      window._gppbCat = String(fd.get("category") || "");
      window._gppbStatus = String(fd.get("status") || "all");
      render();
    });
    document.getElementById("gppb-clear")?.addEventListener("click", () => {
      window._gppbQ = "";
      window._gppbCat = "";
      window._gppbStatus = "all";
      render();
    });
    document.getElementById("form-gppb-add")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const category = String(fd.get("category"));
      const keyword = String(fd.get("keyword") || "").trim().toLowerCase();
      const description = String(fd.get("description") || "").trim() || null;
      const existing = state.gppbCriteria.find((c) => c.category === category && c.keyword === keyword);
      const t = nowIso();
      if (existing) {
        existing.description = description;
        existing.isActive = true;
        existing.updatedAt = t;
      } else {
        state.gppbCriteria.push({
          id: generateId(),
          category,
          keyword,
          description,
          isActive: true,
          createdAt: t,
          updatedAt: t,
        });
      }
      saveState();
      e.target.reset();
      render();
    });
    document.querySelectorAll("[data-toggle-crit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-toggle-crit");
        const c = state.gppbCriteria.find((x) => x.id === id);
        if (c) {
          c.isActive = !c.isActive;
          c.updatedAt = nowIso();
          saveState();
          render();
        }
      });
    });
    document.querySelectorAll("form[data-edit-crit]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-edit-crit");
        const c = state.gppbCriteria.find((x) => x.id === id);
        if (!c) return;
        const fd = new FormData(form);
        c.category = String(fd.get("category"));
        c.keyword = String(fd.get("keyword") || "").trim().toLowerCase();
        c.description = String(fd.get("description") || "").trim() || null;
        c.isActive = fd.get("isActive") === "on";
        c.updatedAt = nowIso();
        saveState();
        render();
      });
    });
    document.querySelectorAll("form[data-del-crit]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-del-crit");
        if (!confirm("Delete this criterion?")) return;
        state.gppbCriteria = state.gppbCriteria.filter((x) => x.id !== id);
        saveState();
        render();
      });
    });
  }

  // Main app render loop: chooses the current route and mounts the right view
  function render() {
    renderNav();
    const route = getRoute();
    const root = document.getElementById("view-root");
    const tag = document.getElementById("header-tagline");
    tag.textContent = APP_HEADER_TAGLINE;

    if (route === "dashboard") {
      root.innerHTML = renderDashboard();
      bindDashboard();
      bindDashboardCharts();
    } else if (route === "procurement-log") {
      root.innerHTML = renderProcurementLog();
      bindProcurementLog();
    } else if (route === "suppliers") {
      root.innerHTML = renderSuppliers();
      bindSuppliers();
    } else if (route === "modify-data") {
      root.innerHTML = renderModify();
      bindModify();
    } else if (route === "gppb-reference") {
      root.innerHTML = renderGppb();
      bindGppb();
    } else {
      setHash("dashboard");
    }

  }

  // Application bootstrap: initialize state, route handling, and the first render
  function init() {
    if (!loadState()) {
      // no default sample/demo data loaded
    }
    if (!FORCED_ROUTE) {
      window.addEventListener("hashchange", render);
      if (!window.location.hash) setHash("procurement-log");
    }
    render();
  }

  init();
})();
