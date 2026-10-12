/**
 * Shared seed data used by both src/db/seed/index.ts and verification tests.
 * This is the single source of truth for what production content should look like.
 */

export interface CourseSeed {
  titleEn: string;
  titleMl: string | null;
  categoryName: string;
  descriptionEn: string;
  descriptionMl: string | null;
  durationText: string;
  certifications: string[];
  careerOutcomesEn: string;
  careerOutcomesMl: string | null;
  featured: boolean;
  status: "PUBLISHED";
}

export const CATEGORIES = [
  { nameEn: "IT & Software", nameMl: "ഐടി & സോഫ്റ്റ്വെയർ" },
  { nameEn: "Multimedia & Design", nameMl: "മൾട്ടിമീഡിയ & ഡിസൈൻ" },
  { nameEn: "Accounting & Finance", nameMl: "അക്കൗണ്ടിംഗ് & ഫിനാൻസ്" },
  { nameEn: "Language & Communications", nameMl: "ഭാഷ & കമ്മ്യൂണിക്കേഷൻ" },
  { nameEn: "Hardware & Networking", nameMl: "ഹാർഡ്വെയർ & നെറ്റ്വർക്കിംഗ്" },
  { nameEn: "Vocational & Professional", nameMl: "വൊക്കേഷണൽ & പ്രൊഫഷണൽ" },
];

