function checkEligibility(profile, scheme) {
  const eligibility = scheme.eligibility || {};
  
  if (eligibility.maxIncome && profile.income > eligibility.maxIncome) {
    return false;
  }
  
  if (eligibility.minAge && profile.age < eligibility.minAge) {
    return false;
  }
  
  if (eligibility.maxAge && profile.age > eligibility.maxAge) {
    return false;
  }
  
  if (eligibility.categories && !eligibility.categories.includes(profile.category)) {
    return false;
  }
  
  if (eligibility.farmer === true && !profile.farmer) {
    return false;
  }
  
  if (eligibility.disability === true && !profile.disability) {
    return false;
  }
  
  if (eligibility.ruralOnly === true && profile.state && profile.state.toLowerCase().includes('urban')) {
    return false;
  }
  
  return true;
}

function filterEligibleSchemes(profile, schemes) {
  return schemes.filter(scheme => checkEligibility(profile, scheme));
}

function getEligibilityReasons(profile, scheme) {
  const reasons = [];
  const eligibility = scheme.eligibility || {};
  
  if (eligibility.maxIncome && profile.income <= eligibility.maxIncome) {
    reasons.push(`Income ₹${profile.income} is within limit of ₹${eligibility.maxIncome}`);
  }
  
  if (eligibility.categories && eligibility.categories.includes(profile.category)) {
    reasons.push(`Category ${profile.category} is eligible`);
  }
  
  if (eligibility.farmer === true && profile.farmer) {
    reasons.push('Farmer status matches');
  }
  
  if (eligibility.disability === true && profile.disability) {
    reasons.push('Disability status matches');
  }
  
  return reasons;
}

module.exports = {
  checkEligibility,
  filterEligibleSchemes,
  getEligibilityReasons
};
