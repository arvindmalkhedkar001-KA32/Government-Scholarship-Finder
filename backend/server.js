/**
 * server.js
 *
 * Backend server for the Government Scholarship Finder using Node.js & Express.
 *
 * Capabilities:
 * REST API for the separately hosted Government Scholarship Finder frontend.
 */

const express = require('express');
const path = require('path');
const scholarships = require('./data/scholarships');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';

app.use((req, res, next) => {
  const requestOrigin = req.get('Origin');
  if (allowedOrigin === '*' || requestOrigin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  if (requestOrigin) res.vary('Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

// Serve frontend static assets directly (Unified single-server hosting)
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// =========================================================================
// API ENDPOINTS
// =========================================================================

/**
 * GET /api/scholarships
 * Filter scholarships by keyword, education level, scope (Karnataka vs Central), and verification type.
 */
app.get('/api/scholarships', (req, res) => {
  try {
    const { q, level, scope, type } = req.query;
    let results = [...scholarships];

    // 1. Text Search Filter (Tokenized multi-keyword search & alias matching)
    if (q && typeof q === 'string' && q.trim() !== '') {
      const rawQuery = q.trim().toLowerCase();
      const tokens = rawQuery.split(/\s+/).filter(Boolean);

      results = results.filter((item) => {
        // Direct ID match
        if (item.id && item.id.toLowerCase() === rawQuery) return true;

        // Concatenate all scheme searchable content into a single searchable text
        const searchableParts = [
          item.id,
          item.name,
          item.provider,
          item.category,
          Array.isArray(item.categories) ? item.categories.join(' ') : '',
          item.eligibility,
          item.benefits,
          item.benefitDescription,
          item.scope,
          item.state,
          item.portalName,
          item.level,
          Array.isArray(item.educationLevels) ? item.educationLevels.join(' ') : '',
          Array.isArray(item.eligibleCourses) ? item.eligibleCourses.join(' ') : '',
          item.verificationStatus,
          Array.isArray(item.tags) ? item.tags.join(' ') : ''
        ];
        const haystack = searchableParts.filter(Boolean).join(' ').toLowerCase();

        // Exact substring match (handles single words or exact phrases)
        if (haystack.includes(rawQuery)) return true;

        // Multi-keyword alias handling
        if (rawQuery === 'sc st' || rawQuery === 'sc/st') {
          return haystack.includes('sc') || haystack.includes('st') || haystack.includes('scheduled caste') || haystack.includes('scheduled tribe');
        }

        // Tokenized matching: all tokens in the query must be found in the searchable haystack
        return tokens.every((token) => haystack.includes(token));
      });
    }

    // 2. Education Level Filter
    if (level && level !== 'all') {
      const levelTerm = String(level).toLowerCase();
      results = results.filter((item) => {
        const levelStr = (item.level || '').toLowerCase();
        const levelArr = Array.isArray(item.educationLevels)
          ? item.educationLevels.map((l) => l.toLowerCase())
          : [];
        return levelStr.includes(levelTerm) || levelArr.some((l) => l.includes(levelTerm));
      });
    }

    // 3. Scope / Region Filter (e.g. Karnataka vs Central)
    if (scope && scope !== 'all') {
      const scopeTerm = String(scope).toLowerCase();
      results = results.filter((item) => {
        const itemScope = (item.scope || '').toLowerCase();
        const itemState = (item.state || '').toLowerCase();
        const itemPortal = (item.portalName || '').toLowerCase();
        const itemTags = Array.isArray(item.tags) ? item.tags.map((t) => t.toLowerCase()) : [];
        if (scopeTerm === 'karnataka' || scopeTerm === 'karnataka ssp' || scopeTerm === 'ssp') {
          return itemScope === 'karnataka' || itemScope === 'state' || itemState === 'karnataka' || itemPortal.includes('ssp') || itemTags.includes('ssp');
        }
        if (scopeTerm === 'central' || scopeTerm === 'nsp') {
          return itemScope === 'central' || itemPortal.includes('nsp') || itemTags.includes('nsp');
        }
        return itemScope === scopeTerm;
      });
    }

    // 4. Verification Type Filter
    if (type && type !== 'all') {
      if (type === 'official') {
        results = results.filter((item) => item.isVerified === true && item.verificationStatus !== 'pending-verification');
      } else if (type === 'pending' || type === 'pending-verification') {
        results = results.filter((item) => item.verificationStatus === 'pending-verification');
      } else if (type === 'demo') {
        results = results.filter((item) => item.isVerified === false && item.verificationStatus !== 'pending-verification');
      }
    }

    res.json({
      success: true,
      total: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve scholarship records.'
    });
  }
});

/**
 * GET /api/scholarships/:id
 * Retrieve a single scholarship record by its unique identifier.
 */
app.get('/api/scholarships/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = scholarships.find((s) => s.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Scholarship scheme with ID "${id}" was not found.`
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching single scholarship:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching scholarship details.'
    });
  }
});