export const COURSES: CourseSeed[] = [
  {
    titleEn: "Diploma in Computer Application (DCA)",
    titleMl: "ഡിപ്ലോമ ഇൻ കമ്പ്യൂട്ടർ ആപ്ലിക്കേഷൻ (DCA)",
    categoryName: "IT & Software",
    descriptionEn:
      "A foundational course covering computer fundamentals, MS Office, internet applications, and basic programming. Ideal for beginners seeking a strong start in computing.",
    descriptionMl:
      "കമ്പ്യൂട്ടർ അടിസ്ഥാനങ്ങൾ, എംഎസ് ഓഫീസ്, ഇന്റർനെറ്റ് ആപ്ലിക്കേഷനുകൾ, അടിസ്ഥാന പ്രോഗ്രാമിംഗ് എന്നിവ ഉൾപ്പെടുന്ന ഒരു അടിസ്ഥാന കോഴ്സ്.",
    durationText: "6 Months",
    certifications: ["G-TEC", "DCA"],
    careerOutcomesEn: "Computer Operator, Office Assistant, Data Entry Operator",
    careerOutcomesMl: "കമ്പ്യൂട്ടർ ഓപ്പറേറ്റർ, ഓഫീസ് അസിസ്റ്റന്റ്, ഡാറ്റ എൻട്രി ഓപ്പറേറ്റർ",
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "Advanced Diploma in Software Engineering (ADSE)",
    titleMl: null,
    categoryName: "IT & Software",
    descriptionEn:
      "An intensive program covering programming languages (C, C++, Java, Python), database management, web development, and software engineering principles.",
    descriptionMl: null,
    durationText: "12 Months",
    certifications: ["G-TEC", "ADSE"],
    careerOutcomesEn: "Software Developer, Web Developer, Programmer, Database Administrator",
    careerOutcomesMl: null,
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "Python Programming",
    titleMl: "പൈത്തൺ പ്രോഗ്രാമിംഗ്",
    categoryName: "IT & Software",
    descriptionEn:
      "Master Python from fundamentals to advanced topics: data structures, OOP, file handling, libraries, and real-world project work.",
    descriptionMl:
      "അടിസ്ഥാനം മുതൽ വിപുലമായ വിഷയങ്ങൾ വരെ: ഡാറ്റാ സ്ട്രക്ചറുകൾ, OOP, ഫയൽ ഹാൻഡ്ലിംഗ്, ലൈബ്രറികൾ, യഥാർത്ഥ പ്രോജക്റ്റ് വർക്ക്.",
    durationText: "3 Months",
    certifications: ["G-TEC", "Python"],
    careerOutcomesEn: "Python Developer, Data Analyst, Automation Engineer",
    careerOutcomesMl: "പൈത്തൺ ഡവലപ്പർ, ഡാറ്റ അനലിസ്റ്റ്, ഓട്ടോമേഷൻ എഞ്ചിനീയർ",
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Full Stack Web Development",
    titleMl: null,
    categoryName: "IT & Software",
    descriptionEn:
      "Comprehensive training in frontend and backend web technologies: HTML5, CSS3, JavaScript, React, Node.js, Express, MongoDB, and deployment.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "Full Stack"],
    careerOutcomesEn: "Full Stack Developer, Frontend Developer, Backend Developer",
    careerOutcomesMl: null,
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "Data Science & Machine Learning",
    titleMl: null,
    categoryName: "IT & Software",
    descriptionEn:
      "Learn data analysis, statistical modeling, machine learning algorithms, and data visualization using Python, R, and industry tools.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "Data Science"],
    careerOutcomesEn: "Data Scientist, ML Engineer, Data Analyst, Business Intelligence Analyst",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Digital Marketing",
    titleMl: null,
    categoryName: "IT & Software",
    descriptionEn:
      "Covers SEO, SEM, social media marketing, email marketing, content strategy, Google Analytics, and paid advertising campaigns.",
    descriptionMl: null,
    durationText: "3 Months",
    certifications: ["G-TEC", "Digital Marketing"],
    careerOutcomesEn: "Digital Marketing Specialist, SEO Analyst, Social Media Manager",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Graphic Design & Multimedia",
    titleMl: "ഗ്രാഫിക് ഡിസൈൻ & മൾട്ടിമീഡിയ",
    categoryName: "Multimedia & Design",
    descriptionEn:
      "Training in Adobe Creative Suite (Photoshop, Illustrator, InDesign), CorelDraw, typography, branding, and visual communication.",
    descriptionMl:
      "അഡോബി ക്രിയേറ്റീവ് സ്യൂട്ട് (ഫോട്ടോഷോപ്പ്, ഇല്ലസ്ട്രേറ്റർ, ഇൻഡിസൈൻ), കോറൽഡ്രോ, ടൈപ്പോഗ്രഫി, ബ്രാൻഡിംഗ്, വിഷ്വൽ കമ്മ്യൂണിക്കേഷൻ എന്നിവയിൽ പരിശീലനം.",
    durationText: "6 Months",
    certifications: ["G-TEC", "Adobe"],
    careerOutcomesEn: "Graphic Designer, UI/UX Designer, Art Director, Visualizer",
    careerOutcomesMl: "ഗ്രാഫിക് ഡിസൈനർ, UI/UX ഡിസൈനർ, ആർട്ട് ഡയറക്ടർ, വിഷ്വലൈസർ",
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "Video Editing & Motion Graphics",
    titleMl: null,
    categoryName: "Multimedia & Design",
    descriptionEn:
      "Professional video editing with Adobe Premiere Pro, After Effects, motion graphics, color grading, and sound design.",
    descriptionMl: null,
    durationText: "4 Months",
    certifications: ["G-TEC", "Adobe"],
    careerOutcomesEn: "Video Editor, Motion Graphics Artist, Content Creator",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Web & UI/UX Designing",
    titleMl: null,
    categoryName: "Multimedia & Design",
    descriptionEn:
      "Learn wireframing, prototyping, user research, Figma, Adobe XD, responsive design principles, and design systems.",
    descriptionMl: null,
    durationText: "4 Months",
    certifications: ["G-TEC"],
    careerOutcomesEn: "UI/UX Designer, Product Designer, Web Designer",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Tally ERP 9 / Prime with GST",
    titleMl: "ടാലി ഇആർപി 9 / പ്രൈം വിത് ജിഎസ്ടി",
    categoryName: "Accounting & Finance",
    descriptionEn:
      "Hands-on training in Tally ERP 9 / Prime covering accounting fundamentals, GST filing, payroll, inventory management, and MIS reporting.",
    descriptionMl:
      "അക്കൗണ്ടിംഗ് അടിസ്ഥാനങ്ങൾ, ജിഎസ്ടി ഫയലിംഗ്, പേറോൾ, ഇൻവെന്ററി മാനേജ്മെന്റ്, എംഐഎസ് റിപ്പോർട്ടിംഗ് എന്നിവ ഉൾപ്പെടുന്ന ടാലി ഇആർപി 9 / പ്രൈമിൽ പ്രായോഗിക പരിശീലനം.",
    durationText: "3 Months",
    certifications: ["G-TEC", "Tally"],
    careerOutcomesEn: "Accountant, GST Practitioner, Accounts Executive",
    careerOutcomesMl: "അക്കൗണ്ടന്റ്, ജിഎസ്ടി പ്രാക്ടീഷണർ, അക്കൗണ്ട്സ് എക്സിക്യൂട്ടീവ്",
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "SAP FICO (Finance & Controlling)",
    titleMl: null,
    categoryName: "Accounting & Finance",
    descriptionEn:
      "Comprehensive SAP FICO training covering financial accounting, controlling, asset management, and integration with other SAP modules.",
    descriptionMl: null,
    durationText: "3 Months",
    certifications: ["G-TEC", "SAP"],
    careerOutcomesEn: "SAP Consultant, Financial Analyst, FICO Specialist",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Spoken English & Communication Skills",
    titleMl: "സ്പോക്കൺ ഇംഗ്ലീഷ് & കമ്മ്യൂണിക്കേഷൻ സ്കിൽസ്",
    categoryName: "Language & Communications",
    descriptionEn:
      "Practical English language training focused on spoken fluency, grammar, vocabulary, public speaking, interview skills, and business communication.",
    descriptionMl:
      "സംസാരശേഷി, വ്യാകരണം, പദസമ്പത്ത്, പൊതുപ്രസംഗം, ഇന്റർവ്യൂ കഴിവുകൾ, ബിസിനസ് കമ്മ്യൂണിക്കേഷൻ എന്നിവയിൽ ശ്രദ്ധ കേന്ദ്രീകരിച്ചുള്ള പ്രായോഗിക ഇംഗ്ലീഷ് ഭാഷാ പരിശീലനം.",
    durationText: "3 Months",
    certifications: ["G-TEC"],
    careerOutcomesEn: "Customer Service Executive, Front Office Executive, BPO Professional",
    careerOutcomesMl: "കസ്റ്റമർ സർവീസ് എക്സിക്യൂട്ടീവ്, ഫ്രണ്ട് ഓഫീസ് എക്സിക്യൂട്ടീവ്, ബിപിഒ പ്രൊഫഷണൽ",
    featured: true,
    status: "PUBLISHED",
  },
  {
    titleEn: "IELTS / TOEFL / PTE Preparation",
    titleMl: null,
    categoryName: "Language & Communications",
    descriptionEn:
      "Expert-led coaching for international English proficiency exams with mock tests, speaking practice, writing feedback, and study materials.",
    descriptionMl: null,
    durationText: "2 Months",
    certifications: ["G-TEC"],
    careerOutcomesEn: "Study Abroad Candidate, International Professional",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Hardware & Networking (A+ / N+)",
    titleMl: null,
    categoryName: "Hardware & Networking",
    descriptionEn:
      "Training in computer hardware assembly, troubleshooting, operating systems, LAN/WAN networking, TCP/IP, and network security fundamentals.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "CompTIA A+", "CompTIA N+"],
    careerOutcomesEn: "Hardware Technician, Network Administrator, IT Support Engineer",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
  {
    titleEn: "Diploma in Financial Accounting (DFA)",
    titleMl: null,
    categoryName: "Accounting & Finance",
    descriptionEn:
      "Covers financial accounting principles, banking, taxation, auditing, and computerized accounting using Tally and MS Excel.",
    descriptionMl: null,
    durationText: "6 Months",
    certifications: ["G-TEC", "DFA"],
    careerOutcomesEn: "Accounts Assistant, Auditor, Tax Assistant",
    careerOutcomesMl: null,
    featured: false,
    status: "PUBLISHED",
  },
];

export const CERTIFICATION_PARTNERS = [
  { name: "Adobe", nameMl: null, link: "https://www.adobe.com/in/education.html" },
  { name: "Microsoft", nameMl: null, link: "https://www.microsoft.com/en-in/education" },
  { name: "SAP", nameMl: null, link: "https://www.sap.com/india/training.html" },
  { name: "Tally Education", nameMl: "ടാലി എജ്യുക്കേഷൻ", link: "https://tallyeducation.com" },
  { name: "CompTIA", nameMl: null, link: "https://www.comptia.org" },
  { name: "Autodesk", nameMl: null, link: "https://www.autodesk.com/certification" },
  { name: "Red Hat", nameMl: null, link: "https://www.redhat.com/en/services/training-and-certification" },
  { name: "Oracle", nameMl: null, link: "https://education.oracle.com" },
  { name: "ISO", nameMl: null, link: "https://www.iso.org" },
  { name: "NIELIT", nameMl: null, link: "https://www.nielit.gov.in" },
];

export const GALLERY_CATEGORIES = [
  { slug: "campus", nameEn: "Campus & Facilities", nameMl: "ക്യാമ്പസ് & സൗകര്യങ്ങൾ" },
  { slug: "events", nameEn: "Events & Activities", nameMl: "പരിപാടികൾ & പ്രവർത്തനങ്ങൾ" },
  { slug: "placement", nameEn: "Placement & Support", nameMl: "പ്ലേസ്മെന്റ് & പിന്തുണ" },
  { slug: "classroom", nameEn: "Classroom Sessions", nameMl: "ക്ലാസ്‌റൂം സെഷനുകൾ" },
  { slug: "placement-support", nameEn: "Placement Support", nameMl: "പ്ലേസ്മെന്റ് പിന്തുണ" },
];

export const WHY_CHOOSE_US_CARDS = [
  { icon: "AWARD" as const, titleEn: "ISO 9001:2015 Certified", titleMl: "ഐഎസ്ഒ 9001:2015 സർട്ടിഫൈഡ്", descriptionEn: "Globally recognized quality management standards ensuring world-class education delivery.", descriptionMl: "ആഗോളനിലവാരമുള്ള വിദ്യാഭ്യാസം ഉറപ്പാക്കുന്ന ഗുണനിലവാര മാനേജ്മെന്റ് സ്റ്റാൻഡേർഡ്." },
  { icon: "USERS" as const, titleEn: "Expert Trainers", titleMl: "വിദഗ്ധ പരിശീലകർ", descriptionEn: "Industry-experienced faculty dedicated to hands-on, practical learning that prepares you for the real world.", descriptionMl: "വ്യവസായ പരിചയമുള്ള അധ്യാപകർ പ്രായോഗിക പഠനത്തിന് ഊന്നൽ നൽകുന്നു." },
  { icon: "BOOK_OPEN" as const, titleEn: "Industry-Relevant Curriculum", titleMl: "വ്യവസായ-അനുയോജ്യമായ പാഠ്യപദ്ധതി", descriptionEn: "Courses designed in collaboration with industry partners to meet current market demands.", descriptionMl: "വിപണി ആവശ്യങ്ങൾ നിറവേറ്റുന്നതിനായി രൂപകൽപ്പന ചെയ്ത കോഴ്സുകൾ." },
  { icon: "BRIEFCASE" as const, titleEn: "Placement Assistance", titleMl: "പ്ലേസ്മെന്റ് സഹായം", descriptionEn: "Dedicated placement support with resume workshops, mock interviews, and job referral networks.", descriptionMl: "റെസ്യൂമെ വർക്ക്ഷോപ്പുകൾ, മോക്ക് ഇന്റർവ്യൂകൾ, ജോബ് റഫറൽ നെറ്റ്‌വർക്കുകൾ എന്നിവയുള്ള പ്ലേസ്മെന്റ് പിന്തുണ." },
  { icon: "GLOBE" as const, titleEn: "Global Recognition", titleMl: "ആഗോള അംഗീകാരം", descriptionEn: "G-TEC certificates are recognized by employers and institutions across 23 countries worldwide.", descriptionMl: "ജി-ടെക് സർട്ടിഫിക്കറ്റുകൾ 23 രാജ്യങ്ങളിലെ തൊഴിലുടമകളും സ്ഥാപനങ്ങളും അംഗീകരിക്കുന്നു." },
  { icon: "HEADPHONES" as const, titleEn: "Lifetime Support", titleMl: "ആജീവനാന്ത പിന്തുണ", descriptionEn: "Free course revision and career guidance for life — even after you complete your program.", descriptionMl: "കോഴ്സ് പൂർത്തിയാക്കിയ ശേഷവും സൗജന്യ കോഴ്സ് പുനരവലോകനവും കരിയർ മാർഗ്ഗനിർദ്ദേശവും." },
];

export const NEWS_EVENTS = [
  { type: "NEWS" as const, titleEn: "G-TEC Thodupuzha Achieves 95% Placement Rate for 2024 Batch", titleMl: null, bodyEn: "We are proud to announce that the 2024 batch has achieved a 95% placement rate, with students placed in leading IT companies, financial institutions, and multinational corporations across Kerala and beyond.", bodyMl: null, slug: "gtec-thodupuzha-95-percent-placement-2024" },
  { type: "EVENT" as const, titleEn: "Free Career Guidance Workshop — July 2025", titleMl: null, bodyEn: "Join us for a free career guidance workshop at our Thodupuzha campus. Expert counselors will help you identify the right career path and training program. Limited seats available — register now!", bodyMl: null, slug: "free-career-guidance-workshop-july-2025" },
  { type: "NEWS" as const, titleEn: "New Batch Starting: Full Stack Web Development — August 2025", titleMl: null, bodyEn: "Enrollments are open for the upcoming Full Stack Web Development batch starting August 2025. The course covers React, Node.js, MongoDB, and deployment. Early bird discounts available!", bodyMl: null, slug: "full-stack-web-dev-batch-august-2025" },
  { type: "EVENT" as const, titleEn: "Industry Visit to Kochi IT Park", titleMl: null, bodyEn: "Students will visit leading IT companies at Kochi's Infopark to gain exposure to real work environments, interact with industry professionals, and understand corporate expectations.", bodyMl: null, slug: "industry-visit-kochi-it-park-2025" },
];

/* ── Flash News ── */
export interface FlashNewsSeed {
  textEn: string;
  textMl: string | null;
  link: string | null;
  active: boolean;
  sortOrder: number;
}

export const FLASH_NEWS: FlashNewsSeed[] = [
  {
    textEn: "New batches starting August 2025 — enroll now for early bird discounts!",
    textMl: "2025 ഓഗസ്റ്റിൽ പുതിയ ബാച്ചുകൾ ആരംഭിക്കുന്നു — നേരത്തെ എൻറോൾ ചെയ്താൽ പ്രത്യേക ഡിസ്കൗണ്ട്!",
    link: "/en/courses",
    active: true,
    sortOrder: 0,
  },
  {
    textEn: "Free career guidance workshop on July 30th at Thodupuzha campus. Limited seats!",
    textMl: "ജൂലൈ 30ന് തൊടുപുഴ ക്യാമ്പസിൽ സൗജന്യ കരിയർ ഗൈഡൻസ് വർക്ക്ഷോപ്പ്. പരിമിതമായ സീറ്റുകൾ!",
    link: null,
    active: true,
    sortOrder: 1,
  },
  {
    textEn: "95% placement rate achieved for 2024 batch — congratulations to all placed students!",
    textMl: "2024 ബാച്ചിന് 95% പ്ലേസ്മെന്റ് നിരക്ക് കൈവരിച്ചു — എല്ലാ വിദ്യാർത്ഥികൾക്കും അഭിനന്ദനങ്ങൾ!",
    link: "/en/placement",
    active: true,
    sortOrder: 2,
  },
  {
    textEn: 'ISO 9001:2015 certified — quality education you can trust. Visit our campus today!',
    textMl: "ഐഎസ്ഒ 9001:2015 സർട്ടിഫൈഡ് — വിശ്വസിക്കാവുന്ന ഗുണനിലവാര വിദ്യാഭ്യാസം. ഞങ്ങളുടെ ക്യാമ്പസ് ഇന്ന് സന്ദർശിക്കൂ!",
    link: null,
    active: true,
    sortOrder: 3,
  },
];

/* ── Gallery Items ── */
export interface GalleryItemSeed {
  categorySlug: string;
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  captionEn: string;
  captionMl: string | null;
  sortOrder: number;
}

export const GALLERY_ITEMS: GalleryItemSeed[] = [
  // Campus & Facilities
  {
    categorySlug: "campus",
    mediaType: "IMAGE",
    url: "gallery/campus/campus-front-view.png",
    captionEn: "G-TEC Thodupuzha campus front view",
    captionMl: "ജി-ടെക് തൊടുപുഴ ക്യാമ്പസ് മുൻവശം",
    sortOrder: 0,
  },
  {
    categorySlug: "campus",
    mediaType: "IMAGE",
    url: "gallery/campus/computer-lab.png",
    captionEn: "State-of-the-art computer lab with latest workstations",
    captionMl: "അത്യാധുനിക കമ്പ്യൂട്ടർ ലാബ്",
    sortOrder: 1,
  },
  // Events & Activities
  {
    categorySlug: "events",
    mediaType: "IMAGE",
    url: "gallery/events/annual-day-2024.png",
    captionEn: "Annual Day celebrations — December 2024",
    captionMl: "വാർഷികാഘോഷം — ഡിസംബർ 2024",
    sortOrder: 0,
  },
  {
    categorySlug: "events",
    mediaType: "IMAGE",
    url: "gallery/events/career-guidance-workshop.png",
    captionEn: "Career guidance workshop with industry experts",
    captionMl: "വ്യവസായ വിദഗ്ധരുമൊത്തുള്ള കരിയർ ഗൈഡൻസ് വർക്ക്‌ഷോപ്പ്",
    sortOrder: 1,
  },
  // Placement & Support
  {
    categorySlug: "placement",
    mediaType: "IMAGE",
    url: "gallery/placement/certificate-distribution.png",
    captionEn: "Certificate distribution ceremony for placed candidates",
    captionMl: "പ്ലേസ്ഡ് ഉദ്യോഗാർത്ഥികൾക്കുള്ള സർട്ടിഫിക്കറ്റ് വിതരണ ചടങ്ങ്",
    sortOrder: 0,
  },
  {
    categorySlug: "placement",
    mediaType: "IMAGE",
    url: "gallery/placement/mock-interview-session.png",
    captionEn: "Mock interview session preparing students for placements",
    captionMl: "പ്ലേസ്മെന്റിനായി വിദ്യാർത്ഥികളെ തയ്യാറാക്കുന്ന മോക്ക് ഇന്റർവ്യൂ സെഷൻ",
    sortOrder: 1,
  },
  // Classroom Sessions
  {
    categorySlug: "classroom",
    mediaType: "IMAGE",
    url: "gallery/classroom/python-batch.png",
    captionEn: "Python programming batch in progress",
    captionMl: "പൈത്തൺ പ്രോഗ്രാമിംഗ് ബാച്ച് പുരോഗമിക്കുന്നു",
    sortOrder: 0,
  },
  {
    categorySlug: "classroom",
    mediaType: "IMAGE",
    url: "gallery/classroom/tally-training.png",
    captionEn: "Hands-on Tally training session",
    captionMl: "പ്രായോഗിക ടാലി പരിശീലന സെഷൻ",
    sortOrder: 1,
  },
];

/* ── Placement Support Gallery Items (homepage section) ── */
export const PLACEMENT_SUPPORT_GALLERY_ITEMS: GalleryItemSeed[] = [
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/job-fair-2024.png",
    captionEn: "Annual Job Fair — 50+ companies participated in 2024",
    captionMl: "വാർഷിക തൊഴിൽ മേള — 2024ൽ 50+ കമ്പനികൾ പങ്കെടുത്തു",
    sortOrder: 0,
  },
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/student-placed-infosys.png",
    captionEn: "Our student placed at Infosys as Systems Engineer",
    captionMl: "ഞങ്ങളുടെ വിദ്യാർത്ഥി ഇൻഫോസിസിൽ സിസ്റ്റംസ് എഞ്ചിനീയറായി നിയമിതനായി",
    sortOrder: 1,
  },
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/campus-drive.png",
    captionEn: "On-campus recruitment drive by leading MNC",
    captionMl: "പ്രമുഖ എംഎൻസിയുടെ ക്യാമ്പസ് റിക്രൂട്ട്മെന്റ് ഡ്രൈവ്",
    sortOrder: 2,
  },
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/offer-letter-moment.png",
    captionEn: "A proud moment — student receives offer letter",
    captionMl: "അഭിമാന നിമിഷം — വിദ്യാർത്ഥിക്ക് ഓഫർ ലെറ്റർ ലഭിക്കുന്നു",
    sortOrder: 3,
  },
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/resume-workshop.png",
    captionEn: "Resume building workshop for final-year students",
    captionMl: "അവസാന വർഷ വിദ്യാർത്ഥികൾക്കുള്ള റെസ്യുമെ നിർമ്മാണ വർക്ക്ഷോപ്പ്",
    sortOrder: 4,
  },
  {
    categorySlug: "placement-support",
    mediaType: "IMAGE",
    url: "gallery/placement-support/alumni-meet.png",
    captionEn: "Alumni meet — placed students share experiences",
    captionMl: "അലുംനി മീറ്റ് — പ്ലേസ്ഡ് വിദ്യാർത്ഥികൾ അനുഭവങ്ങൾ പങ്കിടുന്നു",
    sortOrder: 5,
  },
];

