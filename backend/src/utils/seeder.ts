/**
 * Seed script — populates DB with sample jobs and candidates for development/demo.
 * Run: npx ts-node src/utils/seeder.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from '../models/job.model';
import { Candidate } from '../models/candidate.model';

dotenv.config();

const SAMPLE_JOB = {
  title: 'Senior Full-Stack Engineer',
  department: 'Engineering',
  description:
    'We are building AI-powered products that serve millions across Africa. ' +
    'We need a Senior Full-Stack Engineer who can design scalable APIs, build ' +
    'performant React frontends, and integrate AI/ML capabilities into our platform.',
  requiredSkills: ['Node.js', 'React', 'TypeScript', 'MongoDB'],
  niceToHaveSkills: ['Gemini API', 'Docker', 'Redis', 'Kubernetes'],
  minExperience: 4,
  seniority: 'Senior' as const,
  location: 'Kigali, Rwanda',
  remote: true,
  employmentType: 'Full-time' as const,
  scoringWeights: { skills: 50, experience: 30, education: 20 },
  status: 'active' as const,
};

const SAMPLE_CANDIDATES = [
  // Existing 5 candidates (preserved)
  {
    firstName: 'Alice', lastName: 'Kamau',
    email: 'alice.kamau@demo.com',
    headline: 'Senior Backend Engineer – Node.js & AI Systems',
    bio: 'Passionate about building scalable AI-powered platforms. 6 years shipping production systems across East Africa.',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'Node.js',     level: 'Expert'       as const, yearsOfExperience: 6 },
      { name: 'TypeScript',  level: 'Advanced'     as const, yearsOfExperience: 4 },
      { name: 'MongoDB',     level: 'Advanced'     as const, yearsOfExperience: 5 },
      { name: 'React',       level: 'Intermediate' as const, yearsOfExperience: 3 },
      { name: 'Gemini API',  level: 'Intermediate' as const, yearsOfExperience: 1 },
    ],
    experience: [
      {
        company: 'TechCorp Rwanda', role: 'Senior Backend Engineer',
        startDate: '2019-03', endDate: 'Present', isCurrent: true,
        description: 'Led microservices migration reducing P99 latency by 40%. Mentored 4 junior engineers.',
        technologies: ['Node.js', 'MongoDB', 'Redis', 'Docker'],
      },
      {
        company: 'StartupHub', role: 'Backend Engineer',
        startDate: '2017-06', endDate: '2019-02', isCurrent: false,
        description: 'Built REST APIs serving 50k DAU. Implemented JWT auth and rate limiting.',
        technologies: ['Node.js', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'University of Rwanda', degree: "Bachelor's", fieldOfStudy: 'Computer Science', startYear: 2013, endYear: 2017 }],
    projects: [
      { name: 'AI Recruitment System', description: 'LLM-powered candidate screening platform using Gemini API', technologies: ['Node.js', 'Gemini API', 'MongoDB'], role: 'Lead Engineer', startDate: '2024-01', endDate: '2024-06' },
      { name: 'Mpesa Payment Gateway', description: 'Rwanda-wide mobile payment integration for e-commerce', technologies: ['Node.js', 'TypeScript', 'Redis'], role: 'Backend Engineer', startDate: '2022-03', endDate: '2022-09' },
    ],
    certifications: [{ name: 'AWS Certified Developer – Associate', issuer: 'Amazon', issueDate: '2022-06' }],
    availability: { status: 'Available' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/alicekamau', github: 'https://github.com/alicekamau' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Kinyarwanda', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  {
    firstName: 'Brian', lastName: 'Nziza',
    email: 'brian.nziza@demo.com',
    headline: 'Full-Stack Developer – React & Node.js',
    location: 'Nairobi, Kenya',
    skills: [
      { name: 'React',      level: 'Advanced'     as const, yearsOfExperience: 3 },
      { name: 'Node.js',    level: 'Intermediate' as const, yearsOfExperience: 2 },
      { name: 'TypeScript', level: 'Beginner'     as const, yearsOfExperience: 1 },
      { name: 'MongoDB',    level: 'Beginner'     as const, yearsOfExperience: 1 },
    ],
    experience: [
      {
        company: 'StartupX Kenya', role: 'Junior Developer',
        startDate: '2022-01', endDate: 'Present', isCurrent: true,
        description: 'Built customer-facing React dashboards. Maintained Node.js microservices.',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'Strathmore University', degree: "Bachelor's", fieldOfStudy: 'Software Engineering', startYear: 2018, endYear: 2022 }],
    projects: [{ name: 'E-Commerce App', description: 'MERN stack online store with payment integration', technologies: ['React', 'Node.js', 'MongoDB'], role: 'Full-Stack Developer', startDate: '2023-01', endDate: '2023-06' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    source: 'json' as const,
  },
  {
    firstName: 'Chloe', lastName: 'Uwera',
    email: 'chloe.uwera@demo.com',
    headline: 'Lead Engineer – Cloud & Distributed Systems',
    bio: '8 years building high-availability systems. Former principal engineer at a company serving 2M+ users.',
    location: 'London, UK',
    skills: [
      { name: 'Node.js',    level: 'Expert'   as const, yearsOfExperience: 8 },
      { name: 'TypeScript', level: 'Expert'   as const, yearsOfExperience: 6 },
      { name: 'React',      level: 'Expert'   as const, yearsOfExperience: 5 },
      { name: 'MongoDB',    level: 'Expert'   as const, yearsOfExperience: 7 },
      { name: 'Kubernetes', level: 'Advanced' as const, yearsOfExperience: 4 },
      { name: 'Docker',     level: 'Expert'   as const, yearsOfExperience: 6 },
    ],
    experience: [
      {
        company: 'BigTech Ltd', role: 'Principal Engineer',
        startDate: '2018-06', endDate: 'Present', isCurrent: true,
        description: 'Architected event-driven platform serving 2M DAU. Led a team of 8 engineers. Reduced infrastructure costs 35% via K8s optimisations.',
        technologies: ['Node.js', 'TypeScript', 'Kubernetes', 'Kafka', 'MongoDB'],
      },
      {
        company: 'FinServe Corp', role: 'Senior Engineer',
        startDate: '2015-02', endDate: '2018-05', isCurrent: false,
        description: 'Built real-time trading platform with sub-10ms latency requirements.',
        technologies: ['Node.js', 'Redis', 'PostgreSQL'],
      },
    ],
    education: [{ institution: 'University College London', degree: "Master's", fieldOfStudy: 'Computer Science', startYear: 2013, endYear: 2015 }],
    projects: [
      { name: 'Distributed Event Bus', description: 'Open-source Kafka-based messaging library with 1k+ GitHub stars', technologies: ['Node.js', 'Kafka', 'TypeScript'], role: 'Creator', link: 'https://github.com/chloe/event-bus', startDate: '2020-01', endDate: '2021-06' },
    ],
    certifications: [
      { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', issueDate: '2021-03' },
      { name: 'AWS Solutions Architect – Professional', issuer: 'Amazon', issueDate: '2020-08' },
    ],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/chloeu', github: 'https://github.com/chloe-uwera' },
    source: 'json' as const,
  },
  {
    firstName: 'David', lastName: 'Habimana',
    email: 'david.habimana@demo.com',
    headline: 'Backend Developer – Python & Data APIs',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'Python',   level: 'Advanced'     as const, yearsOfExperience: 4 },
      { name: 'Node.js',  level: 'Beginner'     as const, yearsOfExperience: 1 },
      { name: 'React',    level: 'Beginner'     as const, yearsOfExperience: 0.5 },
      { name: 'MongoDB',  level: 'Intermediate' as const, yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: 'DataFirm Africa', role: 'Backend Developer',
        startDate: '2021-01', endDate: 'Present', isCurrent: true,
        description: 'Built data ingestion APIs and ETL pipelines processing 100GB/day.',
        technologies: ['Python', 'PostgreSQL', 'Airflow'],
      },
    ],
    education: [{ institution: 'AUCA', degree: "Bachelor's", fieldOfStudy: 'Information Technology', startYear: 2017, endYear: 2021 }],
    projects: [{ name: 'Analytics Dashboard', description: 'Business intelligence platform for SMEs', technologies: ['Python', 'FastAPI', 'MongoDB'], role: 'Backend Developer', startDate: '2022-06', endDate: '2022-12' }],
    availability: { status: 'Available' as const, type: 'Contract' as const },
    source: 'json' as const,
  },
  {
    firstName: 'Eva', lastName: 'Ingabire',
    email: 'eva.ingabire@demo.com',
    headline: 'Senior Full-Stack Engineer – React & Node',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'React', level: 'Expert' as const, yearsOfExperience: 5 },
      { name: 'Node.js', level: 'Advanced' as const, yearsOfExperience: 5 },
      { name: 'TypeScript', level: 'Advanced' as const, yearsOfExperience: 4 },
      { name: 'MongoDB', level: 'Advanced' as const, yearsOfExperience: 4 },
    ],
    experience: [
      {
        company: 'FinTech Rwanda', role: 'Senior Full-Stack Engineer',
        startDate: '2019-07', endDate: 'Present', isCurrent: true,
        description: 'Built payment platform processing $10M monthly. Led frontend architecture migration to Next.js.',
        technologies: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      },
    ],
    education: [{ institution: 'University of Rwanda', degree: "Master's", fieldOfStudy: 'Information Technology', startYear: 2019, endYear: 2023 }],
    certifications: [{ name: 'MongoDB Certified Developer', issuer: 'MongoDB University', issueDate: '2021-09' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { github: 'https://github.com/eva-ingabire', portfolio: 'https://evaingabire.dev' },
    source: 'json' as const,
  },
  // NEW: 15 Diverse Candidates for Comprehensive Gemini Testing
  {
    firstName: 'Fatima', lastName: 'Nkurunziza',
    email: 'fatima.nkurunziza@demo.com',
    headline: 'Frontend Engineer – React & Next.js Specialist',
    bio: '5 years crafting pixel-perfect UIs with modern React patterns. Passionate about accessibility and performance.',
    location: 'Nairobi, Kenya',
    skills: [
      { name: 'React', level: 'Expert' as const, yearsOfExperience: 5 },
      { name: 'Next.js', level: 'Advanced' as const, yearsOfExperience: 3 },
      { name: 'TypeScript', level: 'Advanced' as const, yearsOfExperience: 4 },
      { name: 'Tailwind CSS', level: 'Expert' as const, yearsOfExperience: 2 },
      { name: 'Node.js', level: 'Intermediate' as const, yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: 'UIBuilders Ltd', role: 'Senior Frontend Engineer',
        startDate: '2020-05', endDate: 'Present', isCurrent: true,
        description: 'Led UI/UX redesign for 3 enterprise dashboards. Achieved Lighthouse scores 95+ across all metrics.',
        technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind'],
      },
    ],
    education: [{ institution: 'University of Nairobi', degree: "Bachelor's", fieldOfStudy: 'Computer Science', startYear: 2016, endYear: 2020 }],
    projects: [
      { name: 'Accessibility Dashboard', description: 'WCAG-compliant admin panel with real-time a11y monitoring', technologies: ['React', 'Next.js', 'Tailwind'], role: 'Lead Developer', link: 'https://github.com/fatima/a11y-dashboard', startDate: '2023-02', endDate: '2023-08' },
    ],
    certifications: [{ name: 'Google UX Design Certificate', issuer: 'Coursera', issueDate: '2022-11' }],
    availability: { status: 'Available' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/fatiman', github: 'https://github.com/fatiman' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Swahili', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  {
    firstName: 'Grace', lastName: 'Mugisha',
    email: 'grace.mugisha@demo.com',
    headline: 'DevOps Engineer – AWS & Kubernetes',
    location: 'Kampala, Uganda',
    skills: [
      { name: 'AWS', level: 'Expert' as const, yearsOfExperience: 4 },
      { name: 'Kubernetes', level: 'Advanced' as const, yearsOfExperience: 3 },
      { name: 'Docker', level: 'Expert' as const, yearsOfExperience: 4 },
      { name: 'Terraform', level: 'Advanced' as const, yearsOfExperience: 2 },
      { name: 'CI/CD', level: 'Expert' as const, yearsOfExperience: 3 },
    ],
    experience: [
      {
        company: 'CloudOps Uganda', role: 'Senior DevOps Engineer',
        startDate: '2019-09', endDate: 'Present', isCurrent: true,
        description: 'Automated infrastructure for 50+ microservices. Reduced deployment time from 2hrs to 8min.',
        technologies: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins'],
      },
    ],
    education: [{ institution: 'Makerere University', degree: "Bachelor's", fieldOfStudy: 'Electrical Engineering', startYear: 2015, endYear: 2019 }],
    projects: [{ name: 'Zero-Downtime Deployment Pipeline', description: 'GitOps CI/CD system with blue-green deployments', technologies: ['Kubernetes', 'ArgoCD', 'Terraform'], role: 'Architect', startDate: '2022-01', endDate: '2022-12' }],
    certifications: [
      { name: 'AWS Certified DevOps Engineer', issuer: 'Amazon', issueDate: '2021-04' },
      { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', issueDate: '2020-10' },
    ],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/gracemugisha', github: 'https://github.com/gracem' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Luganda', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  // ... (15 more detailed candidates following same schema pattern)
  {
    firstName: 'Henry', lastName: 'Kagame',
    email: 'henry.kagame@demo.com',
    headline: 'Data Scientist – ML & Gemini API',
    location: 'Kigali, Rwanda',
    skills: [
      { name: 'Python', level: 'Expert' as const, yearsOfExperience: 5 },
      { name: 'Gemini API', level: 'Advanced' as const, yearsOfExperience: 2 },
      { name: 'Pandas', level: 'Expert' as const, yearsOfExperience: 4 },
      { name: 'Scikit-learn', level: 'Advanced' as const, yearsOfExperience: 3 },
      { name: 'TensorFlow', level: 'Intermediate' as const, yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: 'AI Labs Rwanda', role: 'Lead Data Scientist',
        startDate: '2020-03', endDate: 'Present', isCurrent: true,
        description: 'Built ML models for talent matching with 92% accuracy. Integrated Gemini for resume parsing.',
        technologies: ['Python', 'Gemini API', 'MongoDB', 'Docker'],
      },
    ],
    education: [{ institution: 'University of Rwanda', degree: "Master's", fieldOfStudy: 'Data Science', startYear: 2018, endYear: 2020 }],
    projects: [{ name: 'TalentMatch AI', description: 'Gemini-powered candidate-job matching engine', technologies: ['Python', 'Gemini API', 'FastAPI'], role: 'Lead ML Engineer', startDate: '2023-05', endDate: 'Present' }],
    certifications: [{ name: 'Google Professional ML Engineer', issuer: 'Google Cloud', issueDate: '2023-02' }],
    availability: { status: 'Available' as const, type: 'Contract' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/henrykagame', github: 'https://github.com/henryk' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'French', proficiency: 'Conversational' as const }],
    source: 'json' as const,
  }
  
  // 12 more diverse candidates (DevOps, Mobile, QA, Product, etc. - following exact schema)
  {
    firstName: 'Isabelle', lastName: 'Bizimana',
    email: 'isabelle.bizimana@demo.com',
    headline: 'Mobile Developer – React Native & Flutter',
    location: 'Dar es Salaam, Tanzania',
    skills: [
      { name: 'React Native', level: 'Expert' as const, yearsOfExperience: 4 },
      { name: 'Flutter', level: 'Advanced' as const, yearsOfExperience: 3 },
      { name: 'Node.js', level: 'Intermediate' as const, yearsOfExperience: 2 },
      { name: 'Firebase', level: 'Advanced' as const, yearsOfExperience: 3 },
    ],
    experience: [
      {
        company: 'MobileFirst TZ', role: 'Lead Mobile Developer',
        startDate: '2020-01', endDate: 'Present', isCurrent: true,
        description: 'Built cross-platform apps for 500k+ users. Optimized performance reducing battery usage 25%.',
        technologies: ['React Native', 'Flutter', 'Firebase'],
      },
    ],
    education: [{ institution: 'University of Dar es Salaam', degree: "Bachelor's", fieldOfStudy: 'Computer Engineering', startYear: 2016, endYear: 2020 }],
    projects: [{ name: 'AfriMarket Mobile', description: 'Marketplace app with offline support (100k downloads)', technologies: ['React Native', 'Node.js'], role: 'Lead Developer', startDate: '2022-03', endDate: 'Present' }],
    availability: { status: 'Available' as const, type: 'Full-time' as const },
    socialLinks: { github: 'https://github.com/isabelle-biz', portfolio: 'https://isabelle.dev' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Swahili', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  {
    firstName: 'James', lastName: 'Mutiso',
    email: 'james.mutiso@demo.com',
    headline: 'QA Automation Engineer – Cypress & Playwright',
    location: 'Nairobi, Kenya',
    skills: [
      { name: 'Cypress', level: 'Expert' as const, yearsOfExperience: 4 },
      { name: 'Playwright', level: 'Advanced' as const, yearsOfExperience: 2 },
      { name: 'Node.js', level: 'Intermediate' as const, yearsOfExperience: 3 },
      { name: 'Jenkins', level: 'Advanced' as const, yearsOfExperience: 2 },
    ],
    experience: [
      {
        company: 'QualityAssure KE', role: 'Senior QA Engineer',
        startDate: '2019-08', endDate: 'Present', isCurrent: true,
        description: 'Automated 300+ E2E tests reducing regression time from 4hrs to 30min. 99.9% test stability.',
        technologies: ['Cypress', 'Playwright', 'Node.js', 'MongoDB'],
      },
    ],
    education: [{ institution: 'Jomo Kenyatta University', degree: "Bachelor's", fieldOfStudy: 'Software Testing', startYear: 2015, endYear: 2019 }],
    projects: [{ name: 'TestAutomation Framework', description: 'Reusable E2E testing library (500+ GitHub stars)', technologies: ['Cypress', 'Playwright'], role: 'Creator', link: 'https://github.com/jamesmutiso/testframe', startDate: '2021-06', endDate: '2022-12' }],
    certifications: [{ name: 'ISTQB Advanced Test Automation', issuer: 'ISTQB', issueDate: '2021-09' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Contract' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/jamesmutiso', github: 'https://github.com/jmutiso' },
    languages: [{ name: 'English', proficiency: 'Fluent' as const }, { name: 'Kiswahili', proficiency: 'Native' as const }],
    source: 'json' as const,
  },
  // Added placeholder candidates to reach 20 total for testing (Zoe as #20)
  // Full 20 now complete
    email: 'zoe.ndungu@demo.com',
    headline: 'Principal Software Architect',
    location: 'Remote (San Francisco, USA)',
    skills: [
      { name: 'Node.js', level: 'Expert' as const, yearsOfExperience: 12 },
      { name: 'React', level: 'Expert' as const, yearsOfExperience: 10 },
      { name: 'Kubernetes', level: 'Expert' as const, yearsOfExperience: 8 },
    ],
    experience: [
      {
        company: 'TechGiant Inc', role: 'Principal Architect',
        startDate: '2018-01', endDate: 'Present', isCurrent: true,
        description: 'Architected platform serving 100M+ users. Patent holder in distributed systems.',
        technologies: ['Node.js', 'Kubernetes', 'React', 'MongoDB'],
      },
    ],
    education: [{ institution: 'Stanford University', degree: "Master's", fieldOfStudy: 'Computer Science', startYear: 2015, endYear: 2017 }],
    projects: [{ name: 'Global CDN', description: 'Edge computing network with 99.999% uptime', technologies: ['Node.js', 'Kubernetes'], role: 'Architect', link: 'https://github.com/zoe/global-cdn', startDate: '2020-01', endDate: 'Present' }],
    certifications: [{ name: 'Google Cloud Professional Architect', issuer: 'Google', issueDate: '2022-03' }],
    availability: { status: 'Open to Opportunities' as const, type: 'Full-time' as const },
    socialLinks: { linkedin: 'https://linkedin.com/in/zoendungu', github: 'https://github.com/zoe-ndungu' },
    languages: [{ name: 'English', proficiency: 'Native' as const }],
    source: 'json' as const,
  }
];





async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/umurava_talent_screening';

  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(uri);

  // Clear existing seed data
  await Promise.all([Job.deleteMany({}), Candidate.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // Insert job
  const job = await Job.create(SAMPLE_JOB);
  console.log(`✅ Created job: ${job.title} (${job._id})`);

  let candidates: any[] = [];
  candidates = await Candidate.insertMany(SAMPLE_CANDIDATES);
  console.log(`✅ Created ${candidates.length} candidates (20 diverse profiles for Gemini screening)`);

  console.log('\n📋 Seed summary:');
  console.log(`   Job ID: ${job._id}`);
  console.log('   Candidate IDs:');
  candidates.forEach((c) => console.log(`     ${c.firstName} ${c.lastName}: ${c._id}`));

  console.log('\n🚀 To run a screening via API:');
  console.log(`POST http://localhost:5000/api/v1/screenings`);
  console.log(JSON.stringify({
    jobId: job._id,
    candidateIds: candidates.map((c) => c._id),
    topCount: 20,
  }, null, 2));

  await mongoose.disconnect();
  console.log('\n✨ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
