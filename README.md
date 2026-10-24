# Government Scholarship Finder 🎓

A responsive, full-stack web application designed for Indian college students to discover and verify authentic Central and State Government scholarships, financial aid, and merit grants with direct official portal access, featuring dedicated coverage of **Karnataka (State Scholarship Portal - SSP)**.

Built as an academic Computer Science & Engineering (CSE) curriculum project.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Karnataka & Central Focus](#karnataka--central-focus)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
7. [How to Run the Project](#how-to-run-the-project)
8. [Features & Functionality](#features--functionality)
9. [Student Eligibility Checker Engine](#student-eligibility-checker-engine)
10. [Data Integrity & Transparency Policy](#data-integrity--transparency-policy)
11. [College Viva & Evaluation Guide](#college-viva--evaluation-guide)

---

## 💡 Project Overview
Applying for government scholarships often poses a challenge for students because guidelines are scattered across disparate departmental portals, income ceilings differ by category, and unofficial websites often invent misleading application deadlines.

**Government Scholarship Finder** addresses this problem by providing:
- A unified, mobile-friendly discovery directory with real-time keyword search and regional filtering.
- Special emphasis on **Karnataka State Scholarship Portal (SSP)** schemes alongside Central schemes (**NSP**, **AICTE**, **UGC**).
- An interactive **Student Eligibility Checker** that compares student profiles against authentic published rules without displaying misleading match percentages.
- Strict data integrity standards: unverified or demonstration test items are explicitly labeled, and unknown criteria are never assumed to be satisfied.

---

## 🏛️ Karnataka & Central Focus

The platform curates verified government schemes across both State and Central jurisdictions:

### 1. Karnataka State Schemes (SSP Portal & State Depts)
- **Karnataka Post-Matric SC Scholarship**: Social Welfare Department, Govt. of Karnataka (`ssp.postmatric.karnataka.gov.in`).
- **Karnataka Post-Matric ST Scholarship**: Scheduled Tribes Welfare Department, Govt. of Karnataka (`ssp.postmatric.karnataka.gov.in`).
- **Karnataka Vidyasiri (Food & Accommodation Scheme)**: Backward Classes Welfare Department, Govt. of Karnataka for Category-1, 2A, 2B, 3A, 3B students.
- **Karnataka Post-Matric Fee Concession for OBC Students**: Backward Classes Welfare Department (`ssp.postmatric.karnataka.gov.in`).
- **Karnataka Directorate of Minorities Post-Matric Scholarship**: Directorate of Minorities (`ssp.postmatric.karnataka.gov.in`).
- **Karnataka Labour Welfare Board Educational Assistance**: KLWB, Govt. of Karnataka (`klwbapps.karnataka.gov.in`).
- **Karnataka Free Laptop Scheme for College Students**: Department of Collegiate Education (`dce.karnataka.gov.in`).
- **Dr. B.R. Ambedkar Merit Incentive Award for SC/ST Toppers**: Social Welfare Department (`sw.kar.nic.in`).

### 2. Central Government Schemes (NSP / AICTE / UGC)
- **Central Sector Scheme for College and University Students (PM-USP)**: Ministry of Education (`scholarships.gov.in`).
- **Central Post Matric Scholarship for SC Students**: Ministry of Social Justice & Empowerment (`scholarships.gov.in`).
- **Post Matric Scholarship for ST Students**: Ministry of Tribal Affairs (`scholarships.gov.in`).
- **Merit-cum-Means Scholarship for Professional & Technical Courses**: Ministry of Minority Affairs (`scholarships.gov.in`).
- **AICTE Pragati Scholarship for Girl Students**: Technical Degree & Diploma (`aicte-india.org`).
- **AICTE Saksham Scholarship for Specially Abled Students**: Benchmark disability assistance (`aicte-india.org`).
- **AICTE Swanath Scholarship for Orphans & Armed Forces Wards**: Technical education (`aicte-india.org`).
- **National Means-cum-Merit Scholarship Scheme (NMMSS)**: School education dropout prevention (`scholarships.gov.in`).
- **PG Indira Gandhi Scholarship for Single Girl Child**: UGC (`ugc.gov.in`).
- **PM Yashasvi Post-Matric Scholarship for OBC, EBC & DNT Students**: (`scholarships.gov.in`).
- **Prime Minister's Special Scholarship Scheme (PMSSS) for J&K and Ladakh**: (`aicte-india.org`).
- **Ishan Uday Special Scholarship Scheme for North Eastern Region**: (`scholarships.gov.in`).

---

## 🛠 Technology Stack
- **Frontend**: 
  - **HTML5**: Semantic elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`).
  - **CSS3 (Vanilla)**: Modern dark navy blue (`#0A192F`), white, and light blue (`#0284C7`, `#38BDF8`) theme, CSS Grid, Flexbox, glassmorphic controls, and responsive media queries.
  - **JavaScript (ES6+)**: Dynamic DOM manipulation, Fetch API, debounced input search, modal dialogs, and HTML entity escaping for XSS prevention.
- **Backend**:
  - **Node.js**: Event-driven JavaScript runtime environment on Linux Mint.
  - **Express.js (v4.x)**: REST API endpoints (`/api/scholarships`, `/api/check-eligibility`, `/api/health`) and static asset hosting.

---

## 📁 Folder Structure
```text
Government-Scholarship-Finder/
├── data/
│   └── scholarships.js      # Curated dataset (Karnataka SSP + Central + structured rules)
├── public/
│   ├── index.html           # Semantic page structure, search bar, & Eligibility Checker form
│   ├── styles.css           # Custom responsive styles (Dark navy blue, white, & light blue)
│   └── app.js               # Client logic (Fetch API, live search, card generation, modal)
├── .gitignore               # Ignores node_modules, log files, and environment files
├── package.json             # Project scripts and dependencies (Express)
├── README.md                # Comprehensive documentation and viva guide
└── server.js                # Express backend server with REST endpoints & static hosting
```

---

## ⚙️ Prerequisites
Ensure that you have **Node.js** and **npm** installed on your Linux Mint machine:
```bash
node -v
npm -v
```
*(Node.js version 18.x or newer is recommended. Node 26.x is verified on this machine.)*

---

## 🚀 Installation & Setup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd "/home/arvind/my project 1/Government-Scholarship-Finder"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## ▶️ How to Run the Project

### Option A: Standard Production Run
```bash
npm start
```
Starts the server using `node server.js`.

### Option B: Development Mode (Auto-Reload on Code Changes)
```bash
npm run dev
```
Starts Node.js with the built-in `--watch` flag, automatically restarting whenever files are modified.

### 🌐 Accessing the Website
Once started, open your web browser (Chrome, Firefox, Chromium) and visit:
👉 **[http://localhost:3000](http://localhost:3000)**

To stop the server at any time, press `Ctrl + C` in your terminal.

---

## ✨ Features & Functionality

1. **Karnataka SSP & Central Filtering**: Easily filter schemes by **Karnataka State Schemes (SSP)**, **Central Government (NSP/AICTE)**, or **Demonstration Records**.
2. **Interactive Student Eligibility Checker**: Input your education level, domicile state, social category, annual family income, gender, PwD status, and academic score to receive an immediate, rule-by-rule eligibility breakdown.
3. **No Misleading Percentage Scores**: Instead of calculating arbitrary percentages (e.g. "78% eligible"), the platform groups results into:
   - **Likely Eligible Matches** (with positive confirmation of all matching criteria).
   - **Requires Verification / Insufficient Criteria** (transparently notifying students when guidelines are unverified).
   - **Unmet Scheme Criteria** (with clear, polite explanations of unmet thresholds, such as income ceiling or domicile requirements).
4. **Real-Time Live Search**: 250ms debounced search matching across titles, departments, categories, benefits, and keywords.
5. **Interactive Scheme Detail Modal**: Click "View Details" to review comprehensive guidelines, academic session info, and DBT disbursement notes.
6. **Friendly Empty State**: When zero results match, a friendly message appears with a one-click "Clear All Filters" button.
7. **Direct Portal Links**: External buttons lead directly to authorized government portals (`ssp.postmatric.karnataka.gov.in`, `scholarships.gov.in`) with secure `rel="noopener noreferrer"`.
8. **Responsive Mobile Drawer**: Collapsible hamburger navigation and fluid grid layouts tested across mobile, tablet, and desktop viewports.

---

## 🔍 Student Eligibility Checker Engine

The eligibility engine operates via `POST /api/check-eligibility` and evaluates the following rules:

| Criterion | Rule Evaluated | Handling of Incomplete / Missing Information |
| :--- | :--- | :--- |
| **Domicile State** | Matches `Karnataka` vs `ALL` | If state restriction is missing or unverified, flagged as *Needs Verification*. |
| **Education Level** | Matches course type (Undergraduate, Post-Matric, Technical, Secondary, etc.) | If level is unspecified, flagged as *Needs Verification*. |
| **Annual Family Income** | Checks `annualIncome <= maxIncome` | If income threshold is undefined, never assumed to be satisfied. |
| **Social Category** | Matches SC, ST, OBC (Cat-1/2A/3A), Minority, or General | Categorized as unmet if category does not match published target. |
| **Gender Specificity** | Checks female-specific schemes (e.g. AICTE Pragati) | Excluded for male candidates with explicit rationale. |
| **Specially Abled (PwD)** | Checks requirement for benchmark disability (≥40%) | Flagged if disability certification is required. |
| **Academic Cutoff** | Compares student percentage against published cutoff | Ineligible if score falls below required threshold. |

---

## 📜 Data Integrity & Transparency Policy

- **No Invented Deadlines**: Deadlines vary per academic session and departmental circular. The platform links students to official portals rather than presenting inaccurate dates.
- **Authentic Portals Only**: Only official government domains (e.g., `.gov.in`, `.nic.in`, `aicte-india.org`) are linked.
- **Demonstration Records Labeled**: Mock test entries created for evaluation are explicitly tagged with an amber badge (`Demonstration Record`) and have `isVerified: false`.

---

## 🎓 College Viva & Evaluation Guide

| Viva Question | Recommended Answer |
| :--- | :--- |
| **Why did you focus on Karnataka state scholarships?** | In Karnataka, the State Scholarship Portal (SSP) is the centralized platform through which multiple departments (Social Welfare, Backward Classes Welfare, Minorities) disburse post-matric assistance. By including SSP alongside Central NSP, our application directly serves local students while maintaining national relevance. |
| **How does your Eligibility Checker avoid false positives?** | The engine evaluates structured rules (income limit, domicile, category, marks, gender) sequentially. If any rule fails, the scheme is classified as ineligible with an exact reason. Furthermore, if a record has incomplete rules, the system explicitly marks it as *Needs Verification* rather than falsely assuming eligibility. |
| **Why is search debouncing used in `app.js`?** | Debouncing sets a 250ms delay before triggering a fetch request. If the user continues typing, the timer resets, preventing excessive API calls and reducing browser/server overhead. |
| **How is cross-site scripting (XSS) mitigated?** | All dynamic user input and scholarship data are passed through an `escapeHtml()` utility that converts special characters (`<`, `>`, `&`, `"`, `'`) to safe HTML entities prior to insertion into the DOM. |
| **What are future avenues for expansion?** | Integrating automated scraper bots or government open APIs for real-time deadline scraping, automated SMS/email alerts for application dates, and student document checklist generators. |

---

## 📄 License
Academic Project developed for Computer Science & Engineering curriculum. Open for educational study and modification.
# Government-Scholarship-Finder
