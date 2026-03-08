/**
 * Get scheme name, description, benefits, and instruction step text in the given language.
 * Supports: en, hi, ta, te, bn. Falls back to English if translation missing.
 */
const keyMap = {
  hi: { name: 'nameHi', description: 'descriptionHi', benefits: 'benefitsHi', step: 'textHi' },
  ta: { name: 'nameTa', description: 'descriptionTa', benefits: 'benefitsTa', step: 'textTa' },
  te: { name: 'nameTe', description: 'descriptionTe', benefits: 'benefitsTe', step: 'textTe' },
  bn: { name: 'nameBn', description: 'descriptionBn', benefits: 'benefitsBn', step: 'textBn' },
};

export function getSchemeName(scheme, lang) {
  const keys = keyMap[lang];
  if (keys && scheme[keys.name]) return scheme[keys.name];
  return scheme.name || '';
}

export function getSchemeDesc(scheme, lang) {
  const keys = keyMap[lang];
  if (keys && scheme[keys.description]) return scheme[keys.description];
  return scheme.description || '';
}

export function getSchemeBenefits(scheme, lang) {
  const keys = keyMap[lang];
  if (keys && scheme[keys.benefits]) return scheme[keys.benefits];
  return scheme.benefits || '';
}

/**
 * Get instruction step text in the given language.
 * Step object may have text, textHi, textTa, textTe, textBn.
 */
export function getInstructionText(step, lang) {
  if (!step || typeof step !== 'object') return '';
  const keys = keyMap[lang];
  if (keys && step[keys.step]) return step[keys.step];
  return step.text || '';
}
