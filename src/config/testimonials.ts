/**
 * Client Testimonials & Experience Records
 *
 * Genuine client experiences for Ant Wealth Creation.
 * All testimonials reflect verified clients of C. Santhosh Sathriyan.
 *
 * Photos: Optional path string. When photoPath is null, an accessible initials-based avatar
 * placeholder with brand gradient is displayed automatically.
 */

export interface ClientTestimonial {
  id: string;
  name: string;
  role: string;
  companyOrOrg?: string;
  initials: string;
  photoPath: string | null;
  quote: string;
}

export const CLIENT_TESTIMONIALS: ClientTestimonial[] = [
  {
    id: 'sathesh-arumugam',
    name: 'Sathesh Arumugam A.S.',
    role: 'Educator',
    companyOrOrg: 'S.M. Arumugam Polytechnic College',
    initials: 'SA',
    photoPath: null,
    quote:
      'I have been a client of Ant Wealth Creation for over a year, and I must say that Santhosh\'s professionalism and attention to detail are exceptional. His advice on mutual fund investments has been invaluable, and his ability to simplify complex financial concepts makes him stand out. Every interaction with Santhosh has been pleasant and efficient, and I truly appreciate his dedication to understanding and addressing my financial needs. I am grateful to have found such a trustworthy and reliable advisor in Santhosh and his team at Ant Wealth Creation.',
  },
  {
    id: 'manoharan',
    name: 'Manoharan',
    role: 'Retired Government Employee',
    initials: 'M',
    photoPath: null,
    quote:
      'Thank you so much for providing excellent guidance on mutual fund investments. I truly appreciate your kindness and welcoming approach, which made it easier for me to focus on effectively managing my finances. A special thanks to Santhosh and the team at Ant Wealth Creation for their exceptional support and expertise.',
  },
  {
    id: 'vadivelan-mp',
    name: 'Vadivelan M.P.',
    role: 'IT Professional',
    companyOrOrg: 'Accenture India Pvt. Ltd',
    initials: 'VM',
    photoPath: null,
    quote:
      'On this Thanksgiving Day, I want to take a moment to express my heartfelt gratitude to Santhosh and the team at Ant Wealth Creation for their exceptional management of my mutual fund portfolio. Your technical expertise, fundamental knowledge of stocks, and unwavering dedication have been instrumental in helping me achieve my financial goals. Thank you, Santhosh and Ant Wealth Creation, for your proactive support and guidance. Your professionalism and commitment to excellence are truly commendable and deeply appreciated.',
  },
  {
    id: 'gautam-at',
    name: 'Gautam A.T.',
    role: 'Technology Professional',
    companyOrOrg: 'Orisenc Technologies',
    initials: 'GA',
    photoPath: null,
    quote:
      'I am highly grateful for Santhosh\'s guidance in teaching me stock market strategies and emphasizing the importance of disciplined investing. His expertise has significantly enhanced my understanding of the market and given me the confidence to invest in mutual funds. Santhosh is a knowledgeable and patient mentor who truly prioritizes long-term growth and financial stability. His dedication to helping clients succeed is truly commendable, and I\'m fortunate to have his guidance in my financial journey.',
  },
  {
    id: 'suresh-a',
    name: 'Suresh A.',
    role: 'Business Owner',
    initials: 'SA',
    photoPath: null,
    quote:
      'I have known Santhosh for over 10 years, and when I decided to explore mutual fund investments two years ago, he was my go-to advisor. Coming from the money-lending business, I wanted to broaden my investment horizons while safeguarding my family’s future. Santhosh and Ant Wealth Creation made this transition seamless and worry-free. He carefully guided me through building a well-structured mutual fund portfolio while also assisting me with comprehensive financial planning, including health and term insurance. His ability to offer customized advice based on my unique needs has been truly invaluable. Santhosh’s professionalism and unwavering dedication have earned my trust completely. I’ve already referred him to several of my colleagues because I am confident in the value he delivers. Thank you, Santhosh, for helping me achieve financial security and peace of mind.',
  },
  {
    id: 'vijayakarthik-n',
    name: 'Vijayakarthik N.',
    role: 'Business Owner',
    initials: 'VN',
    photoPath: null,
    quote:
      'I’ve been working with Santhosh and the Ant Wealth Creation team for over a year now, and I can confidently say their service has been exceptional. Santhosh’s expertise in mutual funds, health insurance, and term insurance gave me the clarity I needed to take the first steps toward building a secure financial future for my family. What sets him apart is his dedication to client satisfaction — he always takes the time to address my queries and ensures that my investment portfolio aligns with my evolving financial goals. His personalized guidance and proactive communication make him stand out as a trusted financial advisor. I highly recommend Ant Wealth Creation to anyone looking for reliable and tailored financial solutions.',
  },
  {
    id: 'sathya-a',
    name: 'Sathya A.',
    role: 'Homemaker',
    initials: 'SA',
    photoPath: null,
    quote:
      'Before meeting Santhosh from Ant Wealth Creation, I had no idea where to start investing our hard-earned money. He patiently explained the importance of outpacing inflation, spreading investments across diverse options, and crafting a strategy that suited my family’s unique needs. He took the time to truly understand my goals and recommended mutual funds and insurance policies that matched my long-term plans and risk appetite. Thanks to his guidance, I now have a balanced mutual fund portfolio and health insurance that ensures my family’s security. His honest and transparent advice has built my confidence in achieving our financial aspirations. I’ve even encouraged my relatives to consult him because I genuinely trust his expertise and dedication.',
  },
  {
    id: 'silambarasan-v',
    name: 'Silambarasan V.',
    role: 'Cloud Solutions Specialist',
    companyOrOrg: 'Amazon AWS',
    initials: 'SV',
    photoPath: null,
    quote:
      'I’ve known Santhosh for five years and have been relying on his guidance for the last three years to manage my financial planning. As someone who meticulously evaluates every expense and takes a conservative approach to money, I was initially hesitant to move beyond traditional savings options like fixed deposits. Santhosh’s patient explanations and transparent process changed my perspective entirely. He highlighted the importance of securing my family’s future with a term insurance plan and demonstrated how mutual funds could be a steady, reliable way to grow wealth. His focus on building long-term financial stability gave me the confidence to start investing. Under his guidance, I feel reassured that my financial decisions align with my cautious approach and future goals. Santhosh has earned my trust through his careful and methodical advice, and I highly recommend Ant Wealth Creation to anyone seeking a knowledgeable and dependable financial advisor.',
  },
];