/* ── Skills ── */
export interface SkillSeed {
  label: string;
  status: "APPROVED" | "PENDING";
}

export const SKILLS: SkillSeed[] = [
  { label: "JavaScript", status: "APPROVED" },
  { label: "Python", status: "APPROVED" },
  { label: "React", status: "APPROVED" },
  { label: "Node.js", status: "APPROVED" },
  { label: "TypeScript", status: "APPROVED" },
  { label: "Java", status: "APPROVED" },
  { label: "C++", status: "APPROVED" },
  { label: "SQL", status: "APPROVED" },
  { label: "Tally ERP 9", status: "APPROVED" },
  { label: "Adobe Photoshop", status: "APPROVED" },
  { label: "Adobe Illustrator", status: "APPROVED" },
  { label: "Digital Marketing", status: "APPROVED" },
  { label: "SEO", status: "APPROVED" },
  { label: "Data Analysis", status: "APPROVED" },
  { label: "Machine Learning", status: "APPROVED" },
  { label: "Communication Skills", status: "APPROVED" },
  { label: "Leadership", status: "APPROVED" },
  { label: "Microsoft Excel", status: "APPROVED" },
  { label: "HTML & CSS", status: "APPROVED" },
  { label: "Git & GitHub", status: "APPROVED" },
];

