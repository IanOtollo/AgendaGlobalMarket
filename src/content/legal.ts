// DRAFT: requires review by qualified counsel before launch.
// Plain-English legal text for a booking office that connects customers with independent professionals in Nairobi.
// Facts the owner has not supplied (entity, registration number, address, retention periods) are not invented:
// the text describes the principle, and company details appear only once filled in `src/lib/site.ts`.
import { BRAND } from "@/lib/config";
import { SITE } from "@/lib/site";

export type Clause = string | { text: string; items: string[] };
export type LegalSection = { id: string; title: string; summary: string; clauses: Clause[] };
export type LegalDoc = { slug: string; title: string; description: string; updated: string; changelog: { date: string; note: string }[]; sections: LegalSection[] };

export const LEGAL_UPDATED = "23 November 2026";
const log = [{ date: LEGAL_UPDATED, note: "First published." }];

const who = () => SITE.legal.entity || BRAND.name;
const email = () => SITE.legal.email || BRAND.email;
const act = SITE.legal.dataProtectionAct;

const contactSection = (): LegalSection => ({
  id: "contact", title: "Contact us", summary: "Message or email the office and we will respond.",
  clauses: [
    `You can reach ${who()} by calling or messaging the office number shown on this website, or by email at ${email()}.`,
    ...(SITE.legal.address ? [`Our address is ${SITE.legal.address}.`] : []),
  ],
});

