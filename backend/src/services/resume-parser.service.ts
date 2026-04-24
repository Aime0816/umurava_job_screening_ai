import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';
import { ICandidate } from '../models/candidate.model';

type PartialCandidate = Partial<ICandidate>;
type CandidateSource = ICandidate['source'];

/**
 * Extracts structured candidate data from a PDF CV/resume.
 * Uses local PDF text parsing heuristics only.
 */
export async function parsePdfResume(filePath: string): Promise<PartialCandidate> {
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);
  const text = parsed.text?.trim() || '';

  logger.debug('Parsed PDF text length:', text.length);

  if (!text) {
    throw new Error('Unable to extract readable text from PDF');
  }

  const filename = path.basename(filePath);
  return normalizeJsonProfile({ ...extractCandidateFromText(text, filename), source: 'pdf' });
}

function extractCandidateFromText(text: string, filename: string): PartialCandidate {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const nameLine = lines[0] || filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  const nameParts = nameLine.split(/\s+/);
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || 'Candidate';

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const locationMatch = text.match(/(?:location|based in|city)[:\s]+([^\n,]+(?:,\s*[^\n]+)?)/i)
    || text.match(/([A-Z][a-z]+,\s*[A-Z][a-z]+)/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);

  const skillsSection = extractSection(text, ['skills', 'technical skills', 'technologies', 'tech stack']);
  const skillNames = extractSkillNames(skillsSection || text);
  const expSection = extractSection(text, ['experience', 'work experience', 'employment']);
  const experience = parseExperienceSection(expSection || '');
  const eduSection = extractSection(text, ['education', 'academic', 'qualification']);
  const education = parseEducationSection(eduSection || '');

  const headline = lines[1] && lines[1].length < 100
    ? lines[1]
    : skillNames.length > 0
      ? `${skillNames[0]} Professional`
      : 'Software Professional';

  return {
    firstName,
    lastName,
    email: emailMatch ? emailMatch[0].toLowerCase() : `${slugify(firstName)}.${Date.now()}@imported.cv`,
    headline,
    location: locationMatch ? locationMatch[1].trim() : 'Remote',
    skills: skillNames.slice(0, 15).map(name => ({
      name,
      level: 'Intermediate' as const,
      yearsOfExperience: 2,
    })),
    experience: experience.length > 0 ? experience : [{
      company: 'Previous Employer',
      role: 'Professional',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Extracted from CV',
      technologies: skillNames.slice(0, 3),
      isCurrent: true,
    }],
    education: education.length > 0 ? education : [{
      institution: 'Unknown University',
      degree: "Bachelor's",
      fieldOfStudy: 'Computer Science',
      startYear: 2016,
      endYear: 2020,
    }],
    projects: [],
    availability: { status: 'Open to Opportunities', type: 'Full-time' },
    certifications: [],
    socialLinks: {
      ...(linkedinMatch ? { linkedin: `https://${linkedinMatch[0]}` } : {}),
      ...(githubMatch ? { github: `https://${githubMatch[0]}` } : {}),
    },
    source: 'pdf' as const,
  };
}

