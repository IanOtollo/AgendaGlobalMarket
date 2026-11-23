// Every answer here describes how the service works today. Keep them in step with the legal pages in src/content/legal.
export const FAQ_HOME = [
  { q: "How do I book a professional?", a: "Choose a trade, open a profile and message the office on WhatsApp, or call. We confirm the time and the price with you before work starts." },
  { q: "Why can't I contact the professional directly?", a: "Every booking goes through one office, so jobs are scheduled without clashes and you have a single contact if anything changes." },
  { q: "How is the price decided?", a: "The office agrees a price or estimate with you before work starts. If the job needs more work, you are told first and nothing extra goes ahead without your agreement." },
  { q: "Can I cancel or reschedule?", a: "Yes. It is free if you tell us at least 4 hours before the appointment. After that a call-out fee may apply. Read the cancellations and refunds policy for the details." },
  { q: "What if I'm not happy with the work?", a: "Contact us within 7 days of completion. We review the job with the professional and, where the work was not up to standard, arrange for it to be put right." },
  { q: "How do you use my location?", a: "Only to list the nearest professionals first. It stays on your device and is never sent to the professional or stored on our servers." },
];

export const FAQ_HELP = [
  { title: "Booking", items: [
    FAQ_HOME[0],
    FAQ_HOME[1],
    { q: "Do I need an account?", a: "No. You do not need an account to book. Message or call the office and we take it from there." },
    { q: "Which areas do you cover?", a: "Our professionals are based across Nairobi. Each profile shows the area they are based in, and you can browse by area on the services page." },
  ] },
  { title: "Prices and changes", items: [FAQ_HOME[2], FAQ_HOME[3], FAQ_HOME[4]] },
  { title: "Ratings and your information", items: [
    { q: "How do ratings work?", a: "When a job is completed we send the customer a link to rate the professional from 1 to 5 stars. Each job can be rated once, and only completed jobs can be rated." },
    FAQ_HOME[5],
  ] },
  { title: "For professionals", items: [
    { q: "How do I join as a professional?", a: "Message the office on WhatsApp with your trade, years of experience, qualifications and the area you are based in. We review what you send and get back to you." },
    { q: "Will customers see my phone number?", a: "No. Customers contact the office, so your personal number stays private." },
  ] },
];
