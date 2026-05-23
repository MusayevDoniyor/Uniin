// Top universities (abridged QS 2024 list — extend as needed)
export type University = { name: string; country: string; flag: string; qsRank: number; acceptance?: number };

export const UNIVERSITIES: University[] = [
  { name: "Massachusetts Institute of Technology (MIT)", country: "USA", flag: "🇺🇸", qsRank: 1, acceptance: 4 },
  { name: "University of Cambridge", country: "UK", flag: "🇬🇧", qsRank: 2, acceptance: 21 },
  { name: "University of Oxford", country: "UK", flag: "🇬🇧", qsRank: 3, acceptance: 17 },
  { name: "Harvard University", country: "USA", flag: "🇺🇸", qsRank: 4, acceptance: 3 },
  { name: "Stanford University", country: "USA", flag: "🇺🇸", qsRank: 5, acceptance: 4 },
  { name: "Imperial College London", country: "UK", flag: "🇬🇧", qsRank: 6, acceptance: 14 },
  { name: "ETH Zurich", country: "Switzerland", flag: "🇨🇭", qsRank: 7, acceptance: 27 },
  { name: "National University of Singapore (NUS)", country: "Singapore", flag: "🇸🇬", qsRank: 8 },
  { name: "UCL", country: "UK", flag: "🇬🇧", qsRank: 9, acceptance: 63 },
  { name: "University of California, Berkeley", country: "USA", flag: "🇺🇸", qsRank: 10, acceptance: 11 },
  { name: "University of Chicago", country: "USA", flag: "🇺🇸", qsRank: 11, acceptance: 6 },
  { name: "University of Pennsylvania", country: "USA", flag: "🇺🇸", qsRank: 12, acceptance: 6 },
  { name: "Cornell University", country: "USA", flag: "🇺🇸", qsRank: 13, acceptance: 7 },
  { name: "The University of Melbourne", country: "Australia", flag: "🇦🇺", qsRank: 14 },
  { name: "California Institute of Technology (Caltech)", country: "USA", flag: "🇺🇸", qsRank: 15, acceptance: 3 },
  { name: "Yale University", country: "USA", flag: "🇺🇸", qsRank: 16, acceptance: 5 },
  { name: "Peking University", country: "China", flag: "🇨🇳", qsRank: 17 },
  { name: "Princeton University", country: "USA", flag: "🇺🇸", qsRank: 18, acceptance: 4 },
  { name: "The University of New South Wales (UNSW)", country: "Australia", flag: "🇦🇺", qsRank: 19 },
  { name: "The University of Sydney", country: "Australia", flag: "🇦🇺", qsRank: 20 },
  { name: "University of Toronto", country: "Canada", flag: "🇨🇦", qsRank: 21, acceptance: 43 },
  { name: "Tsinghua University", country: "China", flag: "🇨🇳", qsRank: 25 },
  { name: "University of Edinburgh", country: "UK", flag: "🇬🇧", qsRank: 22 },
  { name: "Columbia University", country: "USA", flag: "🇺🇸", qsRank: 23, acceptance: 4 },
  { name: "École Polytechnique Fédérale de Lausanne", country: "Switzerland", flag: "🇨🇭", qsRank: 26 },
  { name: "University of Michigan-Ann Arbor", country: "USA", flag: "🇺🇸", qsRank: 33, acceptance: 18 },
  { name: "Johns Hopkins University", country: "USA", flag: "🇺🇸", qsRank: 28, acceptance: 7 },
  { name: "Northwestern University", country: "USA", flag: "🇺🇸", qsRank: 47, acceptance: 7 },
  { name: "New York University (NYU)", country: "USA", flag: "🇺🇸", qsRank: 38, acceptance: 12 },
  { name: "University of British Columbia", country: "Canada", flag: "🇨🇦", qsRank: 34, acceptance: 53 },
  { name: "McGill University", country: "Canada", flag: "🇨🇦", qsRank: 30, acceptance: 46 },
  { name: "Technical University of Munich (TUM)", country: "Germany", flag: "🇩🇪", qsRank: 37 },
  { name: "KAIST", country: "South Korea", flag: "🇰🇷", qsRank: 56 },
  { name: "Seoul National University", country: "South Korea", flag: "🇰🇷", qsRank: 41 },
  { name: "Korea University", country: "South Korea", flag: "🇰🇷", qsRank: 79 },
  { name: "Yonsei University", country: "South Korea", flag: "🇰🇷", qsRank: 76 },
  { name: "University of Amsterdam", country: "Netherlands", flag: "🇳🇱", qsRank: 53 },
  { name: "Delft University of Technology", country: "Netherlands", flag: "🇳🇱", qsRank: 47 },
  { name: "Sorbonne University", country: "France", flag: "🇫🇷", qsRank: 59 },
  { name: "Sciences Po", country: "France", flag: "🇫🇷", qsRank: 319 },
  { name: "Khalifa University", country: "UAE", flag: "🇦🇪", qsRank: 230 },
  { name: "New York University Abu Dhabi", country: "UAE", flag: "🇦🇪", qsRank: 1 },
  { name: "Carnegie Mellon University", country: "USA", flag: "🇺🇸", qsRank: 52 },
  { name: "Duke University", country: "USA", flag: "🇺🇸", qsRank: 50, acceptance: 6 },
  { name: "Brown University", country: "USA", flag: "🇺🇸", qsRank: 64, acceptance: 5 },
  { name: "Dartmouth College", country: "USA", flag: "🇺🇸", qsRank: 215, acceptance: 6 },
  { name: "Boston University", country: "USA", flag: "🇺🇸", qsRank: 108 },
  { name: "Georgia Institute of Technology", country: "USA", flag: "🇺🇸", qsRank: 97 },
  { name: "University of Texas at Austin", country: "USA", flag: "🇺🇸", qsRank: 58 },
  { name: "University of Washington", country: "USA", flag: "🇺🇸", qsRank: 63 },
  { name: "Purdue University", country: "USA", flag: "🇺🇸", qsRank: 99 },
];

