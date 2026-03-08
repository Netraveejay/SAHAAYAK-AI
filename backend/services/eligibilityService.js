const { filterEligibleSchemes, getEligibilityReasons } = require('./rulesEngine');
const { explainEligibility } = require('./bedrockService');

async function getEligibleSchemesWithExplanation(profile, schemes) {
  const eligibleSchemes = filterEligibleSchemes(profile, schemes);
  
  if (eligibleSchemes.length === 0) {
    return { schemes: [], explanation: 'No schemes match your current profile.' };
  }
  
  const schemesWithReasons = eligibleSchemes.map(scheme => ({
    ...scheme,
    reasons: getEligibilityReasons(profile, scheme)
  }));
  
  let aiExplanation = '';
  if (process.env.USE_BEDROCK === 'true') {
    try {
      aiExplanation = await explainEligibility(profile, eligibleSchemes);
    } catch (error) {
      console.error('Bedrock explanation failed:', error);
      aiExplanation = '';
    }
  }
  
  return {
    schemes: schemesWithReasons,
    explanation: aiExplanation,
    count: eligibleSchemes.length
  };
}

module.exports = {
  getEligibleSchemesWithExplanation
};