/* ── Student Records ── */
export interface StudentRecordSeed {
  studentId: string;
  fullName: string;
  phone: string;
  email: string | null;
}

export const STUDENT_RECORDS: StudentRecordSeed[] = [
  {
    studentId: "GTC2024001",
    fullName: "Anandhu Krishnan",
    phone: "+919876543210",
    email: "anandhu.k@example.com",
  },
  {
    studentId: "GTC2024002",
    fullName: "Meera S Nair",
    phone: "+919876543211",
    email: "meera.nair@example.com",
  },
  {
    studentId: "GTC2024003",
    fullName: "Rahul P Raj",
    phone: "+919876543212",
    email: null,
  },
  {
    studentId: "GTC2024004",
    fullName: "Aiswarya T S",
    phone: "+919876543213",
    email: "aiswarya.ts@example.com",
  },
  {
    studentId: "GTC2024005",
    fullName: "Mohammed Faisal",
    phone: "+919876543214",
    email: null,
  },
];

/* ── Job Postings (seed employer) ── */
export interface JobPostingSeed {
  title: string;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryVisibility: "DISCLOSE" | "PRIVATE";
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  skillLabels: string[];
  applicationDeadlineDaysFromNow: number;
  description: string;
}

export const SEED_EMPLOYER = {
  id: "cl_seed_employer_001",
  userId: "cl_seed_employer_user_001",
  companyName: "TechVantage Solutions Pvt Ltd",
  industrySector: "IT_SOFTWARE" as const,
  contactPersonName: "Suresh Kumar",
  designation: "HR Manager",
  phone: "+919876543300",
  email: "hr@techvantage.example.com",
  companyAddress: "3rd Floor, KMV Arcade, Thodupuzha, Idukki, Kerala - 685584",
  websiteUrl: "https://www.techvantage.example.com",
  employeeCountRange: "RANGE_51_200" as const,
  aboutCompany:
    "TechVantage Solutions is a leading IT services company based in Thodupuzha, providing software development, digital marketing, and IT consulting services to clients across India and the Middle East. We are an ISO 9001:2015 certified company with a team of 120+ professionals.",
};

