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
    graduationDate?: string;
    gpa?: string;
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
    workExperience: WorkExperience[];
    education: Education[];
    skills: {
      technical: string;
    };
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
        graduationDate: "",
        gpa: "",
      },
    ],
    skills: {
      technical: "",
    },
  };
  