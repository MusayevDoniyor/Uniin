// Curated presets for onboarding & profile editors.

export const EC_CATEGORIES = [
  "Academic", "Research", "Leadership", "Community Service",
  "Sports", "Arts & Music", "Entrepreneurship", "Tech & Coding",
  "Competition / Olympiad", "Work / Internship", "Other",
] as const;

export type ECCategory = typeof EC_CATEGORIES[number];

export const INTEREST_PRESETS: string[] = [
  // Tech
  "Machine Learning","Artificial Intelligence","Web Development","Mobile Apps",
  "Cybersecurity","Cloud Computing","Data Science","Robotics","Game Development",
  "Blockchain","UI/UX Design","DevOps",
  // STEM
  "Mathematics","Physics","Chemistry","Biology","Astronomy","Genetics",
  "Neuroscience","Quantum Computing",
  // Humanities & social
  "Philosophy","Psychology","History","Linguistics","Politics","Economics",
  "Public Speaking","Debate","Journalism","Creative Writing",
  // Arts
  "Photography","Drawing","Painting","Graphic Design","Music Production",
  "Film","Animation","Theater","Dance",
  // Sports & life
  "Football","Basketball","Tennis","Chess","Swimming","Running","Hiking",
  "Volunteering","Sustainability","Travel","Reading","Languages",
  // Business
  "Entrepreneurship","Marketing","Finance","Investing","Product Management",
];

export const CERTIFICATE_PRESETS = [
  "IELTS Academic","IELTS General","TOEFL iBT","Duolingo English Test",
  "SAT","SAT Subject Test","ACT","GRE","GMAT","AP Exam","A-Level","IB Diploma",
  "Cambridge English (CAE/CPE)","Goethe-Zertifikat (German)","DELF/DALF (French)",
  "TOPIK (Korean)","JLPT (Japanese)","HSK (Chinese)",
  "AWS Certified","Google Cloud Certificate","Microsoft Azure Certificate",
  "Coursera Certificate","edX MicroMasters","Kaggle Competition",
  "Hackathon Winner","Olympiad Medal","Research Publication","Other",
] as const;

export const GENDER_OPTIONS = [
  { value: "male",   label: "Erkak" },
  { value: "female", label: "Ayol" },
  { value: "other",  label: "Boshqa" },
  { value: "prefer_not", label: "Aytmaslikni afzal ko'raman" },
] as const;