export const COUNTRIES = [
  { code: "USA", flag: "🇺🇸", name: "USA" },
  { code: "UK", flag: "🇬🇧", name: "UK" },
  { code: "Germany", flag: "🇩🇪", name: "Germany" },
  { code: "Netherlands", flag: "🇳🇱", name: "Netherlands" },
  { code: "South Korea", flag: "🇰🇷", name: "South Korea" },
  { code: "Canada", flag: "🇨🇦", name: "Canada" },
  { code: "France", flag: "🇫🇷", name: "France" },
  { code: "UAE", flag: "🇦🇪", name: "UAE" },
  { code: "Japan", flag: "🇯🇵", name: "Japan" },
  { code: "Australia", flag: "🇦🇺", name: "Australia" },
  { code: "Switzerland", flag: "🇨🇭", name: "Switzerland" },
  { code: "Singapore", flag: "🇸🇬", name: "Singapore" },
  { code: "Other", flag: "🌍", name: "Other" },
];

export const CITIES = ["Tashkent", "Samarkand", "Fergana", "Namangan", "Bukhara", "Andijan", "Other"];

export const MAJORS = [
  "Computer Science", "Data Science", "Engineering", "Medicine", "Law", "Business",
  "Economics", "Mathematics", "Physics", "Biology", "Architecture", "Design",
  "Psychology", "International Relations", "Finance", "Environmental Science", "Other",
];

export const EXTRACURRICULARS = [
  "Robotics", "Programming", "Math Olympiad", "Physics Olympiad", "Model UN",
  "Debate", "Music", "Art", "Chess", "Volunteer Work", "Research", "Sports",
  "Student Government", "Journalism", "Entrepreneurship",
];

export const SCHOLARSHIPS = [
  { name: "El-Yurt Umidi Foundation", country: "Uzbekistan", flag: "🇺🇿", funding: "Full", level: "All", deadline: "Varies by country", url: "https://ecuf.uz", desc: "Uzbekistan government's flagship scholarship for studying abroad. Full funding for all fields." },
  { name: "Prezident Scholarship", country: "Uzbekistan", flag: "🇺🇿", funding: "Full", level: "Bachelor/Master", deadline: "Annual", url: "#", desc: "Uzbekistan presidential scholarship with STEM focus." },
  { name: "Chevening Scholarship", country: "UK", flag: "🇬🇧", funding: "Full", level: "Master", deadline: "October-November", url: "https://chevening.org", desc: "UK government scholarship for emerging leaders. Master's level study in any UK university." },
  { name: "DAAD Scholarship", country: "Germany", flag: "🇩🇪", funding: "Full", level: "All", deadline: "Varies", url: "https://daad.de", desc: "German Academic Exchange Service — full funding for studies in Germany." },
  { name: "Erasmus+", country: "EU", flag: "🇪🇺", funding: "Partial", level: "All", deadline: "Varies", url: "https://erasmus-plus.ec.europa.eu", desc: "European Union exchange and full degree scholarships." },
  { name: "Korean Government Scholarship (KGSP)", country: "South Korea", flag: "🇰🇷", funding: "Full", level: "All", deadline: "February-March", url: "https://gks.go.kr", desc: "Full funding to study in top Korean universities including KAIST, SNU." },
  { name: "OAS Scholarships", country: "USA", flag: "🇺🇸", funding: "Partial", level: "Master/PhD", deadline: "Varies", url: "https://oas.org", desc: "Organization of American States graduate scholarships." },
  { name: "MEXT Japan Scholarship", country: "Japan", flag: "🇯🇵", funding: "Full", level: "All", deadline: "May-June", url: "https://mext.go.jp", desc: "Japanese government scholarship — fully funded study in Japan." },
];
