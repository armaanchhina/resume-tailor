export interface WorkExperience {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    responsibilities: string[];
  }
  
  export interface Education {
    school: string;
    degree?: string;
    major?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }

  export interface Project {
    title: string;
    tech?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets: string[];
  }

  export interface ResumeFormData {
    personalInfo: {
      fullName: string;
      email: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
    summary: string;
    additionalInfo: string;
    workExperience: WorkExperience[];
    education: Education[];
    projects: Project[];
    skills: {
      technical: Array<{
        category: string
        items: string
      }>
    }
  }

  export interface LatexResumeData {
    FULL_NAME: string;
    PHONE: string;
    EMAIL: string;
    LINKEDIN: string;
    GITHUB: string;
  
    SUMMARY?: string; // optional (your template only renders if present)
  
    education: {
      school: string;
      location: string;
      degree: string;
      startDate: string;
      endDate: string;
    }[];
  
    workExperience: {
      company: string;
      position: string;
      location: string;
      startDate: string;
      endDate: string;
      responsibilities: string[]; // 3–4 items
    }[];
  
    projects?: {
      title: string;
      tech: string;
      date: string;
      bullets: string[];
    }[];
  
    technicalSkills: {
      category: string;
      items: string;
    }[];
  }

  export interface TailoredResume {
    summary: string;
  
    workExperience: {
      company: string;
      position: string;
      location: string;
      startDate: string;
      endDate: string;
      current?: boolean;
      responsibilities: string[];
    }[];
  
    education: {
      school: string;
      location: string;
      degree: string;
      startDate: string;
      endDate: string;
    }[];

    projects: {
      title: string;
      tech: string;
      startDate: string;
      endDate: string;
      current?: boolean;
      bullets: string[];
    }[];

    skills: string[];
  }
  
  
  
  // Optional: default values for the form
  export const defaultResumeValues: ResumeFormData = {
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    additionalInfo: "",
    workExperience: [
      {
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: [""],
      },
    ],
    education: [
      {
        school: "",
        degree: "",
        major: "",
        startDate: "",
        endDate: "",
        gpa: "",
      },
    ],
    projects: [
      {
        title: "",
        tech: "",
        link: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [""],
      },
    ],
    skills: {
      technical: [
        { category: "Languages", items: "" },
        { category: "Frontend", items: "" },
        { category: "Backend", items: "" },
        { category: "Databases", items: "" },
        { category: "Cloud & DevOps", items: "" },
      ]
    }
    ,
  };
  