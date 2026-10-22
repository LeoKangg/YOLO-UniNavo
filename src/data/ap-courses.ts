/** College Board AP Central catalog, reviewed October 22, 2026.
 * 42 generally available 2026–27 courses; AP Networking is pilot-only.
 */
export const apCourseGroups = [
  {
    en: "Arts",
    ko: "예술",
    courses: [
      ["2-D Art and Design", "2차원 미술과 디자인", "ap-2-d-art-and-design"],
      ["3-D Art and Design", "3차원 미술과 디자인", "ap-3-d-art-and-design"],
      ["Drawing", "드로잉", "ap-drawing"],
      ["Art History", "미술사", "ap-art-history"],
      ["Music Theory", "음악이론", "ap-music-theory"],
    ],
  },
  {
    en: "English",
    ko: "영어",
    courses: [
      [
        "English Language and Composition",
        "영어 언어와 작문",
        "ap-english-language-and-composition",
      ],
      [
        "English Literature and Composition",
        "영문학과 작문",
        "ap-english-literature-and-composition",
      ],
    ],
  },
  {
    en: "History and Social Sciences",
    ko: "역사·사회과학",
    courses: [
      [
        "African American Studies",
        "아프리카계 미국인 연구",
        "ap-african-american-studies",
      ],
      [
        "Comparative Government and Politics",
        "비교정부와 정치",
        "ap-comparative-government-and-politics",
      ],
      ["European History", "유럽사", "ap-european-history"],
      ["Human Geography", "인문지리학", "ap-human-geography"],
      ["Macroeconomics", "거시경제학", "ap-macroeconomics"],
      ["Microeconomics", "미시경제학", "ap-microeconomics"],
      ["Psychology", "심리학", "ap-psychology"],
      [
        "United States Government and Politics",
        "미국 정부와 정치",
        "ap-united-states-government-and-politics",
      ],
      ["United States History", "미국사", "ap-united-states-history"],
      ["World History: Modern", "세계사: 근현대", "ap-world-history-modern"],
    ],
  },
  {
    en: "Math and Computer Science",
    ko: "수학·컴퓨터과학",
    courses: [
      ["Calculus AB", "미적분 AB", "ap-calculus-ab"],
      ["Calculus BC", "미적분 BC", "ap-calculus-bc"],
      ["Computer Science A", "컴퓨터과학 A", "ap-computer-science-a"],
      [
        "Computer Science Principles",
        "컴퓨터과학 원리",
        "ap-computer-science-principles",
      ],
      ["Precalculus", "미적분 준비과정", "ap-precalculus"],
      ["Statistics", "통계학", "ap-statistics"],
    ],
  },
  {
    en: "Sciences",
    ko: "과학",
    courses: [
      ["Biology", "생물학", "ap-biology"],
      ["Chemistry", "화학", "ap-chemistry"],
      ["Environmental Science", "환경과학", "ap-environmental-science"],
      ["Physics 1: Algebra-Based", "물리학 1: 대수 기반", "ap-physics-1"],
      ["Physics 2: Algebra-Based", "물리학 2: 대수 기반", "ap-physics-2"],
      [
        "Physics C: Electricity and Magnetism",
        "물리학 C: 전자기학",
        "ap-physics-c-electricity-and-magnetism",
      ],
      ["Physics C: Mechanics", "물리학 C: 역학", "ap-physics-c-mechanics"],
    ],
  },
  {
    en: "World Languages and Cultures",
    ko: "세계 언어·문화",
    courses: [
      [
        "Chinese Language and Culture",
        "중국어와 문화",
        "ap-chinese-language-and-culture",
      ],
      [
        "French Language and Culture",
        "프랑스어와 문화",
        "ap-french-language-and-culture",
      ],
      [
        "German Language and Culture",
        "독일어와 문화",
        "ap-german-language-and-culture",
      ],
      [
        "Italian Language and Culture",
        "이탈리아어와 문화",
        "ap-italian-language-and-culture",
      ],
      [
        "Japanese Language and Culture",
        "일본어와 문화",
        "ap-japanese-language-and-culture",
      ],
      ["Latin", "라틴어", "ap-latin"],
      [
        "Spanish Language and Culture",
        "스페인어와 문화",
        "ap-spanish-language-and-culture",
      ],
      [
        "Spanish Literature and Culture",
        "스페인 문학과 문화",
        "ap-spanish-literature-and-culture",
      ],
    ],
  },
  {
    en: "AP Capstone",
    ko: "AP 캡스톤",
    courses: [
      ["Research", "연구", "ap-research"],
      ["Seminar", "세미나", "ap-seminar"],
    ],
  },
  {
    en: "AP Career Kickstart",
    ko: "AP 커리어 킥스타트",
    courses: [
      [
        "Business with Personal Finance",
        "경영과 개인 재무",
        "ap-business-with-personal-finance",
      ],
      ["Cybersecurity", "사이버보안", "ap-cybersecurity"],
    ],
  },
] as const;
