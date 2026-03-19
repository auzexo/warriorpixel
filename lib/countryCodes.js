// Country codes configuration
// Easy to add more countries in the future
export const countryCodes = [
  { code: '+91', name: 'India', flag: '🇮🇳', maxLength: 10 },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸', maxLength: 10 },
  { code: '+44', name: 'UK', flag: '🇬🇧', maxLength: 10 },
  { code: '+971', name: 'UAE', flag: '🇦🇪', maxLength: 9 },
  { code: '+61', name: 'Australia', flag: '🇦🇺', maxLength: 9 },
  { code: '+81', name: 'Japan', flag: '🇯🇵', maxLength: 10 },
  { code: '+86', name: 'China', flag: '🇨🇳', maxLength: 11 },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', maxLength: 8 },
  // Add more countries here easily!
];

export const getCountryByCode = (code) => {
  return countryCodes.find(c => c.code === code) || countryCodes[0];
};