/**
 * POST /api/check-eligibility
 * Evaluates student profile inputs against scholarship rules without displaying fake percentages.
 *
 * Expected payload:
 * {
 *   educationLevel: string,
 *   annualIncome: number,
 *   category: string,
 *   domicileState: string,
 *   gender: string,
 *   isDisability: boolean,
 *   percentage: number
 * }
 */
app.post('/api/check-eligibility', (req, res) => {
  try {
    const {
      educationLevel,
      annualIncome,
      category,
      domicileState,
      gender,
      isDisability,
      percentage
    } = req.body || {};

    // 1. Validate numerical inputs
    const parsedIncome = Number(annualIncome);
    const parsedPercentage = Number(percentage);

    if (isNaN(parsedIncome) || parsedIncome < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid annual family income in Indian Rupees (₹).'
      });
    }

    if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid academic percentage score between 0% and 100%.'
      });
    }

    const cleanLevel = String(educationLevel || 'undergraduate').toLowerCase();
    const cleanCategory = String(category || 'General').trim();
    const cleanDomicile = String(domicileState || 'Karnataka').trim();
    const cleanGender = String(gender || 'ANY').toUpperCase();
    const cleanDisability = Boolean(isDisability);

    // 2. Evaluate each scholarship scheme
    const eligibleMatches = [];
    const insufficientInfoMatches = [];
    const ineligibleMatches = [];

    scholarships.forEach((scheme) => {
      const rules = scheme.rules;

      // Rule Check 0: Missing or incomplete rules in data
      if (!rules || rules.incompleteRules === true) {
        insufficientInfoMatches.push({
          scheme,
          status: 'insufficient_info',
          reason: 'This record contains partial or unverified eligibility rules. The platform cannot confirm eligibility without complete official documentation.'
        });
        return;
      }

      const matchReasons = [];
      const failReasons = [];

      // Rule 1: Domicile State Check
      if (Array.isArray(rules.states) && !rules.states.includes('ALL')) {
        const matchesState = rules.states.some((st) => st.toLowerCase() === cleanDomicile.toLowerCase());
        if (!matchesState) {
          failReasons.push(`Requires state domicile in: ${rules.states.join(', ')} (Selected: ${cleanDomicile}).`);
        } else {
          matchReasons.push(`Domicile verified for ${cleanDomicile}.`);
        }
      } else {
        matchReasons.push('Open to students across all Indian states and Union Territories.');
      }

      // Rule 2: Education Level Check
      if (Array.isArray(rules.allowedLevels) && rules.allowedLevels.length > 0) {
        const matchesLevel = rules.allowedLevels.some((lvl) => cleanLevel.includes(lvl) || lvl.includes(cleanLevel));
        if (!matchesLevel) {
          failReasons.push(`Applicable for: ${rules.allowedLevels.join(', ')} (Your course level: ${cleanLevel}).`);
        } else {
          matchReasons.push(`Course level matches: ${cleanLevel}.`);
        }
      }

      // Rule 3: Annual Family Income Ceiling Check
      if (typeof rules.maxIncome === 'number') {
        if (parsedIncome > rules.maxIncome) {
          failReasons.push(`Family income of ₹${parsedIncome.toLocaleString('en-IN')} exceeds the scheme ceiling of ₹${rules.maxIncome.toLocaleString('en-IN')}/annum.`);
        } else {
          matchReasons.push(`Family income (₹${parsedIncome.toLocaleString('en-IN')}) is within the permissible limit of ₹${rules.maxIncome.toLocaleString('en-IN')}.`);
        }
      }

      // Rule 4: Category / Caste Reservation Check
      if (Array.isArray(rules.targetCategories) && !rules.targetCategories.includes('ALL')) {
        const matchesCategory = rules.targetCategories.some((cat) => {
          if (cat === cleanCategory) return true;
          // Sub-category matching (e.g. OBC matches Cat-1, 2A, etc.)
          if (cleanCategory.startsWith('Cat-') && cat === 'OBC') return true;
          return false;
        });

        if (!matchesCategory) {
          failReasons.push(`Designated for categories: ${rules.targetCategories.join(', ')} (Selected: ${cleanCategory}).`);
        } else {
          matchReasons.push(`Category requirement satisfied (${cleanCategory}).`);
        }
      } else {
        matchReasons.push('Open to all social categories & communities.');
      }

      // Rule 5: Gender Check
      if (rules.gender && rules.gender !== 'ANY') {
        if (cleanGender !== rules.gender) {
          failReasons.push(`Scheme is exclusively open to ${rules.gender.toLowerCase()} candidates.`);
        } else {
          matchReasons.push(`Gender requirement satisfied (${rules.gender}).`);
        }
      }

      // Rule 6: Specially Abled / Disability Check
      if (rules.disabilityRequired === true) {
        if (!cleanDisability) {
          failReasons.push('Scheme requires recognized disability certification (≥40% benchmark disability).');
        } else {
          matchReasons.push('PwD eligibility requirement satisfied.');
        }
      }

      // Rule 7: Academic Percentage Threshold
      if (typeof rules.minPercentage === 'number') {
        if (parsedPercentage < rules.minPercentage) {
          failReasons.push(`Academic score of ${parsedPercentage}% is below the required cutoff of ${rules.minPercentage}%.`);
        } else {
          matchReasons.push(`Academic score (${parsedPercentage}%) meets the qualifying threshold (${rules.minPercentage}%).`);
        }
      }

      // Final Categorization
      if (failReasons.length === 0) {
        eligibleMatches.push({
          scheme,
          status: 'eligible',
          reasons: matchReasons
        });
      } else {
        ineligibleMatches.push({
          scheme,
          status: 'ineligible',
          unmetReasons: failReasons,
          metReasons: matchReasons
        });
      }
    });

    res.json({
      success: true,
      userSummary: {
        educationLevel: cleanLevel,
        annualIncome: parsedIncome,
        category: cleanCategory,
        domicileState: cleanDomicile,
        gender: cleanGender,
        percentage: parsedPercentage
      },
      counts: {
        eligible: eligibleMatches.length,
        insufficientInfo: insufficientInfoMatches.length,
        ineligible: ineligibleMatches.length,
        totalChecked: scholarships.length
      },
      results: {
        eligible: eligibleMatches,
        insufficientInfo: insufficientInfoMatches,
        ineligible: ineligibleMatches
      }
    });
  } catch (error) {
    console.error('Error during eligibility checking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process eligibility calculation.'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    totalScholarships: scholarships.length
  });
});

// Handle unknown API requests with a friendly 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested API endpoint does not exist.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again later.'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Government Scholarship Finder server running!`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🏛️ Focus: Indian Scholarships with Karnataka (SSP)`);
  console.log(`====================================================`);
});