export function getLegalDocs(): Record<string, LegalDoc> {
  const terms: LegalDoc = {
    slug: "terms", title: "Terms of Service", updated: LEGAL_UPDATED, changelog: log,
    description: "The terms that apply when you use this website and book a professional through our office.",
    sections: [
      { id: "who-we-are", title: "Who we are", summary: "We run a booking office. The professionals are independent, not our employees.", clauses: [
        `${who()} (“we”, “us”) runs an office that connects customers with independent tradespeople (“professionals”) for home, office and building care in Nairobi, Kenya, including maintenance, specialised cleaning and pest control.`,
        "We are a marketplace. We introduce you to a professional, take the booking, schedule the visit and follow up. The professionals are independent businesses or individuals. They are not our employees, and we do not employ them or supervise how they carry out their trade.",
        "By using this website or booking through the office you agree to these terms.",
      ] },
      { id: "eligibility", title: "Who can use the service", summary: "You must be 18 or over and able to make a binding agreement.", clauses: [
        "You must be at least 18 years old and able to enter into a binding agreement to book a professional.",
        "If you book on behalf of a company or another person, you confirm you have their authority to do so.",
      ] },
      { id: "using-the-service", title: "Using the website and the office", summary: "Browse freely. Bookings are made by message or phone, with no account needed.", clauses: [
        "You can browse professionals on this website without an account. Bookings are made by messaging or calling the office; the website does not take bookings itself.",
        "The profile information on this website (such as experience, qualifications, area and ratings) is provided by or about the professional. We review the qualifications and experience professionals give us before listing them, but we cannot guarantee every detail is complete or current.",
        "Listing a professional is not an endorsement of any particular piece of work.",
      ] },
      { id: "bookings", title: "Bookings, quotes and price", summary: "We confirm the time and price with you before work starts. Extra work needs your agreement.", clauses: [
        "A booking is confirmed only when the office tells you so. We will confirm the professional, the date and arrival window, and a price or estimate.",
        "We schedule professionals so they are not booked for two jobs at the same time. The professional you ask for may not be free when you want them; if so we will offer another time or another suitable professional.",
        "If a job turns out to need more work or materials than expected, the professional must tell you first. Nothing extra goes ahead unless you agree.",
        "Please give us accurate details about the job and the address, make sure the professional can reach the place where work is needed, and tell us about any hazards in advance.",
      ] },
      { id: "payment", title: "Payment", summary: "The office tells you how and when to pay when it confirms the booking.", clauses: [
        "The office tells you how and when payment is due when it confirms your booking. Materials and parts are charged in addition to labour unless we tell you otherwise.",
        "Please ask for a receipt for any payment you make. Do not pay a professional in a way the office has not confirmed with you.",
      ] },
      { id: "cancellations", title: "Cancellations and no-shows", summary: "Free to cancel at least 4 hours ahead. After that a call-out fee may apply.", clauses: [
        "You can cancel or reschedule free of charge if you tell the office at least 4 hours before the start of the appointment. After that, or if nobody is available to let the professional in, a call-out fee may apply to cover their travel and lost time.",
        "If we or the professional need to cancel or move an appointment, we will tell you as early as we can and offer a new time. You will not be charged.",
        "The full policy is in our Cancellations and Refunds page.",
      ] },
      { id: "guarantee", title: "Problems with the work", summary: "Tell us within 7 days. We review it with the professional and arrange to put it right where it was not up to standard.", clauses: [
        "Professionals must carry out work with reasonable skill and care and follow the laws and safety standards that apply to their trade.",
        "If something is not right, contact the office within 7 days of the job being completed. We will review it with the professional and, where the work was not done with reasonable skill and care, arrange for it to be put right.",
        "This is a commitment to review and help resolve the problem. It does not limit any rights you have under Kenyan consumer protection law, including the Consumer Protection Act, 2012.",
      ] },
      { id: "reviews", title: "Ratings and reviews", summary: "Only customers whose job was completed can rate it, once. Keep it honest and fair.", clauses: [
        "After a job is marked complete we send you a link to rate the professional from 1 to 5 stars and, if you wish, leave a comment. Each completed job can be rated once.",
        "Ratings appear on the professional's profile. Comments may be shown without your name. Please be honest and fair.",
        "We may remove comments that are abusive, discriminatory, contain personal information, or are clearly not about the work.",
      ] },
      { id: "conduct", title: "Acceptable use", summary: "Treat people and the website with respect. See the Acceptable Use Policy.", clauses: [
        "You agree to follow our Acceptable Use Policy. We may stop providing the service to anyone who is abusive or threatening toward our staff or professionals, or who misuses the website.",
      ] },
      { id: "off-platform", title: "Dealing directly with professionals", summary: "Book through the office so scheduling, price and support work properly.", clauses: [
        "Professionals' personal contact details are not published. Please make and change bookings through the office so that jobs are scheduled without clashes, the price is agreed up front and you have one contact if anything changes.",
        "Professionals listed with us may not use our introduction to arrange or take payment for jobs outside the office.",
      ] },
      { id: "ip", title: "Our content", summary: "The website and its content belong to us or our licensors.", clauses: [
        "The website, its design and its content belong to us or our licensors. You may view it for personal use. You may not copy it in bulk or use it commercially without our permission.",
      ] },
      { id: "liability", title: "Disclaimers and liability", summary: "We take care coordinating your booking but are not the provider of the trade work.", clauses: [
        "We take reasonable care in coordinating your booking, but we are not the provider of the trade work. To the extent the law allows, we are not liable for loss or damage caused by a professional's work, or for indirect losses such as lost income or inconvenience.",
        "Nothing in these terms excludes or limits liability for death or personal injury caused by negligence, for fraud, or for anything else the law does not allow us to exclude. Subject to that, our total liability to you for a booking is limited to the amount you paid for that booking.",
        "You agree to compensate us for loss we suffer because you broke these terms or the law, to the extent the law allows.",
      ] },
      { id: "disputes", title: "Disputes and governing law", summary: "Talk to us first. Kenyan law applies.", clauses: [
        "If you have a concern, please raise it with the office first. We will try to resolve it quickly and fairly.",
        `These terms are governed by the laws of ${SITE.legal.jurisdiction}, and the courts of ${SITE.legal.jurisdiction} have jurisdiction over any dispute that cannot be resolved informally.`,
      ] },
      { id: "changes", title: "Changes to these terms", summary: "The version on this page applies. Changes do not affect confirmed bookings.", clauses: [
        "We may update these terms from time to time. The version on this page, with its date, is the one that applies. Changes do not affect bookings that were already confirmed.",
      ] },
      contactSection(),
    ],
  };

  const privacy: LegalDoc = {
    slug: "privacy", title: "Privacy Policy", updated: LEGAL_UPDATED, changelog: log,
    description: "What personal data we collect, why, who sees it, and the choices you have.",
    sections: [
      { id: "controller", title: "Who is responsible for your data", summary: "We are the data controller for what you share with the office.", clauses: [
        `${who()} is the data controller for personal data collected through this website and through the calls and messages you send to our office. You can contact us at ${email()}.`,
        `This policy is written to comply with the ${act} of ${SITE.legal.jurisdiction}.`,
      ] },
      { id: "what-we-collect", title: "What we collect", summary: "What you tell the office, what you choose to share, and basic usage figures.", clauses: [
        { text: "We collect only what we need to arrange and complete your job:", items: [
          "What you give us when you book by phone or message: your name, phone number, the address where work is needed, and details of the job.",
          "Job records: the trade, the appointment, the agreed price, payments, notes from the visit, and the professional assigned.",
          "Ratings: the stars and comment you choose to leave after a completed job.",
          "Messages: the content of WhatsApp messages and calls to our office, as needed to handle your booking.",
          "Your location, only if you choose to share it (see the next section).",
          "Basic, anonymous usage figures about how the website is used, if cookieless analytics is switched on.",
        ] },
      ] },
      { id: "location", title: "Your location", summary: "Location only sorts professionals by distance. It stays on your device.", clauses: [
        "Precise location: if you tap “Use my current location”, your browser asks for permission. We use your position only to work out which area of Nairobi you are in and to measure distance to professionals. This calculation happens in your browser.",
        "Approximate location: instead of sharing your device position you can pick an area. We then use the centre of that area.",
        "What is stored: your chosen area and rounded-md coordinates (about 100 metres of precision) are kept in your browser's local storage on your device for up to 7 days, so you do not have to choose again. They are not sent to our servers and are never shared with professionals. You can clear them at any time from the location panel.",
        "You can refuse or withdraw permission in your browser settings. The website works fully without location.",
      ] },
      { id: "why", title: "Why we use it", summary: "To run your booking, keep records, and keep the service safe.", clauses: [
        { text: "We use personal data to:", items: [
          "arrange, schedule and complete your job, and contact you about it (to perform the service you asked for);",
          "send you the link to rate the job (our legitimate interest in feedback);",
          "keep records, handle complaints and meet legal and accounting duties (legal obligation and legitimate interest);",
          "keep the service secure and prevent misuse (legitimate interest);",
          "use your location, if you choose to share it (your consent, which you can withdraw).",
        ] },
        "We do not sell personal data and we do not use it for advertising.",
      ] },
      { id: "sharing", title: "Who we share it with", summary: "The professional gets only what they need for your job.", clauses: [
        "The professional assigned to your job receives your name, address, phone number and job details so they can reach you and do the work. They may use them only for that job.",
        "We use service providers that process data for us, such as WhatsApp (operated by Meta) for messages and our hosting provider for the website and records. They are bound by their own terms and by our instructions.",
        "We may disclose information if the law requires it, or to protect people's safety.",
      ] },
      { id: "transfers", title: "Transfers outside Kenya", summary: "Some providers process data abroad, with safeguards.", clauses: [
        `Some providers, such as WhatsApp and hosting services, may process data outside ${SITE.legal.jurisdiction}. Where they do, we rely on safeguards that meet the requirements of the ${act}.`,
      ] },
      { id: "retention", title: "How long we keep it", summary: "As long as needed for the job, complaints and legal duties, then deleted or anonymised.", clauses: [
        "We keep job records for as long as needed to support the work, handle complaints and meet our legal and accounting duties. After that we delete the information or make it anonymous. Ratings may remain on a professional's profile without your name.",
        "Location data held on your device stays there until it expires after 7 days or you clear it.",
      ] },
      { id: "security", title: "Keeping it secure", summary: "Access is limited to our team, and we protect data in transit and at rest.", clauses: [
        "Access to our booking records is limited to our team and protected by sign-in. Public pages receive only a limited public profile of each professional, never customer or contact details. We take reasonable technical and organisational steps to protect data from loss, misuse and unauthorised access.",
        "If we discover a breach that affects you, we will tell you and the regulator as the law requires.",
      ] },
      { id: "rights", title: "Your rights", summary: "You can see, correct, delete or object to our use of your data, and complain to the regulator.", clauses: [
        { text: `Under the ${act} you have the right to:`, items: [
          "know what personal data we hold about you and get a copy;",
          "have inaccurate or incomplete data corrected;",
          "ask us to delete your data, unless we must keep it by law;",
          "object to, or ask us to limit, how we use your data;",
          "ask for your data in a portable format, where it applies;",
          "withdraw consent you gave, such as for location, at any time.",
        ] },
        `To use any of these rights, contact us at ${email()}. We aim to reply within 30 days.`,
        `If you are unhappy with how we handle your data you can complain to the ${SITE.legal.regulator}.`,
      ] },
      { id: "cookies", title: "Cookies and similar technologies", summary: "No advertising or tracking cookies. See the Cookie Policy.", clauses: [
        "We do not use advertising or cross-site tracking cookies. Visitors receive no cookies from this website. What is stored on your device is listed in our Cookie Policy.",
      ] },
      { id: "children", title: "Children", summary: "The service is for adults.", clauses: ["The service is for people aged 18 and over. We do not knowingly collect personal data from children."] },
      { id: "changes", title: "Changes to this policy", summary: "The dated version here applies.", clauses: ["We may update this policy as the service changes. The date at the top shows when it was last revised, and we will make any important change clear."] },
      { id: "dpo", title: "Data protection contact", summary: "Write to us at the address below.", clauses: [`For privacy questions or to use your rights, contact the data protection lead at ${email()}.`, ...(SITE.legal.address ? [`Post: ${who()}, ${SITE.legal.address}.`] : [])] },
    ],
  };

  const cookies: LegalDoc = {
    slug: "cookies", title: "Cookie Policy", updated: LEGAL_UPDATED, changelog: log,
    description: "The cookies and browser storage this website uses, in plain terms.",
    sections: [
      { id: "summary", title: "Our approach", summary: "No tracking or advertising cookies. Visitors get no cookies at all.", clauses: [
        "This website does not set advertising or tracking cookies, and visitors to the public pages receive no cookies. We use a small amount of storage inside your own browser so the site can remember choices you make. Because of this we do not show a cookie banner.",
      ] },
      { id: "storage", title: "What is stored on your device", summary: "A short list. All of it stays on your device.", clauses: [
        { text: "Browser storage set only when you use the feature:", items: [
          "Location choice (local storage, key agm-location-v1): your chosen area and rounded-md coordinates, used to sort professionals by distance. Kept for up to 7 days. Never sent to our servers. You can clear it from the location panel.",
          "Recent searches (local storage, key agm-recent-searches): the last few things you searched for. Kept until you clear your browser data. Stays on your device.",
          "Recently viewed professionals (local storage, key agm-recent-pros): the last few profiles you opened, so we can show them again. Kept until you clear your browser data. Stays on your device.",
        ] },
        { text: "Cookie used by staff only:", items: ["Sign-in session (cookie agm_session, strictly necessary): set only when our staff sign in to the administration area. It lasts 8 hours. Visitors never receive it."] },
      ] },
      { id: "analytics", title: "Analytics", summary: "If switched on, analytics is cookieless and anonymous.", clauses: [
        "If we switch on website analytics, we use a cookieless tool that counts visits and clicks without cookies and without identifying individuals or following you across other sites. We respect your browser's Do Not Track setting.",
      ] },
      { id: "control", title: "Your choices", summary: "Clear it in your browser at any time.", clauses: [
        "You can delete everything above from your browser's settings (clear site data), and you can clear your location from the location panel on this website. If we ever add non-essential cookies, we will ask for your consent first and update this page.",
      ] },
      contactSection(),
    ],
  };

  const proAgreement: LegalDoc = {
    slug: "pro-agreement", title: "Pro Agreement", updated: LEGAL_UPDATED, changelog: log,
    description: "The terms for professionals who are listed and booked through our office.",
    sections: [
      { id: "status", title: "Your status", summary: "You are independent. You are not our employee.", clauses: [
        `You work for yourself. Being listed with ${who()} does not make you our employee, partner or agent, and you are responsible for your own tax, licences and insurance.`,
        "You decide how to carry out the work. We provide customers and scheduling; we do not supervise your craft.",
      ] },
      { id: "listing", title: "Listing and review", summary: "We review what you tell us before listing you.", clauses: [
        "To be listed, you give us your trade, experience, qualifications and the area you are based in. We review these before listing you and you confirm they are true and current.",
        "Your public profile shows your name, trade, area, experience, qualifications and ratings. It never shows your phone number, email or ID details.",
        "You must keep your details up to date and tell us if a qualification or licence lapses.",
      ] },
      { id: "bookings", title: "How jobs reach you", summary: "Customers book through the office, which schedules you.", clauses: [
        "Customers contact the office, not you. The office confirms jobs with you, schedules them so you are not double-booked, and agrees the price with the customer before work starts.",
        "Please attend on time and tell the office as early as you can if you cannot. Do not take on extra work at a customer's request without telling the office; extra work needs the customer's agreement.",
      ] },
      { id: "conduct", title: "Standards", summary: "Do good work, safely, and treat customers with respect.", clauses: [
        { text: "You agree to:", items: [
          "carry out work with reasonable skill and care and follow the laws and safety standards for your trade;",
          "treat customers, their property and our staff with respect;",
          "keep customer information private and use it only for the job it was given for;",
          "follow our Acceptable Use Policy.",
        ] },
      ] },
      { id: "fees", title: "Fees and payment", summary: "Anything we charge or pay is agreed with you in writing first.", clauses: [
        "Any fee or commission, and how and when you are paid, is agreed in writing with the office before you are listed. We will not change it without telling you in advance.",
      ] },
      { id: "direct", title: "Keeping bookings with the office", summary: "Do not take our customers off the system.", clauses: [
        "You may not use an introduction from the office to arrange or take payment for work outside the office, and you must not give customers your personal number to book directly.",
      ] },
      { id: "ratings", title: "Ratings and removal", summary: "Ratings come from completed jobs. Serious or repeated problems can lead to removal.", clauses: [
        "Customers whose job was completed can rate you. Ratings are shown on your profile.",
        "We may take you off the site, pause you, or end this agreement if you break these terms, if customers repeatedly report poor work or conduct, or if your qualifications lapse. You can also ask to be removed at any time. Past jobs and ratings may be kept for our records.",
      ] },
      { id: "appeals", title: "If you disagree", summary: "Ask us to review the decision and we will answer in writing.", clauses: [
        "If you disagree with a decision about your listing, tell the office. We will review it and give you our answer in writing.",
      ] },
      { id: "law", title: "Governing law", summary: "Kenyan law applies.", clauses: [`This agreement is governed by the laws of ${SITE.legal.jurisdiction}.`] },
      contactSection(),
    ],
  };

  const refunds: LegalDoc = {
    slug: "cancellation-refunds", title: "Cancellations and Refunds", updated: LEGAL_UPDATED, changelog: log,
    description: "When you can cancel or reschedule, and what happens if the work is not right.",
    sections: [
      { id: "cancel", title: "Cancelling or rescheduling", summary: "Free with at least 4 hours' notice.", clauses: [
        "Tell the office at least 4 hours before the appointment starts and you can cancel or reschedule free of charge.",
        "With less notice, or if nobody is available to let the professional in, a call-out fee may apply to cover their travel and lost time. The office will tell you the amount before charging it.",
      ] },
      { id: "we-cancel", title: "If we cancel or move your appointment", summary: "No charge, and we offer a new time.", clauses: [
        "If the professional or the office needs to cancel or move your appointment, for example because of illness, an emergency or severe weather, we will tell you as early as we can and offer a new time. You will not be charged.",
      ] },
      { id: "problems", title: "If the work is not right", summary: "Contact us within 7 days. We review it and arrange to put it right.", clauses: [
        "Contact the office within 7 days of the job being completed and tell us what is wrong. Photos help.",
        "We review the job with the professional. Where the work was not done with reasonable skill and care, we arrange for it to be put right, which may include sending the professional back to correct it at no extra labour charge.",
      ] },
      { id: "refunds", title: "Refunds", summary: "If it cannot be put right, we discuss a fair outcome with you.", clauses: [
        "If a problem cannot reasonably be put right, the office will discuss a fair outcome with you, which may include a full or partial refund of what you paid for the affected work. Each case is considered on its facts.",
        "Materials already bought and used for the job are normally not refundable.",
        "Nothing here limits your rights under Kenyan consumer protection law.",
      ] },
      { id: "how", title: "How to ask", summary: "Message or call the office.", clauses: ["Message or call the office number shown on this website, or email us. Please include the job date and what went wrong."] },
      contactSection(),
    ],
  };

  const aup: LegalDoc = {
    slug: "acceptable-use", title: "Acceptable Use Policy", updated: LEGAL_UPDATED, changelog: log,
    description: "How we expect customers, professionals and visitors to behave.",
    sections: [
      { id: "people", title: "Treating people with respect", summary: "No abuse, threats, discrimination or harassment.", clauses: [
        { text: "You must not:", items: [
          "abuse, threaten, harass or discriminate against our staff, professionals or customers;",
          "ask a professional to work in a way that is unsafe or unlawful;",
          "give false information about yourself, a job or an address.",
        ] },
      ] },
      { id: "site", title: "Using the website", summary: "Do not misuse or attack the site.", clauses: [
        { text: "You must not:", items: [
          "try to access the administration area or other people's data without permission;",
          "copy profile data in bulk, scrape the site, or use it to contact professionals directly;",
          "interfere with how the site works, or introduce harmful code;",
          "post ratings or comments that are abusive, discriminatory, false or contain personal information.",
        ] },
      ] },
      { id: "action", title: "What we may do", summary: "We can remove content and stop the service.", clauses: [
        "We may remove ratings or comments that break this policy, refuse or stop a booking, and take any other step the law allows. We may report unlawful conduct to the authorities.",
      ] },
      { id: "report", title: "Reporting a problem", summary: "Tell the office.", clauses: ["To report conduct that breaks this policy, message or call the office or email us."] },
      contactSection(),
    ],
  };

  const a11y: LegalDoc = {
    slug: "accessibility", title: "Accessibility Statement", updated: LEGAL_UPDATED, changelog: log,
    description: "How we work to make this website usable by everyone, and how to tell us about a problem.",
    sections: [
      { id: "commitment", title: "Our commitment", summary: "We aim for WCAG 2.2 level AA.", clauses: [
        `${who()} wants everyone to be able to use this website. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.`,
      ] },
      { id: "what-we-do", title: "What we have done", summary: "Keyboard, contrast, focus, motion and text size are built in.", clauses: [
        { text: "Measures built into the website:", items: [
          "Everything can be used with a keyboard, with a visible focus outline and a skip link to the main content.",
          "Text and controls are designed to meet AA contrast, in both light and dark colour schemes.",
          "Buttons and links are at least 44 by 44 pixels on phones.",
          "Animation is reduced or removed if your device is set to reduce motion.",
          "Layouts adapt from small phones to large screens, and text can be enlarged without breaking the page.",
          "Forms have labels, errors are announced, and result counts are announced to screen readers.",
        ] },
      ] },
      { id: "testing", title: "How we test", summary: "Automated checks and manual keyboard review. No independent audit yet.", clauses: [
        "We run automated accessibility checks and review key pages by keyboard. We have not yet had an independent accessibility audit, so some issues may remain.",
      ] },
      { id: "limits", title: "Known limitations", summary: "Photos have limited text descriptions.", clauses: [
        "Photos of professionals and their work may have only brief descriptions. We are working to improve this.",
      ] },
      { id: "feedback", title: "Tell us about a problem", summary: "Contact the office. We will try to fix it or offer another way.", clauses: [
        "If you find something hard to use, tell the office. We will try to fix it or help you another way, such as taking your booking by phone.",
      ] },
      contactSection(),
    ],
  };

  return { terms, privacy, cookies, "pro-agreement": proAgreement, "cancellation-refunds": refunds, "acceptable-use": aup, accessibility: a11y };
}

export const LEGAL_LINKS = [
  ["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["cookies", "Cookie Policy"], ["pro-agreement", "Pro Agreement"],
  ["cancellation-refunds", "Cancellations and Refunds"], ["acceptable-use", "Acceptable Use"],
] as const;

export const readingMinutes = (d: LegalDoc) => {
  const words = d.sections.flatMap((s) => [s.summary, ...s.clauses.map((c) => (typeof c === "string" ? c : `${c.text} ${c.items.join(" ")}`))]).join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};
