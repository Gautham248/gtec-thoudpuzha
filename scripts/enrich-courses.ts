/**
 * Enriches all PUBLISHED courses with contentBlocks so every course page
 * renders fully with hero, overview, detailed content, course lists, and benefits.
 *
 * Run: npx tsx scripts/enrich-courses.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { course as courseTable } from "../src/db/schema";

const CONTENT_BLOCKS = {
  // ── DCA ──
  "diploma-in-computer-application-dca": {
    heroTaglineEn:
      "Build a solid foundation in computing — from basics to job-ready skills",
    heroTaglineMl:
      "കമ്പ്യൂട്ടിംഗിൽ ശക്തമായ അടിത്തറ പണിയുക — അടിസ്ഥാനകാര്യങ്ങൾ മുതൽ ജോലിക്ക് തയ്യാറുള്ള കഴിവുകൾ വരെ",
    overviewEn:
      "The Diploma in Computer Application (DCA) is our flagship foundation program designed for absolute beginners. Over six months, students progress from basic computer literacy to confident operation of productivity suites, internet tools, and fundamental programming concepts. The hands-on curriculum includes real-world projects, typing practice, and weekly assessments to ensure mastery at every stage.",
    overviewMl:
      "ഡിപ്ലോമ ഇൻ കമ്പ്യൂട്ടർ ആപ്ലിക്കേഷൻ (DCA) പൂർണമായും തുടക്കക്കാർക്കായി രൂപകൽപ്പന ചെയ്ത ഞങ്ങളുടെ മുൻനിര അടിസ്ഥാന പ്രോഗ്രാമാണ്. ആറ് മാസത്തിനുള്ളിൽ, വിദ്യാർത്ഥികൾ അടിസ്ഥാന കമ്പ്യൂട്ടർ സാക്ഷരതയിൽ നിന്ന് ഉൽപാദന സ്യൂട്ടുകൾ, ഇന്റർനെറ്റ് ഉപകരണങ്ങൾ, അടിസ്ഥാന പ്രോഗ്രാമിംഗ് ആശയങ്ങൾ എന്നിവയുടെ ആത്മവിശ്വാസ പ്രവർത്തനത്തിലേക്ക് പുരോഗമിക്കുന്നു.",
    detailedContentEn: [
      "This course begins with an introduction to computer hardware components, operating systems (Windows & Linux basics), and file management. Students learn to navigate, organize, and secure their digital workspace before moving into application software.",
      "The Microsoft Office module covers Word (document formatting, mail merge, templates), Excel (formulas, pivot tables, charts, data validation), PowerPoint (professional presentations, animations, slide masters), and Outlook (email management, calendar scheduling). Students complete a capstone project integrating all Office applications.",
      "The internet and digital literacy module covers web browsers, search techniques, online safety, email etiquette, cloud storage (Google Drive, OneDrive), and collaborative tools. Students create and share documents in the cloud and learn best practices for digital communication.",
      "The programming fundamentals module introduces logic building, algorithms, and basic coding using Python. Students write simple programs, debug errors, and understand core programming concepts that prepare them for advanced IT courses.",
      "Throughout the course, students maintain a digital portfolio of their work, participate in weekly typing speed drills (target: 30+ WPM), and complete bi-weekly practical assessments.",
    ].join("\n\n"),
    detailedContentMl: [
      "ഈ കോഴ്സ് കമ്പ്യൂട്ടർ ഹാർഡ്വെയർ ഘടകങ്ങൾ, ഓപ്പറേറ്റിംഗ് സിസ്റ്റങ്ങൾ (വിൻഡോസ് & ലിനക്സ് അടിസ്ഥാനങ്ങൾ), ഫയൽ മാനേജ്മെന്റ് എന്നിവയുടെ ആമുഖത്തോടെ ആരംഭിക്കുന്നു. ആപ്ലിക്കേഷൻ സോഫ്റ്റ്വെയറിലേക്ക് പോകുന്നതിന് മുമ്പ് വിദ്യാർത്ഥികൾ അവരുടെ ഡിജിറ്റൽ വർക്ക്സ്പേസ് നാവിഗേറ്റ് ചെയ്യാനും ഓർഗനൈസ് ചെയ്യാനും സുരക്ഷിതമാക്കാനും പഠിക്കുന്നു.",
      "മൈക്രോസോഫ്റ്റ് ഓഫീസ് മൊഡ്യൂൾ വേഡ് (ഡോക്യുമെന്റ് ഫോർമാറ്റിംഗ്, മെയിൽ മെർജ്, ടെംപ്ലേറ്റുകൾ), എക്സൽ (ഫോർമുലകൾ, പിവറ്റ് ടേബിളുകൾ, ചാർട്ടുകൾ, ഡാറ്റ വാലിഡേഷൻ), പവർപോയിന്റ് (പ്രൊഫഷണൽ അവതരണങ്ങൾ, ആനിമേഷനുകൾ, സ്ലൈഡ് മാസ്റ്ററുകൾ), ഔട്ട്ലുക്ക് (ഇമെയിൽ മാനേജ്മെന്റ്, കലണ്ടർ ഷെഡ്യൂളിംഗ്) എന്നിവ ഉൾക്കൊള്ളുന്നു.",
      "ഇന്റർനെറ്റും ഡിജിറ്റൽ സാക്ഷരതാ മൊഡ്യൂളും വെബ് ബ്രൗസറുകൾ, തിരയൽ ടെക്നിക്കുകൾ, ഓൺലൈൻ സുരക്ഷ, ഇമെയിൽ മര്യാദ, ക്ലൗഡ് സ്റ്റോറേജ് (ഗൂഗിൾ ഡ്രൈവ്, വൺഡ്രൈവ്), സഹകരണ ഉപകരണങ്ങൾ എന്നിവ ഉൾക്കൊള്ളുന്നു.",
      "പ്രോഗ്രാമിംഗ് അടിസ്ഥാന മൊഡ്യൂൾ ലോജിക് ബിൽഡിംഗ്, അൽഗോരിതങ്ങൾ, പൈത്തൺ ഉപയോഗിച്ചുള്ള അടിസ്ഥാന കോഡിംഗ് എന്നിവ പരിചയപ്പെടുത്തുന്നു. വിദ്യാർത്ഥികൾ ലളിതമായ പ്രോഗ്രാമുകൾ എഴുതുന്നു.",
    ].join("\n\n"),
    courseLists: [
      {
        heading: "Module 1 — Computer Fundamentals",
        items: [
          { code: "DCA101", name: "Introduction to Computers & Peripherals" },
          { code: "DCA102", name: "Operating Systems — Windows & Linux" },
          { code: "DCA103", name: "File Management & System Utilities" },
          { code: "DCA104", name: "Keyboard Skills & Typing Practice" },
        ],
      },
      {
        heading: "Module 2 — Microsoft Office Suite",
        items: [
          { code: "DCA201", name: "MS Word — Document Creation & Formatting" },
          { code: "DCA202", name: "MS Excel — Spreadsheets, Formulas & Charts" },
          { code: "DCA203", name: "MS PowerPoint — Presentations & Animations" },
          { code: "DCA204", name: "MS Outlook — Email & Calendar Management" },
          { code: "DCA205", name: "Office Integration — Capstone Project" },
        ],
      },
      {
        heading: "Module 3 — Internet & Digital Skills",
        items: [
          { code: "DCA301", name: "Web Browsing & Search Techniques" },
          { code: "DCA302", name: "Email Communication & Etiquette" },
          { code: "DCA303", name: "Cloud Storage — Google Drive & OneDrive" },
          { code: "DCA304", name: "Online Safety & Digital Security" },
        ],
      },
      {
        heading: "Module 4 — Programming Basics",
        items: [
          { code: "DCA401", name: "Introduction to Programming Logic" },
          { code: "DCA402", name: "Python Basics — Variables, Loops, Functions" },
          { code: "DCA403", name: "Mini Project — Calculator & Utility Apps" },
        ],
      },
    ],
    benefits: {
      heading: "What You'll Gain",
      items: [
        { textEn: "Confidence using computers for any office environment", textMl: "ഏത് ഓഫീസ് പരിസ്ഥിതിയിലും കമ്പ്യൂട്ടർ ഉപയോഗിക്കാനുള്ള ആത്മവിശ്വാസം" },
        { textEn: "Proficiency in Microsoft Office — Word, Excel, PowerPoint, Outlook", textMl: "മൈക്രോസോഫ്റ്റ് ഓഫീസിൽ പ്രാവീണ്യം — വേഡ്, എക്സൽ, പവർപോയിന്റ്, ഔട്ട്ലുക്ക്" },
        { textEn: "Typing speed of 30+ WPM with proper technique", textMl: "ശരിയായ ടെക്നിക്കിൽ 30+ WPM ടൈപ്പിംഗ് വേഗത" },
        { textEn: "Understanding of basic programming concepts for further study", textMl: "തുടർ പഠനത്തിനായുള്ള അടിസ്ഥാന പ്രോഗ്രാമിംഗ് ആശയങ്ങളുടെ ധാരണ" },
        { textEn: "Digital portfolio showcasing completed projects", textMl: "പൂർത്തിയാക്കിയ പ്രോജക്റ്റുകൾ പ്രദർശിപ്പിക്കുന്ന ഡിജിറ്റൽ പോർട്ട്ഫോളിയോ" },
        { textEn: "Industry-recognized G-TEC & DCA certifications", textMl: "വ്യവസായം അംഗീകരിക്കുന്ന ജി-ടെക് & DCA സർട്ടിഫിക്കേഷനുകൾ" },
      ],
    },
  },

  // ── ADSE ──
  "advanced-diploma-in-software-engineering-adse": {
    heroTaglineEn:
      "Transform from beginner to job-ready software engineer in 12 months",
    heroTaglineMl: null,
    overviewEn:
      "The Advanced Diploma in Software Engineering (ADSE) is our most comprehensive IT program. Spanning twelve months of intensive training, it covers the full stack of modern software development — from C and C++ fundamentals through Java enterprise development to Python scripting and web technologies. Students graduate with a professional portfolio of projects and the skills to join a development team immediately.",
    overviewMl: null,
    detailedContentEn: [
      "Semester 1 focuses on programming fundamentals. Students start with C — learning variables, control structures, arrays, pointers, and memory management. They then transition to C++ for object-oriented programming: classes, inheritance, polymorphism, templates, and the STL. Each concept is reinforced through daily coding exercises and weekly mini-projects.",
      "Semester 2 introduces Java and database management. Students learn Java SE (collections, exceptions, I/O, multithreading), then SQL (querying, joins, normalization, stored procedures) with PostgreSQL. The semester culminates in a console-based CRUD application connecting Java to a relational database.",
      "Semester 3 covers web development and Python. The frontend module teaches HTML5, CSS3, JavaScript ES6+, and React with hooks and state management. The backend module covers Node.js, Express, REST API design, and MongoDB. The Python module explores scripting, data analysis with pandas, and automation.",
      "The final module is a capstone project: students design and build a full-stack web application from scratch, including requirements analysis, database design, API development, frontend implementation, testing, and deployment to a cloud platform.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Semester 1 — C & C++ Programming",
        items: [
          { code: "ADSE101", name: "C Programming — Basics to Advanced" },
          { code: "ADSE102", name: "C++ — Object-Oriented Programming" },
          { code: "ADSE103", name: "Data Structures & Algorithms" },
          { code: "ADSE104", name: "Project — Console Applications" },
        ],
      },
      {
        heading: "Semester 2 — Java & Databases",
        items: [
          { code: "ADSE201", name: "Java SE — Core Java" },
          { code: "ADSE202", name: "SQL & PostgreSQL — Database Design" },
          { code: "ADSE203", name: "JDBC — Database Connectivity" },
          { code: "ADSE204", name: "Project — CRUD Application" },
        ],
      },
      {
        heading: "Semester 3 — Web & Python",
        items: [
          { code: "ADSE301", name: "HTML5, CSS3 & JavaScript ES6+" },
          { code: "ADSE302", name: "React.js — Modern Frontend Development" },
          { code: "ADSE303", name: "Node.js & Express — Backend APIs" },
          { code: "ADSE304", name: "MongoDB — NoSQL Databases" },
          { code: "ADSE305", name: "Python — Scripting & Automation" },
        ],
      },
      {
        heading: "Capstone",
        items: [
          { code: "ADSE401", name: "Full-Stack Web Application — Design to Deploy" },
        ],
      },
    ],
    benefits: {
      heading: "Career Outcomes",
      items: [
        { textEn: "Full proficiency in 4+ programming languages (C, C++, Java, Python)", textMl: null },
        { textEn: "Complete full-stack project in your professional portfolio", textMl: null },
        { textEn: "Database design and management skills with PostgreSQL & MongoDB", textMl: null },
        { textEn: "Modern frontend development with React and responsive design", textMl: null },
        { textEn: "REST API development and deployment experience", textMl: null },
        { textEn: "Interview preparation, resume building, and placement assistance", textMl: null },
      ],
    },
  },

  // ── Python Programming ──
  "python-programming": {
    heroTaglineEn:
      "Learn Python from scratch and build real-world applications",
    heroTaglineMl:
      "ആദ്യം മുതൽ പൈത്തൺ പഠിക്കുകയും യഥാർത്ഥ ലോക ആപ്ലിക്കേഷനുകൾ നിർമ്മിക്കുകയും ചെയ്യുക",
    overviewEn:
      "Python is the world's most popular programming language — and this course makes it accessible to everyone. Whether you're a complete beginner or looking to add Python to your skillset, our three-month program takes you from 'Hello, World!' to building data-driven applications, automating workflows, and analyzing datasets with industry-standard libraries.",
    overviewMl:
      "പൈത്തൺ ആണ് ലോകത്തിലെ ഏറ്റവും ജനപ്രിയ പ്രോഗ്രാമിംഗ് ഭാഷ — ഈ കോഴ്സ് അത് എല്ലാവർക്കും പ്രാപ്യമാക്കുന്നു. നിങ്ങൾ പൂർണമായും തുടക്കക്കാരനാണെങ്കിലും അല്ലെങ്കിൽ നിങ്ങളുടെ കഴിവുകളിലേക്ക് പൈത്തൺ ചേർക്കാൻ ആഗ്രഹിക്കുന്നുവെങ്കിലും, ഞങ്ങളുടെ മൂന്ന് മാസത്തെ പ്രോഗ്രാം നിങ്ങളെ 'Hello, World!' ൽ നിന്ന് ഡാറ്റ-ഡ്രിവെൻ ആപ്ലിക്കേഷനുകൾ നിർമ്മിക്കുന്നതിലേക്ക് കൊണ്ടുപോകുന്നു.",
    detailedContentEn: [
      "Week 1-2: Python fundamentals — variables, data types, operators, input/output, and control flow (if/else, loops). Students write simple programs and solve logic puzzles daily.",
      "Week 3-4: Functions and data structures — lists, tuples, dictionaries, sets, list comprehensions, lambda functions, and error handling with try/except blocks. Introduction to file handling: reading, writing, and parsing CSV and JSON files.",
      "Week 5-6: Object-oriented programming in Python — classes, objects, inheritance, encapsulation, and polymorphism. Students design a small class hierarchy and implement it with unit tests.",
      "Week 7-8: Python libraries ecosystem — NumPy for numerical computing, pandas for data analysis (DataFrames, filtering, grouping, merging), matplotlib and seaborn for data visualization. Students explore a real dataset and create a dashboard of charts.",
      "Week 9-10: Web development basics with Flask — routing, templates, forms, and database integration with SQLite. Students build a simple CRUD web application.",
      "Week 11-12: Final project — each student selects a project (web scraper, data analysis report, automation script, or web app), implements it independently with mentor guidance, and presents to the class.",
    ].join("\n\n"),
    detailedContentMl: [
      "ആഴ്ച 1-2: പൈത്തൺ അടിസ്ഥാനങ്ങൾ — വേരിയബിളുകൾ, ഡാറ്റാ തരങ്ങൾ, ഓപ്പറേറ്ററുകൾ, ഇൻപുട്ട്/ഔട്ട്പുട്ട്, കൺട്രോൾ ഫ്ലോ (if/else, ലൂപ്പുകൾ).",
      "ആഴ്ച 3-4: ഫംഗ്ഷനുകളും ഡാറ്റാ സ്ട്രക്ചറുകളും — ലിസ്റ്റുകൾ, ടപ്പിളുകൾ, ഡിക്ഷ്നറികൾ, സെറ്റുകൾ, ലിസ്റ്റ് കോംപ്രിഹെൻഷനുകൾ, ലാംഡ ഫംഗ്ഷനുകൾ.",
      "ആഴ്ച 5-6: പൈത്തണിലെ ഒബ്ജക്റ്റ്-ഓറിയന്റഡ് പ്രോഗ്രാമിംഗ് — ക്ലാസുകൾ, ഒബ്ജക്റ്റുകൾ, ഇൻഹെറിറ്റൻസ്, എൻകാപ്സുലേഷൻ, പോളിമോർഫിസം.",
      "ആഴ്ച 7-8: പൈത്തൺ ലൈബ്രറി ഇക്കോസിസ്റ്റം — NumPy, pandas, matplotlib, seaborn.",
    ].join("\n\n"),
    courseLists: [
      {
        heading: "Core Python",
        items: [
          { code: "PY101", name: "Python Basics — Syntax, Variables & I/O" },
          { code: "PY102", name: "Control Flow — Conditions & Loops" },
          { code: "PY103", name: "Functions, Lambda & Error Handling" },
          { code: "PY104", name: "Data Structures — Lists, Dicts, Sets, Tuples" },
        ],
      },
      {
        heading: "Advanced Python",
        items: [
          { code: "PY201", name: "OOP — Classes, Inheritance & Polymorphism" },
          { code: "PY202", name: "File Handling — CSV, JSON & Text Processing" },
          { code: "PY203", name: "NumPy & Pandas — Data Analysis" },
          { code: "PY204", name: "Matplotlib & Seaborn — Visualization" },
        ],
      },
      {
        heading: "Web & Project",
        items: [
          { code: "PY301", name: "Flask — Web Development with Python" },
          { code: "PY302", name: "SQLite — Database Integration" },
          { code: "PY303", name: "Final Project — Build & Present" },
        ],
      },
    ],
    benefits: {
      heading: "What You'll Achieve",
      items: [
        { textEn: "Read, write, and debug Python code confidently", textMl: "പൈത്തൺ കോഡ് ആത്മവിശ്വാസത്തോടെ വായിക്കുകയും എഴുതുകയും ഡീബഗ് ചെയ്യുകയും ചെയ്യുക" },
        { textEn: "Analyze and visualize data using pandas and matplotlib", textMl: "pandas, matplotlib എന്നിവ ഉപയോഗിച്ച് ഡാറ്റ വിശകലനം ചെയ്യുകയും ദൃശ്യവൽക്കരിക്കുകയും ചെയ്യുക" },
        { textEn: "Build web applications with Flask and SQLite", textMl: "Flask, SQLite എന്നിവ ഉപയോഗിച്ച് വെബ് ആപ്ലിക്കേഷനുകൾ നിർമ്മിക്കുക" },
        { textEn: "Automate repetitive tasks with Python scripts", textMl: "പൈത്തൺ സ്ക്രിപ്റ്റുകൾ ഉപയോഗിച്ച് ആവർത്തന ജോലികൾ ഓട്ടോമേറ്റ് ചെയ്യുക" },
        { textEn: "Complete a portfolio project demonstrating all skills", textMl: "എല്ലാ കഴിവുകളും പ്രകടമാക്കുന്ന ഒരു പോർട്ട്ഫോളിയോ പ്രോജക്റ്റ് പൂർത്തിയാക്കുക" },
      ],
    },
  },

  // ── Full Stack Web Development ──
  "full-stack-web-development": {
    heroTaglineEn:
      "Build complete web applications — frontend to backend to deployment",
    heroTaglineMl: null,
    overviewEn:
      "Full Stack Web Development is our most practical, project-driven course. Over six months, students learn to design, build, and deploy complete web applications. Starting with semantic HTML and modern CSS, progressing through JavaScript and React for dynamic frontends, then mastering Node.js, Express, and MongoDB for robust backends. Every module includes a hands-on project that becomes part of your professional portfolio.",
    overviewMl: null,
    detailedContentEn: [
      "Month 1 — Frontend Foundations: Semantic HTML5, CSS3 (Flexbox, Grid, animations, responsive design with media queries), and JavaScript ES6+ fundamentals (DOM manipulation, events, fetch API, async/await). Students build a responsive portfolio website as their first project.",
      "Month 2 — React & Modern Frontend: Component architecture, JSX, props, state management with hooks (useState, useEffect, useContext), React Router for SPA navigation, form handling with validation, and integration with REST APIs. Students build a task management app with authentication.",
      "Month 3 — Backend with Node.js: Express.js framework, RESTful API design principles, middleware, authentication with JWT, request validation, error handling, file uploads, and API documentation with Swagger.",
      "Month 4 — Database & Data Modeling: MongoDB fundamentals (documents, collections, CRUD operations), Mongoose ODM, schema design, indexing, aggregation pipelines, and data relationships. PostgreSQL introduction for relational data. Students design and implement the database for their capstone project.",
      "Month 5 — Full-Stack Integration & DevOps: Connecting React frontend to Express backend, state management patterns, deployment to cloud platforms (Vercel/Railway), environment configuration, CI/CD basics, and performance optimization.",
      "Month 6 — Capstone Project: Students work individually or in pairs to design, build, test, and deploy a complete full-stack application. Projects are reviewed by industry mentors and presented in a showcase event.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Frontend Foundations",
        items: [
          { code: "FS101", name: "HTML5 — Semantic Markup & Accessibility" },
          { code: "FS102", name: "CSS3 — Layouts, Flexbox, Grid & Animations" },
          { code: "FS103", name: "JavaScript ES6+ — Fundamentals & DOM" },
          { code: "FS104", name: "Project — Responsive Portfolio Website" },
        ],
      },
      {
        heading: "React & Modern Frontend",
        items: [
          { code: "FS201", name: "React Fundamentals — Components & JSX" },
          { code: "FS202", name: "State Management — Hooks & Context API" },
          { code: "FS203", name: "React Router & SPA Architecture" },
          { code: "FS204", name: "Project — Task Manager App with Auth" },
        ],
      },
      {
        heading: "Backend Development",
        items: [
          { code: "FS301", name: "Node.js & Express — REST APIs" },
          { code: "FS302", name: "Authentication — JWT & Session Management" },
          { code: "FS303", name: "File Uploads & API Documentation" },
        ],
      },
      {
        heading: "Database & Deployment",
        items: [
          { code: "FS401", name: "MongoDB — NoSQL Database Design" },
          { code: "FS402", name: "PostgreSQL — Relational Databases" },
          { code: "FS403", name: "Cloud Deployment — Vercel & Railway" },
          { code: "FS404", name: "Capstone — Full-Stack Application" },
        ],
      },
    ],
    benefits: {
      heading: "What Sets This Course Apart",
      items: [
        { textEn: "6 real projects in your portfolio by graduation", textMl: null },
        { textEn: "Full MERN stack proficiency (MongoDB, Express, React, Node.js)", textMl: null },
        { textEn: "Responsive design skills for mobile-first applications", textMl: null },
        { textEn: "REST API design and integration experience", textMl: null },
        { textEn: "Database design for both SQL and NoSQL systems", textMl: null },
        { textEn: "Deployment and DevOps fundamentals for production readiness", textMl: null },
        { textEn: "Industry mentor review of capstone project", textMl: null },
      ],
    },
  },

  // ── Data Science & ML ──
  "data-science-machine-learning": {
    heroTaglineEn:
      "Turn data into insights — master data science and machine learning",
    heroTaglineMl: null,
    overviewEn:
      "Data is the new oil, and data scientists are in unprecedented demand. This six-month program equips you with the statistical, computational, and machine learning skills to extract meaningful insights from data. From exploratory analysis to predictive modeling and deployment, you'll work with real datasets and industry-standard tools including Python, R, SQL, and cloud platforms.",
    overviewMl: null,
    detailedContentEn: [
      "Phase 1 — Statistics & Python for Data Science: Descriptive and inferential statistics, probability distributions, hypothesis testing, correlation analysis. Python programming with NumPy, pandas, and data cleaning techniques. Students work with messy real-world datasets and learn to prepare them for analysis.",
      "Phase 2 — Data Visualization & SQL: Creating compelling visualizations with matplotlib, seaborn, and Plotly. Building interactive dashboards. SQL for data extraction — querying, joins, subqueries, window functions, and CTEs. Students build a complete exploratory data analysis report.",
      "Phase 3 — Machine Learning Fundamentals: Supervised learning (linear regression, logistic regression, decision trees, random forests, SVM), unsupervised learning (k-means clustering, PCA, hierarchical clustering), model evaluation (cross-validation, confusion matrices, ROC curves, precision-recall). All implemented with scikit-learn.",
      "Phase 4 — Advanced ML & Deployment: Ensemble methods (XGBoost, Gradient Boosting), feature engineering, hyperparameter tuning with GridSearchCV, introduction to deep learning with TensorFlow/Keras, model deployment with Flask APIs and Streamlit dashboards.",
      "Phase 5 — Capstone: End-to-end data science project — problem definition, data collection/cleaning, exploratory analysis, feature engineering, model building and tuning, deployment as a web application, and presentation of findings.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Statistics & Python Foundations",
        items: [
          { code: "DS101", name: "Statistics for Data Science" },
          { code: "DS102", name: "Python — NumPy, Pandas & Data Wrangling" },
          { code: "DS103", name: "Exploratory Data Analysis (EDA)" },
        ],
      },
      {
        heading: "Visualization & SQL",
        items: [
          { code: "DS201", name: "Data Visualization — Matplotlib, Seaborn, Plotly" },
          { code: "DS202", name: "SQL for Data Analysis — Queries & Aggregations" },
          { code: "DS203", name: "Project — EDA Report with Dashboard" },
        ],
      },
      {
        heading: "Machine Learning",
        items: [
          { code: "DS301", name: "Supervised Learning — Regression & Classification" },
          { code: "DS302", name: "Unsupervised Learning — Clustering & PCA" },
          { code: "DS303", name: "Model Evaluation & Tuning" },
          { code: "DS304", name: "Ensemble Methods — Random Forest, XGBoost" },
        ],
      },
      {
        heading: "Advanced & Deployment",
        items: [
          { code: "DS401", name: "Deep Learning Intro — TensorFlow & Keras" },
          { code: "DS402", name: "Model Deployment — Flask API & Streamlit" },
          { code: "DS403", name: "Capstone — End-to-End ML Project" },
        ],
      },
    ],
    benefits: {
      heading: "Your Data Science Toolkit",
      items: [
        { textEn: "Statistical thinking and hypothesis testing methodology", textMl: null },
        { textEn: "Data manipulation mastery with pandas and NumPy", textMl: null },
        { textEn: "Machine learning model building from scratch with scikit-learn", textMl: null },
        { textEn: "SQL proficiency for data extraction and analysis", textMl: null },
        { textEn: "Compelling data visualization and storytelling skills", textMl: null },
        { textEn: "Model deployment experience — take models from notebook to production", textMl: null },
      ],
    },
  },

  // ── Spoken English & Communication Skills ──
  "spoken-english-communication-skills": {
    heroTaglineEn:
      "Speak English with confidence — transform your communication skills",
    heroTaglineMl: null,
    overviewEn:
      "Effective English communication is the single most requested skill by employers across every industry. Our Spoken English & Communication Skills course is designed for learners at all levels — from those who can read English but struggle to speak, to intermediate speakers looking to refine their professional communication. Through immersive practice, role-playing, and personalized feedback, students build fluency, vocabulary, and the confidence to communicate in any setting.",
    overviewMl: null,
    detailedContentEn: [
      "Level 1 — Foundation: Basic grammar review (tenses, articles, prepositions), essential vocabulary building (500+ words), pronunciation drills, and simple conversation practice. Students learn to introduce themselves, ask questions, and handle everyday situations in English.",
      "Level 2 — Intermediate: Complex sentence structures, idiomatic expressions, listening comprehension with audio/video materials, group discussions on current topics, and public speaking practice with peer feedback. Students expand vocabulary to 1500+ words and begin thinking in English.",
      "Level 3 — Advanced: Professional communication — business email writing, meeting participation, presentation skills, negotiation language, telephone etiquette, and interview preparation. Students practice mock interviews, deliver presentations, and receive detailed feedback on grammar, fluency, and body language.",
      "Throughout the course, students maintain a vocabulary journal, participate in weekly speaking club sessions, complete listening assignments, and record self-assessment videos to track their progress.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Foundation Level",
        items: [
          { code: "ENG101", name: "Grammar Essentials — Tenses, Articles & Prepositions" },
          { code: "ENG102", name: "Vocabulary Building — 500+ Essential Words" },
          { code: "ENG103", name: "Pronunciation & Phonetics" },
          { code: "ENG104", name: "Basic Conversation Practice" },
        ],
      },
      {
        heading: "Intermediate Level",
        items: [
          { code: "ENG201", name: "Complex Sentences & Idiomatic Expressions" },
          { code: "ENG202", name: "Listening Comprehension — Audio & Video" },
          { code: "ENG203", name: "Group Discussions & Debates" },
          { code: "ENG204", name: "Public Speaking — 2-Minute Talks" },
        ],
      },
      {
        heading: "Professional Communication",
        items: [
          { code: "ENG301", name: "Business Email & Report Writing" },
          { code: "ENG302", name: "Meeting Participation & Presentation Skills" },
          { code: "ENG303", name: "Telephone Etiquette & Client Communication" },
          { code: "ENG304", name: "Mock Interviews & Career Communication" },
        ],
      },
    ],
    benefits: {
      heading: "Communication Skills You'll Master",
      items: [
        { textEn: "Speak English fluently in personal and professional settings", textMl: null },
        { textEn: "Vocabulary of 1500+ words with correct usage and pronunciation", textMl: null },
        { textEn: "Confidence to participate in meetings, interviews, and presentations", textMl: null },
        { textEn: "Professional email and report writing skills", textMl: null },
        { textEn: "Active listening and comprehension abilities", textMl: null },
        { textEn: "Personalized feedback and progress tracking throughout the course", textMl: null },
      ],
    },
  },

  // ── Digital Marketing ──
  "digital-marketing": {
    heroTaglineEn:
      "Master the digital landscape — SEO, social media, paid ads, and analytics",
    heroTaglineMl: null,
    overviewEn:
      "Digital Marketing is one of the fastest-growing career fields globally. This three-month course gives you hands-on experience with the tools and strategies that drive modern marketing — from search engine optimization and Google Ads to social media management, email campaigns, and analytics. You'll graduate with a portfolio of real campaigns you've planned and executed.",
    overviewMl: null,
    detailedContentEn: [
      "Month 1 — SEO & Content Marketing: Search engine fundamentals, on-page and off-page SEO, keyword research with tools like SEMrush and Ahrefs, technical SEO audits, content strategy and blog writing, and link-building techniques. Students optimize a real website and track ranking improvements.",
      "Month 2 — Paid Advertising: Google Ads (search, display, shopping, video), campaign structure and bidding strategies, keyword match types, ad copywriting and A/B testing, Meta (Facebook/Instagram) Ads Manager, audience targeting and retargeting, and budget management. Students create and run a live ad campaign with a small budget.",
      "Month 3 — Social Media & Analytics: Social media strategy and content calendars, community management, influencer marketing basics, email marketing with Mailchimp, marketing automation workflows, Google Analytics 4 setup and reporting, conversion tracking, and campaign ROI analysis. Students build a complete digital marketing strategy document and present findings.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "SEO & Content",
        items: [
          { code: "DM101", name: "SEO Fundamentals — On-Page & Off-Page" },
          { code: "DM102", name: "Keyword Research & Competitive Analysis" },
          { code: "DM103", name: "Content Marketing & Blog Strategy" },
          { code: "DM104", name: "Technical SEO & Site Audits" },
        ],
      },
      {
        heading: "Paid Advertising",
        items: [
          { code: "DM201", name: "Google Ads — Search, Display & Video" },
          { code: "DM202", name: "Meta Ads — Facebook & Instagram" },
          { code: "DM203", name: "Ad Copywriting & A/B Testing" },
          { code: "DM204", name: "Budget Management & Bid Strategies" },
        ],
      },
      {
        heading: "Social, Email & Analytics",
        items: [
          { code: "DM301", name: "Social Media Strategy & Management" },
          { code: "DM302", name: "Email Marketing & Automation" },
          { code: "DM303", name: "Google Analytics 4 — Setup & Reporting" },
          { code: "DM304", name: "Project — Complete Digital Strategy" },
        ],
      },
    ],
    benefits: {
      heading: "Marketing Skills You'll Master",
      items: [
        { textEn: "Rank websites on Google with proven SEO techniques", textMl: null },
        { textEn: "Create and manage profitable Google & Meta ad campaigns", textMl: null },
        { textEn: "Build social media strategies that grow audiences", textMl: null },
        { textEn: "Track and analyze campaign performance with GA4", textMl: null },
        { textEn: "Portfolio of real campaigns to showcase to employers", textMl: null },
        { textEn: "Industry-recognized G-TEC certification", textMl: null },
      ],
    },
  },

  // ── Graphic Design & Multimedia ──
  "graphic-design-multimedia": {
    heroTaglineEn:
      "Turn creativity into a career — master graphic design and visual communication",
    heroTaglineMl:
      "സർഗ്ഗാത്മകതയെ കരിയറാക്കി മാറ്റുക — ഗ്രാഫിക് ഡിസൈനും വിഷ്വൽ കമ്മ്യൂണിക്കേഷനും മാസ്റ്റർ ചെയ്യുക",
    overviewEn:
      "Graphic design is everywhere — from the apps on your phone to the billboards on the highway. Our six-month Graphic Design & Multimedia course teaches you to create professional visual content using industry-standard Adobe Creative Suite tools. Whether you want to work at a design agency, freelance, or build your own brand, this course gives you the creative and technical foundation you need.",
    overviewMl:
      "ഗ്രാഫിക് ഡിസൈൻ എല്ലായിടത്തുമുണ്ട് — നിങ്ങളുടെ ഫോണിലെ ആപ്പുകൾ മുതൽ ഹൈവേയിലെ ബിൽബോർഡുകൾ വരെ. ഞങ്ങളുടെ ആറ് മാസത്തെ ഗ്രാഫിക് ഡിസൈൻ & മൾട്ടിമീഡിയ കോഴ്സ് വ്യവസായ-നിലവാരമുള്ള അഡോബി ക്രിയേറ്റീവ് സ്യൂട്ട് ഉപകരണങ്ങൾ ഉപയോഗിച്ച് പ്രൊഫഷണൽ വിഷ്വൽ ഉള്ളടക്കം സൃഷ്ടിക്കാൻ നിങ്ങളെ പഠിപ്പിക്കുന്നു.",
    detailedContentEn: [
      "Module 1 — Design Fundamentals: Principles of design (balance, contrast, hierarchy, rhythm, unity), color theory and psychology, typography — font selection, pairing, and readability, composition and layout techniques. Students analyze existing designs and create mood boards.",
      "Module 2 — Adobe Photoshop: Photo manipulation and retouching, layer masks and compositing, digital painting and illustration techniques, creating social media graphics and banners, preparing images for web and print. Students build a portfolio of Photoshop projects.",
      "Module 3 — Adobe Illustrator & CorelDraw: Vector graphics creation, logo design and brand identity development, iconography and infographic design, print design — business cards, letterheads, brochures, packaging design concepts. Students create a complete brand identity package.",
      "Module 4 — Adobe InDesign & Portfolio: Multi-page layout design, magazine and book design, interactive PDF creation, preparing files for professional printing (CMYK, bleed, crop marks). Final project: design a complete brand campaign including logo, stationery, brochure, social media assets, and portfolio presentation.",
    ].join("\n\n"),
    detailedContentMl: [
      "മൊഡ്യൂൾ 1 — ഡിസൈൻ അടിസ്ഥാനങ്ങൾ: ഡിസൈൻ തത്വങ്ങൾ (ബാലൻസ്, കോൺട്രാസ്റ്റ്, ഹൈരാർക്കി, റിഥം, യൂണിറ്റി), കളർ തിയറിയും സൈക്കോളജിയും, ടൈപ്പോഗ്രഫി — ഫോണ്ട് തിരഞ്ഞെടുപ്പ്, ജോടിയാക്കൽ, വായനാക്ഷമത.",
      "മൊഡ്യൂൾ 2 — അഡോബി ഫോട്ടോഷോപ്പ്: ഫോട്ടോ മാനിപ്പുലേഷനും റീടച്ചിംഗും, ലെയർ മാസ്കുകളും കമ്പോസിറ്റിംഗും, ഡിജിറ്റൽ പെയിന്റിംഗും ഇല്ലസ്ട്രേഷൻ ടെക്നിക്കുകളും.",
      "മൊഡ്യൂൾ 3 — അഡോബി ഇല്ലസ്ട്രേറ്റർ & കോറൽഡ്രോ: വെക്റ്റർ ഗ്രാഫിക്സ് സൃഷ്ടി, ലോഗോ ഡിസൈനും ബ്രാൻഡ് ഐഡന്റിറ്റി വികസനവും.",
      "മൊഡ്യൂൾ 4 — അഡോബി ഇൻഡിസൈൻ & പോർട്ട്ഫോളിയോ: മൾട്ടി-പേജ് ലേഔട്ട് ഡിസൈൻ, മാഗസിൻ, പുസ്തക ഡിസൈൻ, പ്രൊഫഷണൽ പ്രിന്റിംഗിനായി ഫയലുകൾ തയ്യാറാക്കൽ.",
    ].join("\n\n"),
    courseLists: [
      {
        heading: "Design Fundamentals & Photoshop",
        items: [
          { code: "GD101", name: "Design Principles & Visual Theory" },
          { code: "GD102", name: "Color Theory & Typography" },
          { code: "GD103", name: "Adobe Photoshop — Photo Editing & Compositing" },
          { code: "GD104", name: "Digital Illustration & Social Media Graphics" },
        ],
      },
      {
        heading: "Vector Design & Branding",
        items: [
          { code: "GD201", name: "Adobe Illustrator — Vector Graphics" },
          { code: "GD202", name: "Logo Design & Brand Identity" },
          { code: "GD203", name: "CorelDraw — Print Design" },
          { code: "GD204", name: "Infographics & Icon Design" },
        ],
      },
      {
        heading: "Layout & Portfolio",
        items: [
          { code: "GD301", name: "Adobe InDesign — Multi-Page Layouts" },
          { code: "GD302", name: "Print Production & Prepress" },
          { code: "GD303", name: "Project — Complete Brand Campaign" },
          { code: "GD304", name: "Portfolio Building & Presentation" },
        ],
      },
    ],
    benefits: {
      heading: "Creative Skills You'll Develop",
      items: [
        { textEn: "Professional mastery of Adobe Photoshop, Illustrator, and InDesign", textMl: "അഡോബി ഫോട്ടോഷോപ്പ്, ഇല്ലസ്ട്രേറ്റർ, ഇൻഡിസൈൻ എന്നിവയിൽ പ്രൊഫഷണൽ പ്രാവീണ്യം" },
        { textEn: "Complete brand identity design — logos, stationery, marketing collateral", textMl: "സമ്പൂർണ ബ്രാൻഡ് ഐഡന്റിറ്റി ഡിസൈൻ — ലോഗോകൾ, സ്റ്റേഷനറി, മാർക്കറ്റിംഗ് കൊളാറ്ററൽ" },
        { textEn: "Print-ready file preparation and production knowledge", textMl: "പ്രിന്റ്-റെഡി ഫയൽ തയ്യാറാക്കലും ഉൽപാദന അറിവും" },
        { textEn: "Professional portfolio of 15+ design projects", textMl: "15+ ഡിസൈൻ പ്രോജക്റ്റുകളുടെ പ്രൊഫഷണൽ പോർട്ട്ഫോളിയോ" },
        { textEn: "Freelancing and client management fundamentals", textMl: "ഫ്രീലാൻസിംഗ്, ക്ലയന്റ് മാനേജ്മെന്റ് അടിസ്ഥാനങ്ങൾ" },
      ],
    },
  },

  // ── Video Editing & Motion Graphics ──
  "video-editing-motion-graphics": {
    heroTaglineEn:
      "Edit like a pro — video editing, motion graphics, and visual storytelling",
    heroTaglineMl: null,
    overviewEn:
      "Video content dominates the internet — and skilled video editors are in high demand across every industry. This four-month course teaches professional video editing with Adobe Premiere Pro, motion graphics with After Effects, color grading, and sound design. From YouTube content to corporate videos, you'll learn to craft compelling visual stories.",
    overviewMl: null,
    detailedContentEn: [
      "Month 1 — Premiere Pro Fundamentals: Interface navigation, project organization, timeline editing (cuts, trims, ripples, rolls), transitions and effects, multi-camera editing, audio editing and mixing, and exporting for different platforms (YouTube, Instagram, broadcast).",
      "Month 2 — Advanced Editing & Color: Advanced timeline techniques, keyframing and animation, color correction (Lumetri Color panel), color grading for cinematic looks, working with LUTs, green screen/chroma key compositing, and motion tracking. Students edit a short film or documentary project.",
      "Month 3 — After Effects & Motion Graphics: After Effects interface and workflow, text animation and kinetic typography, shape layers and vector animation, lower thirds, title sequences, and logo animations, compositing and visual effects basics, and creating reusable motion graphics templates (MOGRTs).",
      "Month 4 — Sound Design & Final Project: Audio post-production — noise reduction, EQ, compression, sound effects and Foley, music selection and licensing, mixing dialogue, music, and effects. Final project: produce a complete 3-5 minute video from raw footage to final export, including motion graphics intro, color grade, and professional audio.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Premiere Pro",
        items: [
          { code: "VE101", name: "Premiere Pro — Interface & Workflow" },
          { code: "VE102", name: "Timeline Editing — Cuts, Trims & Transitions" },
          { code: "VE103", name: "Audio Editing & Mixing" },
          { code: "VE104", name: "Export Settings & Platform Optimization" },
        ],
      },
      {
        heading: "Color & Advanced Editing",
        items: [
          { code: "VE201", name: "Color Correction & Grading" },
          { code: "VE202", name: "Green Screen & Chroma Key" },
          { code: "VE203", name: "Motion Tracking & Keyframing" },
          { code: "VE204", name: "Project — Short Film Edit" },
        ],
      },
      {
        heading: "After Effects",
        items: [
          { code: "VE301", name: "After Effects — Animation Basics" },
          { code: "VE302", name: "Kinetic Typography & Text Animation" },
          { code: "VE303", name: "Logo Animations & Lower Thirds" },
          { code: "VE304", name: "Visual Effects & Compositing" },
        ],
      },
      {
        heading: "Sound & Final Project",
        items: [
          { code: "VE401", name: "Sound Design — Noise Reduction & EQ" },
          { code: "VE402", name: "Music Selection & Audio Mixing" },
          { code: "VE403", name: "Final Project — Complete Video Production" },
        ],
      },
    ],
    benefits: {
      heading: "Production Skills You'll Master",
      items: [
        { textEn: "Professional editing with Adobe Premiere Pro — timeline to export", textMl: null },
        { textEn: "Motion graphics and animation with After Effects", textMl: null },
        { textEn: "Cinematic color grading and correction techniques", textMl: null },
        { textEn: "Professional audio post-production and sound design", textMl: null },
        { textEn: "Portfolio-ready projects for YouTube, social media, and broadcast", textMl: null },
        { textEn: "Adobe-certified course completion", textMl: null },
      ],
    },
  },

  // ── Web & UI/UX Designing ──
  "web-ui-ux-designing": {
    heroTaglineEn:
      "Design beautiful, user-friendly digital experiences — from wireframe to prototype",
    heroTaglineMl: null,
    overviewEn:
      "User experience design is the difference between a product people love and one they abandon. Our Web & UI/UX Designing course teaches the complete design process — user research, wireframing, prototyping, visual design, and usability testing. Using Figma and industry-standard tools, you'll learn to design interfaces that are both beautiful and functional.",
    overviewMl: null,
    detailedContentEn: [
      "Phase 1 — UX Fundamentals: User-centered design process, design thinking methodology (empathize, define, ideate, prototype, test), user research methods (interviews, surveys, competitive analysis), creating user personas and journey maps, information architecture and sitemaps.",
      "Phase 2 — Wireframing & Prototyping: Low-fidelity wireframes and paper prototyping, Figma basics — frames, components, auto-layout, interactive prototyping with smart animate and transitions, user flow mapping, and usability testing with real users. Students test and iterate on their designs.",
      "Phase 3 — Visual UI Design: Design systems and component libraries, visual hierarchy and layout principles, responsive design for mobile, tablet, and desktop, accessibility (WCAG) fundamentals, micro-interactions and animation principles, and handoff to developers (design specs, assets export).",
      "Phase 4 — Capstone Project: End-to-end design project — choose a real-world problem, conduct user research, create wireframes and prototypes, design the final UI, conduct usability testing, iterate based on feedback, and present the complete case study for your portfolio.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "UX Fundamentals",
        items: [
          { code: "UX101", name: "User-Centered Design & Design Thinking" },
          { code: "UX102", name: "User Research — Interviews, Surveys & Personas" },
          { code: "UX103", name: "Information Architecture & User Flows" },
        ],
      },
      {
        heading: "Wireframing & Prototyping",
        items: [
          { code: "UX201", name: "Figma — Components, Auto-Layout & Styles" },
          { code: "UX202", name: "Wireframing — Low to High Fidelity" },
          { code: "UX203", name: "Interactive Prototyping & Smart Animate" },
          { code: "UX204", name: "Usability Testing & Iteration" },
        ],
      },
      {
        heading: "Visual Design & Systems",
        items: [
          { code: "UX301", name: "Visual Hierarchy & Layout Design" },
          { code: "UX302", name: "Responsive Design — Mobile to Desktop" },
          { code: "UX303", name: "Design Systems & Component Libraries" },
          { code: "UX304", name: "Accessibility (WCAG) & Developer Handoff" },
        ],
      },
      {
        heading: "Capstone",
        items: [
          { code: "UX401", name: "Project — End-to-End UX Case Study" },
        ],
      },
    ],
    benefits: {
      heading: "Design Skills You'll Master",
      items: [
        { textEn: "Complete UX design process — research to final prototype", textMl: null },
        { textEn: "Figma mastery — components, auto-layout, prototyping", textMl: null },
        { textEn: "Responsive design for all device sizes", textMl: null },
        { textEn: "Usability testing and data-driven design decisions", textMl: null },
        { textEn: "Professional portfolio case study to showcase to employers", textMl: null },
        { textEn: "Accessibility-first design approach (WCAG compliant)", textMl: null },
      ],
    },
  },

  // ── SAP FICO ──
  "sap-fico-finance-controlling": {
    heroTaglineEn:
      "Become an SAP Finance professional — master financial accounting and controlling",
    heroTaglineMl: null,
    overviewEn:
      "SAP FICO is the gold standard in enterprise financial management, used by 90% of Fortune 500 companies. This three-month course provides comprehensive training in SAP Financial Accounting (FI) and Controlling (CO) modules, with hands-on practice in a live SAP system. You'll learn to configure, operate, and optimize financial processes that power the world's largest organizations.",
    overviewMl: null,
    detailedContentEn: [
      "Module 1 — SAP FI (Financial Accounting): Organizational structure (company code, chart of accounts, business area), general ledger accounting (master records, document posting, clearing), accounts payable and accounts receivable (vendor/customer master, invoice processing, payment programs, dunning), asset accounting (asset classes, depreciation, asset transactions).",
      "Module 2 — Advanced FI: Bank accounting (house banks, check management, electronic bank statements), financial statement preparation and reporting, closing operations (month-end, year-end), foreign currency valuation, and integration with other SAP modules (MM — procurement, SD — sales).",
      "Module 3 — SAP CO (Controlling): Cost element accounting, cost center accounting (planning, actual postings, variance analysis), internal orders, profit center accounting, profitability analysis (CO-PA), and product costing. Students configure a complete CO cycle.",
      "Module 4 — Integration & Real-World Scenarios: End-to-end business process — procure-to-pay cycle, order-to-cash cycle, period-end closing activities, management reporting, and troubleshooting common issues. Students work through case studies simulating real SAP consultant scenarios.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "SAP FI — Financial Accounting",
        items: [
          { code: "SAP101", name: "SAP Overview & Organizational Structure" },
          { code: "SAP102", name: "General Ledger — Master Data & Postings" },
          { code: "SAP103", name: "Accounts Payable & Receivable" },
          { code: "SAP104", name: "Asset Accounting & Depreciation" },
          { code: "SAP105", name: "Bank Accounting & EBS" },
        ],
      },
      {
        heading: "SAP CO — Controlling",
        items: [
          { code: "SAP201", name: "Cost Element & Cost Center Accounting" },
          { code: "SAP202", name: "Internal Orders & Profit Centers" },
          { code: "SAP203", name: "Profitability Analysis (CO-PA)" },
          { code: "SAP204", name: "Product Costing" },
        ],
      },
      {
        heading: "Integration & Closing",
        items: [
          { code: "SAP301", name: "Integration — FI with MM & SD" },
          { code: "SAP302", name: "Month-End & Year-End Closing" },
          { code: "SAP303", name: "Financial Reporting & Consolidation" },
          { code: "SAP304", name: "Case Studies — Real SAP Scenarios" },
        ],
      },
    ],
    benefits: {
      heading: "SAP Career Advantages",
      items: [
        { textEn: "Hands-on experience in a live SAP system (not simulations)", textMl: null },
        { textEn: "Complete FI module proficiency — GL, AP, AR, AA, Banking", textMl: null },
        { textEn: "CO module mastery — cost centers, internal orders, profitability", textMl: null },
        { textEn: "Integration knowledge — MM, SD, and period-end closing", textMl: null },
        { textEn: "SAP consultant interview preparation and resume guidance", textMl: null },
      ],
    },
  },

  // ── Hardware & Networking ──
  "hardware-networking-a-n": {
    heroTaglineEn:
      "Build the backbone of IT — hardware assembly, networking, and CompTIA certification prep",
    heroTaglineMl: null,
    overviewEn:
      "Every organization needs IT support professionals who can set up, maintain, and troubleshoot computer systems and networks. Our six-month Hardware & Networking course provides hands-on training in PC assembly, operating system installation, LAN/WAN networking, TCP/IP, network security, and prepares you for CompTIA A+ and Network+ certifications.",
    overviewMl: null,
    detailedContentEn: [
      "Phase 1 — PC Hardware (A+ Core 1): Computer components (CPU, RAM, storage, motherboard, power supply), PC assembly and disassembly, troubleshooting hardware failures, installing and configuring Windows and Linux operating systems, mobile device hardware, and printer technologies.",
      "Phase 2 — OS & Software (A+ Core 2): Operating system management (Windows, Linux, macOS), software troubleshooting, security fundamentals (malware, firewalls, user authentication), operational procedures and best practices, and CompTIA A+ exam preparation with practice tests.",
      "Phase 3 — Networking (N+): Network topologies and architectures, OSI and TCP/IP models, IP addressing and subnetting (IPv4/IPv6), routing and switching fundamentals, wireless networking standards (Wi-Fi 5/6/6E), network cabling and physical infrastructure.",
      "Phase 4 — Network Security & Administration: Firewalls and network security appliances, VPN configuration, network monitoring and troubleshooting tools (Wireshark, ping, traceroute), cloud networking concepts, network documentation, and CompTIA Network+ exam preparation.",
      "Phase 5 — Practical Lab: Students set up a complete small-office network — assemble PCs, install OS, configure router/switch, set up file sharing and printer sharing, configure basic firewall rules, and troubleshoot common network issues.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "PC Hardware (A+ Core 1)",
        items: [
          { code: "HW101", name: "Computer Components & Architecture" },
          { code: "HW102", name: "PC Assembly & Disassembly" },
          { code: "HW103", name: "Hardware Troubleshooting" },
          { code: "HW104", name: "OS Installation — Windows & Linux" },
        ],
      },
      {
        heading: "OS & Software (A+ Core 2)",
        items: [
          { code: "HW201", name: "OS Management & Configuration" },
          { code: "HW202", name: "Security Fundamentals" },
          { code: "HW203", name: "Software Troubleshooting" },
          { code: "HW204", name: "CompTIA A+ Exam Prep" },
        ],
      },
      {
        heading: "Networking (N+)",
        items: [
          { code: "HW301", name: "Network Topologies & OSI Model" },
          { code: "HW302", name: "IP Addressing & Subnetting" },
          { code: "HW303", name: "Routing, Switching & Wireless" },
          { code: "HW304", name: "Cabling & Physical Infrastructure" },
        ],
      },
      {
        heading: "Security & Administration",
        items: [
          { code: "HW401", name: "Firewalls & Network Security" },
          { code: "HW402", name: "Monitoring & Troubleshooting Tools" },
          { code: "HW403", name: "Cloud & Virtualization Basics" },
          { code: "HW404", name: "Lab — Complete Office Network Setup" },
        ],
      },
    ],
    benefits: {
      heading: "IT Support Skills You'll Master",
      items: [
        { textEn: "Build and repair desktop computers from components", textMl: null },
        { textEn: "Install and configure Windows and Linux operating systems", textMl: null },
        { textEn: "Design and implement small to medium business networks", textMl: null },
        { textEn: "Configure routers, switches, firewalls, and wireless access points", textMl: null },
        { textEn: "Troubleshoot hardware, software, and network issues systematically", textMl: null },
        { textEn: "CompTIA A+ and Network+ certification readiness", textMl: null },
      ],
    },
  },

  // ── Diploma in Financial Accounting (DFA) ──
  "diploma-in-financial-accounting-dfa": {
    heroTaglineEn:
      "Launch your accounting career — financial accounting, taxation, and auditing",
    heroTaglineMl: null,
    overviewEn:
      "The Diploma in Financial Accounting (DFA) is a comprehensive six-month program that transforms beginners into job-ready accounting professionals. Covering financial accounting principles, banking operations, taxation (income tax, GST, TDS), auditing fundamentals, and computerized accounting with Tally and MS Excel, this course prepares you for roles in accounting firms, corporate finance departments, and government organizations.",
    overviewMl: null,
    detailedContentEn: [
      "Semester 1 — Accounting Principles: Double-entry bookkeeping, journal entries and ledger posting, trial balance preparation, final accounts — trading account, profit & loss account, balance sheet, depreciation methods, bank reconciliation statements, and accounting standards overview.",
      "Semester 2 — Taxation & Banking: Income tax — heads of income, deductions, computation of taxable income, ITR filing, GST — registration, returns, input tax credit, TDS — rates, deduction, returns, banking operations — types of accounts, negotiable instruments, loan processing.",
      "Semester 3 — Auditing & Computerized Accounting: Auditing principles and types, internal control and vouching, audit report preparation, Tally ERP 9 / Prime — company creation to financial reporting, MS Excel for accounting — formulas, pivot tables, financial modeling basics.",
      "Semester 4 — Practical Training & Projects: Students work on real-world case studies — complete accounting cycle for a trading company, manufacturing company, and service provider. Includes GST filing simulation, income tax computation project, and final comprehensive assessment.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Accounting Principles",
        items: [
          { code: "DFA101", name: "Fundamentals of Accounting" },
          { code: "DFA102", name: "Journal, Ledger & Trial Balance" },
          { code: "DFA103", name: "Final Accounts — P&L & Balance Sheet" },
          { code: "DFA104", name: "Depreciation & Bank Reconciliation" },
        ],
      },
      {
        heading: "Taxation & Banking",
        items: [
          { code: "DFA201", name: "Income Tax — Computation & Filing" },
          { code: "DFA202", name: "GST — Registration, Returns & ITC" },
          { code: "DFA203", name: "TDS — Deduction & Returns" },
          { code: "DFA204", name: "Banking Operations & Instruments" },
        ],
      },
      {
        heading: "Auditing & Computerized Accounting",
        items: [
          { code: "DFA301", name: "Auditing Principles & Procedures" },
          { code: "DFA302", name: "Tally ERP 9 / Prime — Complete Operations" },
          { code: "DFA303", name: "MS Excel for Accounting — Advanced" },
          { code: "DFA304", name: "Project — Full Accounting Cycle" },
        ],
      },
    ],
    benefits: {
      heading: "Accounting Career Path",
      items: [
        { textEn: "Complete accounting cycle proficiency — journal to financial statements", textMl: null },
        { textEn: "Income tax computation and ITR filing knowledge", textMl: null },
        { textEn: "GST compliance — registration, returns, and reconciliation", textMl: null },
        { textEn: "Tally ERP 9 / Prime mastery for real-world accounting", textMl: null },
        { textEn: "Auditing fundamentals and internal control understanding", textMl: null },
        { textEn: "Dual certification — G-TEC DFA + practical experience certificate", textMl: null },
      ],
    },
  },

  // ── IELTS / TOEFL / PTE Preparation ──
  "ielts-toefl-pte-preparation": {
    heroTaglineEn:
      "Achieve your target band score — expert coaching for international English exams",
    heroTaglineMl: null,
    overviewEn:
      "Whether you're planning to study abroad, immigrate, or advance your career internationally, a strong IELTS, TOEFL, or PTE score is your gateway. Our two-month intensive preparation course covers all four test modules — Listening, Reading, Writing, and Speaking — with proven strategies, extensive practice materials, full-length mock tests, and personalized feedback from experienced instructors.",
    overviewMl: null,
    detailedContentEn: [
      "Week 1-2 — Diagnostic & Foundation: Diagnostic test to assess current level, understanding test format and scoring criteria, core grammar and vocabulary review, academic word list study, and time management strategies for each module.",
      "Week 3-4 — Listening & Reading: Listening strategies — predicting, note-taking, different question types (multiple choice, matching, diagram labeling), reading techniques — skimming, scanning, detailed reading, handling True/False/Not Given questions, and paragraph matching. Daily practice with authentic test materials.",
      "Week 5-6 — Writing: Task 1 (Academic/General) — describing graphs, charts, processes, letter writing; Task 2 — essay structure, argument development, coherence and cohesion, lexical resource. Students write 2 essays per week with detailed instructor feedback.",
      "Week 7-8 — Speaking & Mock Tests: Speaking Part 1 (introduction and interview), Part 2 (long turn/cue card), Part 3 (discussion), fluency and pronunciation practice, common topics and vocabulary. Full-length mock tests under exam conditions with detailed score reports and improvement plans.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Foundation & Strategy",
        items: [
          { code: "IEL101", name: "Test Format, Scoring & Diagnostic Assessment" },
          { code: "IEL102", name: "Grammar Review & Academic Vocabulary" },
          { code: "IEL103", name: "Time Management & Test Strategies" },
        ],
      },
      {
        heading: "Listening & Reading",
        items: [
          { code: "IEL201", name: "Listening — Strategies & Question Types" },
          { code: "IEL202", name: "Reading — Skimming, Scanning & Detail" },
          { code: "IEL203", name: "Practice Tests — Listening & Reading" },
        ],
      },
      {
        heading: "Writing & Speaking",
        items: [
          { code: "IEL301", name: "Writing Task 1 — Graphs, Charts & Letters" },
          { code: "IEL302", name: "Writing Task 2 — Essay Structure & Arguments" },
          { code: "IEL303", name: "Speaking — Parts 1, 2 & 3 Practice" },
          { code: "IEL304", name: "Full Mock Tests — Band Score Reports" },
        ],
      },
    ],
    benefits: {
      heading: "Exam Preparation You'll Receive",
      items: [
        { textEn: "4 full-length mock tests under real exam conditions", textMl: null },
        { textEn: "Personalized feedback and band score predictions", textMl: null },
        { textEn: "2000+ practice questions covering all modules", textMl: null },
        { textEn: "Proven strategies for each question type", textMl: null },
        { textEn: "Flexible coaching for IELTS Academic/General, TOEFL, or PTE", textMl: null },
        { textEn: "Post-course support until you take your exam", textMl: null },
      ],
    },
  },

  // ── Tally ERP 9 / Prime with GST ──
  "tally-erp-9-prime-with-gst": {
    heroTaglineEn:
      "Master accounting and GST compliance with India's leading business software",
    heroTaglineMl: null,
    overviewEn:
      "Tally is the backbone of accounting for millions of Indian businesses. This comprehensive course takes you from accounting fundamentals to advanced Tally operations including GST compliance, inventory management, payroll processing, and financial reporting. Whether you're aiming for an accounting job or managing your own business, this course gives you practical, immediately applicable skills.",
    overviewMl: null,
    detailedContentEn: [
      "Module 1 — Accounting Fundamentals: Double-entry bookkeeping, journal entries, ledger accounts, trial balance, profit & loss statements, and balance sheets. Students learn the accounting cycle from transaction recording to financial statement preparation.",
      "Module 2 — Tally Basics: Company creation, ledger and group management, voucher entry (payment, receipt, contra, journal, sales, purchase), inventory management (stock groups, categories, units of measure), and basic reporting.",
      "Module 3 — GST in Tally: GST concepts (CGST, SGST, IGST, input tax credit), GST registration and returns (GSTR-1, GSTR-3B), e-way bill generation, HSN/SAC codes, reverse charge mechanism, and GST reconciliation. Students practice filing mock GST returns.",
      "Module 4 — Advanced Tally: Payroll processing (employee management, salary components, PF, ESI, PT), TDS computation and returns, cost centers and cost categories, multi-currency transactions, budget management, and data security (backup, restore, user permissions).",
      "Module 5 — Practical Projects: Students work through complete accounting scenarios — setting up a new company, recording a full year of transactions, processing payroll, filing GST returns, and generating financial reports. Final assessment with real-world case studies.",
    ].join("\n\n"),
    detailedContentMl: null,
    courseLists: [
      {
        heading: "Accounting & Tally Fundamentals",
        items: [
          { code: "TLY101", name: "Accounting Principles & Double-Entry System" },
          { code: "TLY102", name: "Tally — Company Creation & Configuration" },
          { code: "TLY103", name: "Ledgers, Groups & Voucher Entry" },
          { code: "TLY104", name: "Inventory Management" },
        ],
      },
      {
        heading: "GST Compliance",
        items: [
          { code: "TLY201", name: "GST Concepts — CGST, SGST, IGST & ITC" },
          { code: "TLY202", name: "GST Returns — GSTR-1, GSTR-3B Filing" },
          { code: "TLY203", name: "E-Way Bill & HSN/SAC Codes" },
          { code: "TLY204", name: "GST Reconciliation & Reverse Charge" },
        ],
      },
      {
        heading: "Advanced Operations",
        items: [
          { code: "TLY301", name: "Payroll — Salary, PF, ESI & PT" },
          { code: "TLY302", name: "TDS Computation & Returns" },
          { code: "TLY303", name: "Multi-Currency & Cost Centers" },
          { code: "TLY304", name: "Data Security — Backup, Restore & Users" },
          { code: "TLY305", name: "Project — Full Accounting Cycle" },
        ],
      },
    ],
    benefits: {
      heading: "Career-Ready Skills",
      items: [
        { textEn: "Complete accounting cycle proficiency — entry to financial statements", textMl: null },
        { textEn: "GST compliance mastery — returns filing, reconciliation, e-way bills", textMl: null },
        { textEn: "Payroll processing including PF, ESI, and professional tax", textMl: null },
        { textEn: "TDS computation and quarterly return filing", textMl: null },
        { textEn: "Inventory management and multi-currency transactions", textMl: null },
        { textEn: "Hands-on experience with real-world accounting case studies", textMl: null },
      ],
    },
  },
} as const;

async function main() {
  console.log("📝 Enriching published courses with content blocks...\n");

  const courses = await db.query.course.findMany({
    where: (c, { eq }) => eq(c.status, "PUBLISHED"),
    columns: { id: true, slug: true, titleEn: true },
  });

  console.log(`Found ${courses.length} published courses\n`);

  for (const course of courses) {
    const blocks = (CONTENT_BLOCKS as Record<string, unknown>)[course.slug];
    if (!blocks) {
      console.log(`  ⚠ No content data for: ${course.slug} (${course.titleEn})`);
      continue;
    }

    await db
      .update(courseTable)
      .set({ contentBlocks: blocks })
      .where(eq(courseTable.id, course.id));

    console.log(`  ✅ ${course.titleEn}`);
  }

  console.log("\n🎉 Course enrichment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Enrichment failed:", e);
    process.exit(1);
  });
