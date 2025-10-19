// Book and Author Information Constants
// Update these values to customize your book preorder website

export const BOOK_INFO = {
  title: "Waiting to Fly: A Laotian Refugee Girl's Journey in Nong Khai",
  author: "Samly Maat",
  genre: "Memoir • Biography • History",
  description: "In Waiting to Fly, the young Laotian girl from Before I Became a Refugee Girl faces life inside the Nong Khai refugee camp. Through loss, laughter, and quiet moments of hope, she learns that freedom begins with courage. It is a story about finding light in uncertainty and about how waiting can become a kind of flight.",
  releaseDate: "December 2025",
  formats: ["Hardcover", "Paperback", "eBook"],
  preorderBonus: "Preorder now and get a singed copy of the book!",
  series: "Memoir Series",
  previousBook: "Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era",
  coverImage: "/images/bookImage.png"
} as const;

export const BOOK_FORMATS = {
  hardcover: {
    name: "Hardcover",
    price: 24.99,
    description: "Premium hardcover edition with dust jacket"
  },
  paperback: {
    name: "Paperback", 
    price: 18.99,
    description: "Standard paperback edition"
  },
  ebook: {
    name: "E-book",
    price: 12.99,
    description: "Digital version for e-readers and devices"
  },
  audiobook: {
    name: "Audiobook",
    price: 19.99,
    description: "Narrated audio version"
  }
} as const;

export const AUTHOR_INFO = {
  name: "Samly Maat",
  bio: "Dr. Samly Maat is an author and speaker whose life traces a remarkable journey from the rice fields of Laos to the refugee camps of Thailand, from the decks of the U.S. Navy to a distinguished career in engineering and leadership.",
  personalNote: 'Through her memoir collection, <strong><em>The Becoming Series</em></strong>, she shares true stories of courage, perseverance, and transformation, showing that no matter where you begin, you have the power to rise. She writes to remind us that strength is not born in comfort, but in courage.',
  quote: "Every refugee carries within them the seeds of hope and the strength to rebuild. This is our story of survival, resilience, and ultimately, triumph.",
  photo: "/images/author_photo.jpg",
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
    quote: "Dr. Samly Maat’s story helped me see my own strength again. Her courage reminds me that hope never truly leaves us—it only waits for us to rise.",
    author: "Abigail Measles",
    role: "Student of Southeast Asian Studies"
  },
  {
    quote: "Every chapter touched my heart. I cried, I smiled, and I felt less alone in my own struggles. This book taught me that healing is possible, one step at a time.",
    author: "Professor James Morrison", 
    role: "Historian and Refugee Studies Professor"
  },
  {
    quote: "Her words are a mirror for anyone who has faced fear or loss. She shows that even the smallest act of faith can lead to freedom.",
    author: "Maria Viengchang",
    role: "Literary Critic and Researcher"
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

export const FOOTER_TAGLINES = {
  primary: "A powerful memoir about resilience, hope, and the refugee experience during the Vietnam War era.",
  alternative: "Discover the untold stories of courage, survival, and the human spirit in the face of adversity.",
  inspirational: "Inspiring resilience and hope—discover true stories of overcoming adversity, reclaiming freedom, and finding strength on every page.",
  journey: "Follow one woman's extraordinary journey from refugee camp to freedom, and find your own path to resilience."
} as const;