function extractSection(text: string, headers: string[]): string | null {
  const pattern = new RegExp(
    `(?:${headers.join('|')})[:\\s]*\\n([\\s\\S]{20,800}?)(?=\\n[A-Z][A-Z\\s]{3,}:|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? match[1] : null;
}

function extractSkillNames(text: string): string[] {
  const knownSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby',
    'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Node.js', 'Express', 'Django', 'FastAPI',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'GraphQL', 'REST', 'gRPC', 'Kafka', 'RabbitMQ',
    'Git', 'Linux', 'Nginx', 'Machine Learning', 'TensorFlow', 'PyTorch',
  ];

  const found: string[] = [];
  knownSkills.forEach(skill => {
    if (new RegExp(skill, 'i').test(text)) found.push(skill);
  });

  const commaItems = text.match(/(?:[A-Za-z+#.]+(?:\s[A-Za-z+#.]+)?(?:,|\s*[•·]|\s*\||\s*\/)\s*){2,}/g);
  if (commaItems) {
    commaItems.forEach(chunk => {
      chunk.split(/[,•·|/]/).forEach(item => {
        const trimmed = item.trim();
        if (trimmed.length > 1 && trimmed.length < 30 && !found.includes(trimmed)) {
          found.push(trimmed);
        }
      });
    });
  }

  return [...new Set(found)];
}

function parseExperienceSection(text: string): ICandidate['experience'] {
  const results: ICandidate['experience'] = [];
  const rolePatterns = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:at|@|\|)\s+([A-Za-z\s]+)/g);
  if (!rolePatterns) return results;

  rolePatterns.slice(0, 3).forEach(match => {
    const parts = match.split(/\s+(?:at|@|\|)\s+/);
    results.push({
      company: (parts[1] || 'Company').trim(),
      role: (parts[0] || 'Role').trim(),
      startDate: '2020-01',
      endDate: 'Present',
      description: '',
      technologies: [],
      isCurrent: results.length === 0,
    });
  });

  return results;
}

function parseEducationSection(text: string): ICandidate['education'] {
  const results: ICandidate['education'] = [];
  const degreeMatch = text.match(/(bachelor|master|phd|associate|bsc|msc|mba)[^\n]*/gi);
  if (!degreeMatch) return results;

  degreeMatch.slice(0, 2).forEach(match => {
    const yearMatch = match.match(/\b(19|20)\d{2}\b/g);
    results.push({
      institution: 'University',
      degree: match.toLowerCase().includes('master')
        ? "Master's"
        : match.toLowerCase().includes('phd')
          ? 'PhD'
          : "Bachelor's",
      fieldOfStudy: 'Computer Science',
      startYear: yearMatch ? parseInt(yearMatch[0], 10) : 2016,
      endYear: yearMatch && yearMatch[1] ? parseInt(yearMatch[1], 10) : 2020,
    });
  });

  return results;
}

/**
 * Parse CSV or Excel file containing candidate data.
 * Expects columns matching the Talent Profile Schema fields.
 */
export function parseCsvOrExcel(filePath: string): PartialCandidate[] {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, string>[];

  logger.debug(`Parsed ${rows.length} rows from ${ext} file`);

  return rows.map((row, i) => normalizeJsonProfile(mapRowToCandidate(row, i) as Record<string, unknown>));
}

function mapRowToCandidate(row: Record<string, string>, index: number): PartialCandidate {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const val = row[key] || row[key.toLowerCase()] || row[key.toUpperCase()];
      if (val) return String(val).trim();
    }
    return '';
  };

  const skillsRaw = get('skills', 'Skills', 'technical_skills', 'TechnicalSkills');
  const skills = skillsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean).map(name => ({
    name,
    level: (get('skill_level', 'SkillLevel') as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') || 'Intermediate',
    yearsOfExperience: parseInt(get('years_experience', 'YearsExperience', 'experience_years') || '2', 10) || 2,
  }));

  const firstName = get('firstName', 'first_name', 'FirstName', 'first');
  const lastName = get('lastName', 'last_name', 'LastName', 'last');
  const email = get('email', 'Email', 'email_address') || `candidate${index}@imported.csv`;

  return {
    firstName: firstName || 'Candidate',
    lastName: lastName || `${index + 1}`,
    email,
    headline: get('headline', 'Headline', 'title', 'job_title', 'Title') || 'Professional',
    bio: get('bio', 'Bio', 'summary', 'about'),
    location: get('location', 'Location', 'city', 'country') || 'Remote',
    skills: skills.length > 0 ? skills : [{ name: 'General', level: 'Intermediate', yearsOfExperience: 2 }],
    experience: [{
      company: get('company', 'Company', 'employer', 'current_company') || 'Previous Company',
      role: get('role', 'Role', 'position', 'job_title') || 'Professional',
      startDate: get('start_date', 'StartDate', 'start') || '2020-01',
      endDate: get('end_date', 'EndDate', 'end') || 'Present',
      description: get('description', 'Description', 'responsibilities'),
      technologies: [],
      isCurrent: true,
    }],
    education: [{
      institution: get('institution', 'Institution', 'university', 'school') || 'University',
      degree: get('degree', 'Degree', 'qualification') || "Bachelor's",
      fieldOfStudy: get('field_of_study', 'FieldOfStudy', 'major', 'field') || 'Computer Science',
      startYear: parseInt(get('edu_start_year', 'EduStartYear', 'graduation_start') || '2016', 10),
      endYear: parseInt(get('edu_end_year', 'EduEndYear', 'graduation_year', 'graduation') || '2020', 10),
    }],
    projects: [],
    availability: {
      status: (get('availability', 'Availability', 'status') as 'Available' | 'Open to Opportunities' | 'Not Available') || 'Open to Opportunities',
      type: (get('type', 'Type', 'employment_type', 'EmploymentType') as 'Full-time' | 'Part-time' | 'Contract') || 'Full-time',
    },
    source: 'csv' as const,
  };
}

/**
 * Validate and normalize a raw JSON candidate profile against the Talent Profile Schema.
 */
export function normalizeJsonProfile(raw: Record<string, unknown>): PartialCandidate {
  const fullName = String(raw.fullName || raw.name || '').trim();
  const [derivedFirstName, ...restName] = fullName ? fullName.split(/\s+/) : [];
  const firstName = String(raw.firstName || derivedFirstName || '').trim() || 'Unknown';
  const lastName = String(raw.lastName || restName.join(' ') || '').trim() || 'Candidate';
  const skills = normalizeSkills(raw.skills);
  const experience = normalizeExperience(raw.experience);
  const education = normalizeEducation(raw.education);
  const certifications = normalizeCertifications(raw.certifications);
  const projects = normalizeProjects(raw.projects);
  const availability = normalizeAvailability(raw.availability);
  const socialLinks = normalizeSocialLinks(raw.socialLinks);
  const source = normalizeSource(raw.source);

  return {
    firstName,
    lastName,
    email: normalizeEmail(raw.email, firstName, lastName),
    headline: String(raw.headline || raw.title || `${firstName} ${lastName}`).trim(),
    bio: raw.bio ? String(raw.bio) : undefined,
    location: String(raw.location || raw.city || raw.country || 'Remote').trim(),
    skills,
    languages: Array.isArray(raw.languages) ? raw.languages as ICandidate['languages'] : undefined,
    experience,
    education,
    certifications: certifications.length > 0 ? certifications : undefined,
    projects,
    availability,
    socialLinks,
    source,
  };
}

function normalizeEmail(email: unknown, firstName: string, lastName: string): string {
  const normalized = String(email || '').trim().toLowerCase();
  if (normalized) return normalized;

  return `${slugify(firstName)}.${slugify(lastName)}.${Date.now()}@imported.cv`;
}

function normalizeSkills(skills: unknown): ICandidate['skills'] {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [{ name: 'General', level: 'Intermediate', yearsOfExperience: 1 }];
  }

  return skills
    .map((skill) => {
      if (typeof skill === 'string') {
        return { name: skill.trim(), level: 'Intermediate' as const, yearsOfExperience: 1 };
      }

      if (typeof skill !== 'object' || skill === null) return null;
      const value = skill as Record<string, unknown>;
      const name = String(value.name || '').trim();
      if (!name) return null;

      return {
        name,
        level: normalizeSkillLevel(value.level),
        yearsOfExperience: normalizeYears(value.yearsOfExperience),
      };
    })
    .filter((skill): skill is ICandidate['skills'][number] => Boolean(skill));
}

function normalizeExperience(experience: unknown): ICandidate['experience'] {
  if (!Array.isArray(experience)) return [];

  return experience
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const value = item as Record<string, unknown>;
      const role = String(value.role || '').trim();
      const company = String(value.company || '').trim();
      if (!role && !company) return null;

      const endDate = normalizeMonth(value.endDate, 'Present');

      return {
        company: company || 'Unknown Company',
        role: role || 'Professional',
        startDate: normalizeMonth(value.startDate),
        endDate,
        description: String(value.description || '').trim(),
        technologies: Array.isArray(value.technologies)
          ? value.technologies.map((tech) => String(tech).trim()).filter(Boolean)
          : [],
        isCurrent: endDate === 'Present' || Boolean(value.isCurrent),
      };
    })
    .filter(Boolean) as ICandidate['experience'];
}

function normalizeEducation(education: unknown): ICandidate['education'] {
  if (!Array.isArray(education) || education.length === 0) {
    return [{
      institution: 'Unknown Institution',
      degree: "Bachelor's",
      fieldOfStudy: 'General Studies',
      startYear: 2016,
      endYear: 2020,
    }];
  }

  return education
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const value = item as Record<string, unknown>;
      const institution = String(value.institution || '').trim();
      const degree = String(value.degree || '').trim();
      if (!institution && !degree) return null;

      return {
        institution: institution || 'Unknown Institution',
        degree: degree || "Bachelor's",
        fieldOfStudy: String(value.fieldOfStudy || 'General Studies').trim(),
        startYear: normalizeYear(value.startYear, 2016),
        endYear: normalizeOptionalYear(value.endYear),
      };
    })
    .filter(Boolean) as ICandidate['education'];
}

function normalizeCertifications(certifications: unknown): NonNullable<ICandidate['certifications']> {
  if (!Array.isArray(certifications)) return [];

  return certifications
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const value = item as Record<string, unknown>;
      const name = String(value.name || '').trim();
      if (!name) return null;

      return {
        name,
        issuer: String(value.issuer || 'Unknown Issuer').trim(),
        issueDate: value.issueDate ? normalizeMonth(value.issueDate) : undefined,
      };
    })
    .filter(Boolean) as NonNullable<ICandidate['certifications']>;
}

function normalizeProjects(projects: unknown): ICandidate['projects'] {
  if (!Array.isArray(projects)) return [];

  return projects
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const value = item as Record<string, unknown>;
      const name = String(value.name || '').trim();
      if (!name) return null;

      return {
        name,
        description: String(value.description || '').trim(),
        technologies: Array.isArray(value.technologies)
          ? value.technologies.map((tech) => String(tech).trim()).filter(Boolean)
          : [],
        role: value.role ? String(value.role).trim() : undefined,
        link: value.link ? String(value.link).trim() : undefined,
        startDate: value.startDate ? normalizeMonth(value.startDate) : undefined,
        endDate: value.endDate ? normalizeMonth(value.endDate, 'Present') : undefined,
      };
    })
    .filter(Boolean) as ICandidate['projects'];
}

function normalizeAvailability(availability: unknown): ICandidate['availability'] {
  if (typeof availability !== 'object' || availability === null) {
    return { status: 'Open to Opportunities', type: 'Full-time' };
  }

  const value = availability as Record<string, unknown>;
  return {
    status: normalizeAvailabilityStatus(value.status),
    type: normalizeEmploymentType(value.type),
    ...(value.startDate ? { startDate: String(value.startDate).trim() } : {}),
  };
}

function normalizeSocialLinks(socialLinks: unknown): ICandidate['socialLinks'] | undefined {
  if (typeof socialLinks !== 'object' || socialLinks === null) return undefined;
  return socialLinks as ICandidate['socialLinks'];
}

function normalizeSource(source: unknown): CandidateSource {
  return source === 'pdf' || source === 'csv' || source === 'manual' ? source : 'json';
}

function normalizeSkillLevel(level: unknown): ICandidate['skills'][number]['level'] {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('expert')) return 'Expert';
  if (normalized.includes('advanced')) return 'Advanced';
  if (normalized.includes('beginner') || normalized.includes('basic')) return 'Beginner';
  return 'Intermediate';
}

function normalizeAvailabilityStatus(status: unknown): ICandidate['availability']['status'] {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('not')) return 'Not Available';
  if (normalized.includes('available')) return 'Available';
  return 'Open to Opportunities';
}

function normalizeEmploymentType(type: unknown): ICandidate['availability']['type'] {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('part')) return 'Part-time';
  if (normalized.includes('contract')) return 'Contract';
  return 'Full-time';
}

function normalizeYears(value: unknown): number {
  const years = Number(value);
  if (Number.isFinite(years) && years >= 0) return years;
  return 1;
}

function normalizeYear(value: unknown, fallback: number): number {
  const year = Number(value);
  return Number.isInteger(year) && year > 1900 ? year : fallback;
}

function normalizeOptionalYear(value: unknown): number | undefined {
  const year = Number(value);
  return Number.isInteger(year) && year > 1900 ? year : undefined;
}

function normalizeMonth(value: unknown, fallback = '2020-01'): string {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (/^present$/i.test(normalized)) return 'Present';

  const fullMatch = normalized.match(/\b(19|20)\d{2}-(0[1-9]|1[0-2])\b/);
  if (fullMatch) return fullMatch[0];

  const yearOnly = normalized.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) return `${yearOnly[0]}-01`;

  return fallback;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'candidate';
}
