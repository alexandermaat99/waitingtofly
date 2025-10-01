// Book and Author Information Constants
// Update these values to customize your book preorder website

export const BOOK_INFO = {
  title: "Waiting to Fly: A Laotian Refugee Girl's Journey in Nong Khai",
  author: "Samly Maat",
  genre: "Memoir • Biography • History",
  description: "The second book in the Memoir Series, 'Waiting to Fly' chronicles the harrowing yet hopeful journey of a young Laotian refugee girl during her formative years in Nong Khai. This deeply personal memoir captures the resilience, dreams, and determination of those who fled war-torn Laos, offering an intimate look at the refugee experience during the Vietnam War era.",
  releaseDate: "December 2025",
  formats: ["Hardcover", "Paperback", "eBook"],
  preorderBonus: "Preorder now and get a singed copy of the book!",
  series: "Memoir Series",
  previousBook: "Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era"
} as const;

export const AUTHOR_INFO = {
  name: "Samly Maat",
  bio: "Samly Maat is a Laotian-American author whose powerful memoirs capture the resilience and spirit of refugee communities. Her firsthand experiences during the Vietnam War era and refugee resettlement provide authentic insight into one of history's most challenging periods.",
  personalNote: '"Waiting to Fly" continues the deeply personal narrative begun in her first memoir, offering readers an intimate look at the refugee experience through the eyes of someone who lived it.',
  quote: "Every refugee carries within them the seeds of hope and the strength to rebuild. This is our story of survival, resilience, and ultimately, triumph.",
  photo: "/images/author_photo.png",
  education: [
    {
      degree: "Doctor of Management (D.M.), Organizational Leadership",
      school: "University of Phoenix",
      years: "2003 - 2009",
      description: "Doctor of Management with the emphasis in Organizational Leadership"
    },
    {
      degree: "Master of Science (M.S.), Technology Management", 
      school: "National University",
      years: "1996 - 1997",
      description: "Master of Information Technology"
    },
    {
      degree: "Bachelor of Science (B.S.), Information Technology",
      school: "San Diego State University", 
      years: "1991 - 1993",
      description: "Bachelor of Science in Information Technology"
    }
  ],
  previousWorks: [
    {
      title: "Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era",
      year: "2023",
      achievement: "First Book in Memoir Series"
    }
  ]
} as const;

export const TESTIMONIALS = [
  {
    quote: "A powerful and deeply moving memoir that captures the resilience of the human spirit. Samly Maat's storytelling brings to life the refugee experience with authenticity and grace.",
    author: "Dr. Patricia Nguyen",
    role: "Professor of Southeast Asian Studies, UCLA"
  },
  {
    quote: "This continuation of the Memoir Series is both heartbreaking and hopeful. Maat's voice is essential for understanding the Laotian refugee experience during this pivotal period.",
    author: "Professor James Morrison", 
    role: "Historian and Author of 'Refugee Voices'"
  },
  {
    quote: "An intimate and courageous account that should be required reading. Maat's memoir offers invaluable insight into the refugee journey and the strength it takes to rebuild.",
    author: "Maria Santos",
    role: "Literary Critic, Refugee Stories Review"
  }
] as const;

export const PREORDER_STATS = {
  earlyPreorders: "500+",
  rating: "4.9/5",
  countries: "50+"
} as const;

export const PREORDER_BENEFITS = [
  "Early access to the first 3 chapters",
  "Signed copy (while supplies last)",
  "Exclusive author updates and behind-the-scenes content", 
  "Free shipping on all preorders"
] as const;

export const SITE_CONFIG = {
  name: "Waiting to Fly",
  tagline: "A powerful memoir about resilience, hope, and the refugee experience during the Vietnam War era.",
  socialLinks: {
    twitter: "#",
    instagram: "#", 
    facebook: "#"
  }
} as const;