export const SEED_JOB_POSTINGS: JobPostingSeed[] = [
  {
    title: "Junior Software Developer",
    department: "Engineering",
    salaryMin: 250000,
    salaryMax: 400000,
    salaryVisibility: "DISCLOSE",
    jobType: "FULL_TIME",
    skillLabels: ["JavaScript", "React", "Node.js", "SQL"],
    applicationDeadlineDaysFromNow: 30,
    description:
      "We are looking for a passionate Junior Software Developer to join our engineering team. You will work on building and maintaining web applications using modern JavaScript technologies. Responsibilities:\n\n- Develop and maintain web applications using React and Node.js\n- Write clean, testable, and efficient code\n- Collaborate with senior developers on architecture decisions\n- Participate in code reviews and team meetings\n- Troubleshoot and debug applications\n\nRequirements:\n- Strong knowledge of JavaScript/TypeScript\n- Experience with React and Node.js\n- Understanding of REST APIs and SQL databases\n- Good problem-solving skills\n- Bachelor's degree in Computer Science or related field\n- 0-1 year of experience (freshers welcome)",
  },
  {
    title: "Graphic Designer",
    department: "Creative",
    salaryMin: 200000,
    salaryMax: 350000,
    salaryVisibility: "DISCLOSE",
    jobType: "FULL_TIME",
    skillLabels: ["Adobe Photoshop", "Adobe Illustrator", "HTML & CSS"],
    applicationDeadlineDaysFromNow: 25,
    description:
      "We are seeking a creative Graphic Designer to join our creative team. You will create visual content for digital and print media, including social media graphics, brochures, website designs, and branding materials.\n\nResponsibilities:\n- Design marketing materials, social media graphics, and website assets\n- Create brand identity elements and maintain brand consistency\n- Collaborate with marketing and content teams\n- Prepare print-ready files and digital assets\n- Stay updated with design trends and tools\n\nRequirements:\n- Proficiency in Adobe Creative Suite (Photoshop, Illustrator, InDesign)\n- Strong understanding of typography, color theory, and layout design\n- Basic knowledge of HTML/CSS is a plus\n- Diploma/Degree in Graphic Design or related field\n- 0-2 years of experience",
  },
  {
    title: "Digital Marketing Associate",
    department: "Marketing",
    salaryMin: 180000,
    salaryMax: 300000,
    salaryVisibility: "DISCLOSE",
    jobType: "FULL_TIME",
    skillLabels: ["Digital Marketing", "SEO", "Communication Skills"],
    applicationDeadlineDaysFromNow: 20,
    description:
      "Join our marketing team as a Digital Marketing Associate. You will manage social media accounts, run paid ad campaigns, optimize content for SEO, and track campaign performance.\n\nResponsibilities:\n- Manage and grow social media presence across platforms\n- Plan and execute digital marketing campaigns\n- Perform keyword research and SEO optimization\n- Analyze campaign metrics and prepare reports\n- Create engaging content for blogs and social media\n\nRequirements:\n- Knowledge of SEO, SEM, and social media marketing\n- Experience with Google Analytics and Meta Ads Manager\n- Strong written and verbal communication skills\n- Creative thinking and attention to detail\n- 0-1 year of experience (freshers with certification welcome)",
  },
  {
    title: "Accounts Assistant",
    department: "Finance",
    salaryMin: 180000,
    salaryMax: 300000,
    salaryVisibility: "DISCLOSE",
    jobType: "FULL_TIME",
    skillLabels: ["Tally ERP 9", "Microsoft Excel"],
    applicationDeadlineDaysFromNow: 30,
    description:
      "We are hiring an Accounts Assistant to join our finance team. You will assist in day-to-day accounting operations, including bookkeeping, GST filing, invoicing, and financial reporting.\n\nResponsibilities:\n- Maintain day-to-day accounts and bookkeeping in Tally\n- Process invoices, payments, and expense reports\n- Assist in GST filing and TDS returns\n- Bank reconciliation and ledger maintenance\n- Support month-end and year-end closing processes\n\nRequirements:\n- Proficiency in Tally ERP 9 / Prime\n- Knowledge of GST and basic accounting principles\n- Good MS Excel skills\n- B.Com or equivalent qualification\n- 0-2 years of experience (freshers welcome)",
  },
  {
    title: "Customer Support Executive",
    department: "Operations",
    salaryMin: 180000,
    salaryMax: 280000,
    salaryVisibility: "PRIVATE",
    jobType: "FULL_TIME",
    skillLabels: ["Communication Skills", "Microsoft Excel"],
    applicationDeadlineDaysFromNow: 35,
    description:
      "We are looking for a friendly and professional Customer Support Executive to handle customer inquiries via phone and email. You will resolve issues, provide product information, and ensure customer satisfaction.\n\nResponsibilities:\n- Handle inbound customer calls and emails\n- Resolve customer complaints and escalate when needed\n- Maintain detailed records of customer interactions\n- Provide product/service information to customers\n- Meet daily/weekly support targets\n\nRequirements:\n- Excellent verbal and written communication skills in English and Malayalam\n- Basic computer knowledge and MS Office skills\n- Patient and empathetic attitude\n- Ability to work in shifts if required\n- 10+2 or equivalent qualification\n- 0-1 year of experience (freshers welcome)",
  },
  {
    title: "Part-time Python Tutor",
    department: "Training",
    salaryMin: null,
    salaryMax: null,
    salaryVisibility: "PRIVATE",
    jobType: "PART_TIME",
    skillLabels: ["Python", "Communication Skills"],
    applicationDeadlineDaysFromNow: 15,
    description:
      "We are looking for a part-time Python Programming Tutor to train our team members on Python basics. Sessions will be conducted 3 days a week in the evening.\n\nResponsibilities:\n- Conduct Python programming training sessions\n- Create exercises and assignments for trainees\n- Evaluate trainee progress and provide feedback\n- Cover Python fundamentals, OOP, data structures, and basic libraries\n\nRequirements:\n- Strong knowledge of Python programming\n- Prior teaching/training experience preferred\n- Good communication and presentation skills\n- Patience and ability to explain complex concepts simply\n- Diploma/Degree in Computer Science or related field",
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.nameEn);
export const ALL_COURSE_TITLES = COURSES.map((c) => c.titleEn);
export const ALL_PARTNER_NAMES = CERTIFICATION_PARTNERS.map((p) => p.name);
