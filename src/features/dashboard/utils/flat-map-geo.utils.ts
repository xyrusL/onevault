import type {
  CloudflareColoTraffic,
  DashboardGlobalEdgeStats,
  GlobalCountryNode,
} from '../types/dashboard.types';

export type ContinentCode = 'NA' | 'SA' | 'EU' | 'AF' | 'AS' | 'OC';

export interface GeoCountryMeta {
  code: string;
  name: string;
  lat: number;
  lng: number;
  continent: ContinentCode;
}

export interface GeoColoMeta {
  city: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
}

/**
 * Comprehensive global ISO-3166-1 alpha-2 country coordinate & continent catalog.
 * Ensures any live incoming request from any country in the world resolves to its
 * authentic geographic center and continent instead of a blank or (0,0)/(20,0) fallback.
 */
export const GLOBAL_COUNTRY_CATALOG: Record<string, Omit<GeoCountryMeta, 'code'>> = {
  // North & Central America & Caribbean (NA)
  US: { name: 'United States', lat: 37.0902, lng: -95.7129, continent: 'NA' },
  CA: { name: 'Canada', lat: 56.1304, lng: -106.3468, continent: 'NA' },
  MX: { name: 'Mexico', lat: 23.6345, lng: -102.5528, continent: 'NA' },
  GT: { name: 'Guatemala', lat: 15.7835, lng: -90.2308, continent: 'NA' },
  BZ: { name: 'Belize', lat: 17.1899, lng: -88.4976, continent: 'NA' },
  HN: { name: 'Honduras', lat: 15.2, lng: -86.2419, continent: 'NA' },
  SV: { name: 'El Salvador', lat: 13.7942, lng: -88.8965, continent: 'NA' },
  NI: { name: 'Nicaragua', lat: 12.8654, lng: -85.2072, continent: 'NA' },
  CR: { name: 'Costa Rica', lat: 9.7489, lng: -83.7534, continent: 'NA' },
  PA: { name: 'Panama', lat: 8.538, lng: -80.7821, continent: 'NA' },
  CU: { name: 'Cuba', lat: 21.5218, lng: -77.7812, continent: 'NA' },
  JM: { name: 'Jamaica', lat: 18.1096, lng: -77.2975, continent: 'NA' },
  HT: { name: 'Haiti', lat: 18.9712, lng: -72.2852, continent: 'NA' },
  DO: { name: 'Dominican Republic', lat: 18.7357, lng: -70.1627, continent: 'NA' },
  PR: { name: 'Puerto Rico', lat: 18.2208, lng: -66.5901, continent: 'NA' },
  BS: { name: 'Bahamas', lat: 25.0343, lng: -77.3963, continent: 'NA' },
  TT: { name: 'Trinidad & Tobago', lat: 10.6918, lng: -61.2225, continent: 'NA' },
  BB: { name: 'Barbados', lat: 13.1939, lng: -59.5432, continent: 'NA' },

  // South America (SA)
  BR: { name: 'Brazil', lat: -14.235, lng: -51.9253, continent: 'SA' },
  AR: { name: 'Argentina', lat: -34.6037, lng: -58.3816, continent: 'SA' },
  CO: { name: 'Colombia', lat: 4.5709, lng: -74.2973, continent: 'SA' },
  CL: { name: 'Chile', lat: -33.4489, lng: -70.6693, continent: 'SA' },
  PE: { name: 'Peru', lat: -12.0464, lng: -77.0428, continent: 'SA' },
  VE: { name: 'Venezuela', lat: 6.4238, lng: -66.5897, continent: 'SA' },
  EC: { name: 'Ecuador', lat: -1.8312, lng: -78.1834, continent: 'SA' },
  BO: { name: 'Bolivia', lat: -16.2902, lng: -63.5887, continent: 'SA' },
  PY: { name: 'Paraguay', lat: -23.4425, lng: -58.4438, continent: 'SA' },
  UY: { name: 'Uruguay', lat: -32.5228, lng: -55.7658, continent: 'SA' },
  GY: { name: 'Guyana', lat: 4.8604, lng: -58.9302, continent: 'SA' },
  SR: { name: 'Suriname', lat: 3.9193, lng: -56.0278, continent: 'SA' },

  // Europe (EU)
  GB: { name: 'United Kingdom', lat: 51.5074, lng: -0.1278, continent: 'EU' },
  UK: { name: 'United Kingdom', lat: 51.5074, lng: -0.1278, continent: 'EU' },
  DE: { name: 'Germany', lat: 50.1109, lng: 8.6821, continent: 'EU' },
  FR: { name: 'France', lat: 48.8566, lng: 2.3522, continent: 'EU' },
  NL: { name: 'Netherlands', lat: 52.3676, lng: 4.9041, continent: 'EU' },
  IT: { name: 'Italy', lat: 41.8719, lng: 12.5674, continent: 'EU' },
  ES: { name: 'Spain', lat: 40.4168, lng: -3.7038, continent: 'EU' },
  PT: { name: 'Portugal', lat: 38.7223, lng: -9.1393, continent: 'EU' },
  PL: { name: 'Poland', lat: 52.2297, lng: 21.0122, continent: 'EU' },
  SE: { name: 'Sweden', lat: 59.3293, lng: 18.0686, continent: 'EU' },
  NO: { name: 'Norway', lat: 59.9139, lng: 10.7522, continent: 'EU' },
  DK: { name: 'Denmark', lat: 55.6761, lng: 12.5683, continent: 'EU' },
  FI: { name: 'Finland', lat: 60.1699, lng: 24.9384, continent: 'EU' },
  IS: { name: 'Iceland', lat: 64.1466, lng: -21.9426, continent: 'EU' },
  IE: { name: 'Ireland', lat: 53.3498, lng: -6.2603, continent: 'EU' },
  BE: { name: 'Belgium', lat: 50.8503, lng: 4.3517, continent: 'EU' },
  LU: { name: 'Luxembourg', lat: 49.6116, lng: 6.1319, continent: 'EU' },
  CH: { name: 'Switzerland', lat: 47.3769, lng: 8.5417, continent: 'EU' },
  AT: { name: 'Austria', lat: 48.2082, lng: 16.3738, continent: 'EU' },
  CZ: { name: 'Czechia', lat: 50.0755, lng: 14.4378, continent: 'EU' },
  SK: { name: 'Slovakia', lat: 48.1486, lng: 17.1077, continent: 'EU' },
  HU: { name: 'Hungary', lat: 47.4979, lng: 19.0402, continent: 'EU' },
  RO: { name: 'Romania', lat: 44.4268, lng: 26.1025, continent: 'EU' },
  BG: { name: 'Bulgaria', lat: 42.6977, lng: 23.3219, continent: 'EU' },
  GR: { name: 'Greece', lat: 37.9838, lng: 23.7275, continent: 'EU' },
  UA: { name: 'Ukraine', lat: 50.4501, lng: 30.5234, continent: 'EU' },
  EE: { name: 'Estonia', lat: 59.437, lng: 24.7536, continent: 'EU' },
  LV: { name: 'Latvia', lat: 56.9496, lng: 24.1052, continent: 'EU' },
  LT: { name: 'Lithuania', lat: 54.6872, lng: 25.2797, continent: 'EU' },
  HR: { name: 'Croatia', lat: 45.815, lng: 15.9819, continent: 'EU' },
  SI: { name: 'Slovenia', lat: 46.0569, lng: 14.5058, continent: 'EU' },
  RS: { name: 'Serbia', lat: 44.7866, lng: 20.4489, continent: 'EU' },
  BA: { name: 'Bosnia & Herzegovina', lat: 43.8563, lng: 18.4131, continent: 'EU' },
  AL: { name: 'Albania', lat: 41.3275, lng: 19.8187, continent: 'EU' },
  MK: { name: 'North Macedonia', lat: 41.9981, lng: 21.4254, continent: 'EU' },
  ME: { name: 'Montenegro', lat: 42.4304, lng: 19.2594, continent: 'EU' },
  MD: { name: 'Moldova', lat: 47.0105, lng: 28.8638, continent: 'EU' },
  BY: { name: 'Belarus', lat: 53.9006, lng: 27.559, continent: 'EU' },
  RU: { name: 'Russia', lat: 55.7558, lng: 37.6173, continent: 'EU' },
  CY: { name: 'Cyprus', lat: 35.1856, lng: 33.3823, continent: 'EU' },
  MT: { name: 'Malta', lat: 35.8989, lng: 14.5146, continent: 'EU' },

  // Africa (AF) — Full North, West, East, Central & Southern Africa
  ZA: { name: 'South Africa', lat: -26.2041, lng: 28.0473, continent: 'AF' },
  EG: { name: 'Egypt', lat: 30.0444, lng: 31.2357, continent: 'AF' },
  NG: { name: 'Nigeria', lat: 9.082, lng: 8.6753, continent: 'AF' },
  KE: { name: 'Kenya', lat: -1.2921, lng: 36.8219, continent: 'AF' },
  MA: { name: 'Morocco', lat: 33.5731, lng: -7.5898, continent: 'AF' },
  DZ: { name: 'Algeria', lat: 28.0339, lng: 1.6596, continent: 'AF' },
  TN: { name: 'Tunisia', lat: 33.8869, lng: 9.5375, continent: 'AF' },
  LY: { name: 'Libya', lat: 26.3351, lng: 17.2283, continent: 'AF' },
  GH: { name: 'Ghana', lat: 7.9465, lng: -1.0232, continent: 'AF' },
  CI: { name: "Côte d'Ivoire", lat: 7.54, lng: -5.5471, continent: 'AF' },
  SN: { name: 'Senegal', lat: 14.4974, lng: -14.4524, continent: 'AF' },
  ML: { name: 'Mali', lat: 17.5707, lng: -3.9962, continent: 'AF' },
  NE: { name: 'Niger', lat: 17.6078, lng: 8.0817, continent: 'AF' },
  BF: { name: 'Burkina Faso', lat: 12.2383, lng: -1.5616, continent: 'AF' },
  CM: { name: 'Cameroon', lat: 7.3697, lng: 12.3547, continent: 'AF' },
  ET: { name: 'Ethiopia', lat: 9.145, lng: 40.4897, continent: 'AF' },
  TZ: { name: 'Tanzania', lat: -6.369, lng: 34.8888, continent: 'AF' },
  UG: { name: 'Uganda', lat: 1.3733, lng: 32.2903, continent: 'AF' },
  RW: { name: 'Rwanda', lat: -1.9403, lng: 29.8739, continent: 'AF' },
  AO: { name: 'Angola', lat: -11.2027, lng: 17.8739, continent: 'AF' },
  MZ: { name: 'Mozambique', lat: -18.6657, lng: 35.5296, continent: 'AF' },
  ZW: { name: 'Zimbabwe', lat: -19.0154, lng: 29.1549, continent: 'AF' },
  ZM: { name: 'Zambia', lat: -13.1339, lng: 27.8493, continent: 'AF' },
  BW: { name: 'Botswana', lat: -22.3285, lng: 24.6849, continent: 'AF' },
  NA: { name: 'Namibia', lat: -22.9576, lng: 18.4904, continent: 'AF' },
  MU: { name: 'Mauritius', lat: -20.3484, lng: 57.5522, continent: 'AF' },
  MG: { name: 'Madagascar', lat: -18.7669, lng: 46.8691, continent: 'AF' },
  SD: { name: 'Sudan', lat: 12.8628, lng: 30.2176, continent: 'AF' },
  CD: { name: 'DR Congo', lat: -4.0383, lng: 21.7587, continent: 'AF' },
  CG: { name: 'Republic of the Congo', lat: -0.228, lng: 15.8277, continent: 'AF' },
  GA: { name: 'Gabon', lat: -0.8037, lng: 11.6094, continent: 'AF' },
  BJ: { name: 'Benin', lat: 9.3077, lng: 2.3158, continent: 'AF' },
  TG: { name: 'Togo', lat: 8.6195, lng: 0.8248, continent: 'AF' },
  MR: { name: 'Mauritania', lat: 21.0079, lng: -10.9408, continent: 'AF' },
  DJ: { name: 'Djibouti', lat: 11.8251, lng: 42.5903, continent: 'AF' },

  // Asia & Middle East (AS)
  PH: { name: 'Philippines', lat: 14.5995, lng: 120.9842, continent: 'AS' },
  SG: { name: 'Singapore', lat: 1.3521, lng: 103.8198, continent: 'AS' },
  JP: { name: 'Japan', lat: 35.6762, lng: 139.6503, continent: 'AS' },
  KR: { name: 'South Korea', lat: 37.5665, lng: 126.978, continent: 'AS' },
  CN: { name: 'China', lat: 31.2304, lng: 121.4737, continent: 'AS' },
  HK: { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, continent: 'AS' },
  MO: { name: 'Macau', lat: 22.1987, lng: 113.5439, continent: 'AS' },
  TW: { name: 'Taiwan', lat: 25.033, lng: 121.5654, continent: 'AS' },
  IN: { name: 'India', lat: 19.076, lng: 72.8777, continent: 'AS' },
  ID: { name: 'Indonesia', lat: -6.2088, lng: 106.8456, continent: 'AS' },
  MY: { name: 'Malaysia', lat: 3.139, lng: 101.6869, continent: 'AS' },
  TH: { name: 'Thailand', lat: 13.7563, lng: 100.5018, continent: 'AS' },
  VN: { name: 'Vietnam', lat: 10.8231, lng: 106.6297, continent: 'AS' },
  KH: { name: 'Cambodia', lat: 11.5564, lng: 104.9282, continent: 'AS' },
  LA: { name: 'Laos', lat: 17.9757, lng: 102.6331, continent: 'AS' },
  MM: { name: 'Myanmar', lat: 16.8409, lng: 96.1735, continent: 'AS' },
  BN: { name: 'Brunei', lat: 4.9031, lng: 114.9398, continent: 'AS' },
  BD: { name: 'Bangladesh', lat: 23.8103, lng: 90.4125, continent: 'AS' },
  LK: { name: 'Sri Lanka', lat: 6.9271, lng: 79.8612, continent: 'AS' },
  NP: { name: 'Nepal', lat: 27.7172, lng: 85.324, continent: 'AS' },
  PK: { name: 'Pakistan', lat: 24.8607, lng: 67.0011, continent: 'AS' },
  KZ: { name: 'Kazakhstan', lat: 43.222, lng: 76.8512, continent: 'AS' },
  UZ: { name: 'Uzbekistan', lat: 41.2995, lng: 69.2401, continent: 'AS' },
  MN: { name: 'Mongolia', lat: 47.8864, lng: 106.9057, continent: 'AS' },
  AE: { name: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, continent: 'AS' },
  SA: { name: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, continent: 'AS' },
  QA: { name: 'Qatar', lat: 25.2854, lng: 51.531, continent: 'AS' },
  KW: { name: 'Kuwait', lat: 29.3759, lng: 47.9774, continent: 'AS' },
  BH: { name: 'Bahrain', lat: 26.2285, lng: 50.586, continent: 'AS' },
  OM: { name: 'Oman', lat: 23.588, lng: 58.3829, continent: 'AS' },
  IL: { name: 'Israel', lat: 32.0853, lng: 34.7818, continent: 'AS' },
  JO: { name: 'Jordan', lat: 31.9454, lng: 35.9284, continent: 'AS' },
  LB: { name: 'Lebanon', lat: 33.8938, lng: 35.5018, continent: 'AS' },
  TR: { name: 'Turkey', lat: 41.0082, lng: 28.9784, continent: 'AS' },
  IQ: { name: 'Iraq', lat: 33.3152, lng: 44.3661, continent: 'AS' },
  IR: { name: 'Iran', lat: 35.6892, lng: 51.389, continent: 'AS' },
  GE: { name: 'Georgia', lat: 41.7151, lng: 44.8271, continent: 'AS' },
  AM: { name: 'Armenia', lat: 40.1792, lng: 44.4991, continent: 'AS' },
  AZ: { name: 'Azerbaijan', lat: 40.4093, lng: 49.8671, continent: 'AS' },

  // Oceania (OC)
  AU: { name: 'Australia', lat: -33.8688, lng: 151.2093, continent: 'OC' },
  NZ: { name: 'New Zealand', lat: -36.8485, lng: 174.7633, continent: 'OC' },
  FJ: { name: 'Fiji', lat: -18.1416, lng: 178.4419, continent: 'OC' },
  PG: { name: 'Papua New Guinea', lat: -9.4438, lng: 147.1803, continent: 'OC' },
  GU: { name: 'Guam', lat: 13.4443, lng: 144.7937, continent: 'OC' },
  NC: { name: 'New Caledonia', lat: -22.2758, lng: 166.458, continent: 'OC' },
  PF: { name: 'French Polynesia', lat: -17.6509, lng: -149.426, continent: 'OC' },
};

/**
 * Reverse lookup map from lowercased country name -> 2-letter ISO code.
 */
const COUNTRY_NAME_TO_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [code, meta] of Object.entries(GLOBAL_COUNTRY_CATALOG)) {
    map[meta.name.toLowerCase()] = code;
  }
  return map;
})();

/**
 * Comprehensive Cloudflare Anycast Edge Colo (IATA) catalog.
 */
export const GLOBAL_COLO_CATALOG: Record<string, GeoColoMeta> = {
  // Asia-Pacific & Oceania
  MNL: { city: 'Manila', countryCode: 'PH', countryName: 'Philippines', lat: 14.5995, lng: 120.9842 },
  CEB: { city: 'Cebu', countryCode: 'PH', countryName: 'Philippines', lat: 10.3157, lng: 123.8854 },
  CRK: { city: 'Clark', countryCode: 'PH', countryName: 'Philippines', lat: 15.1859, lng: 120.5603 },
  CGY: { city: 'Cagayan de Oro', countryCode: 'PH', countryName: 'Philippines', lat: 8.4542, lng: 124.6319 },
  DVO: { city: 'Davao', countryCode: 'PH', countryName: 'Philippines', lat: 7.1907, lng: 125.4553 },
  SIN: { city: 'Singapore', countryCode: 'SG', countryName: 'Singapore', lat: 1.3521, lng: 103.8198 },
  HKG: { city: 'Hong Kong', countryCode: 'HK', countryName: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  NRT: { city: 'Tokyo', countryCode: 'JP', countryName: 'Japan', lat: 35.6762, lng: 139.6503 },
  HND: { city: 'Tokyo', countryCode: 'JP', countryName: 'Japan', lat: 35.5494, lng: 139.7798 },
  KIX: { city: 'Osaka', countryCode: 'JP', countryName: 'Japan', lat: 34.6937, lng: 135.5023 },
  NGO: { city: 'Nagoya', countryCode: 'JP', countryName: 'Japan', lat: 35.1815, lng: 136.9066 },
  FUK: { city: 'Fukuoka', countryCode: 'JP', countryName: 'Japan', lat: 33.5902, lng: 130.4017 },
  ICN: { city: 'Seoul', countryCode: 'KR', countryName: 'South Korea', lat: 37.5665, lng: 126.978 },
  TPE: { city: 'Taipei', countryCode: 'TW', countryName: 'Taiwan', lat: 25.033, lng: 121.5654 },
  KHH: { city: 'Kaohsiung', countryCode: 'TW', countryName: 'Taiwan', lat: 22.6273, lng: 120.3014 },
  BKK: { city: 'Bangkok', countryCode: 'TH', countryName: 'Thailand', lat: 13.7563, lng: 100.5018 },
  CNX: { city: 'Chiang Mai', countryCode: 'TH', countryName: 'Thailand', lat: 18.7883, lng: 98.9853 },
  SGN: { city: 'Ho Chi Minh City', countryCode: 'VN', countryName: 'Vietnam', lat: 10.8231, lng: 106.6297 },
  HAN: { city: 'Hanoi', countryCode: 'VN', countryName: 'Vietnam', lat: 21.0285, lng: 105.8542 },
  DAD: { city: 'Da Nang', countryCode: 'VN', countryName: 'Vietnam', lat: 16.0544, lng: 108.2022 },
  KUL: { city: 'Kuala Lumpur', countryCode: 'MY', countryName: 'Malaysia', lat: 3.139, lng: 101.6869 },
  JHB: { city: 'Johor Bahru', countryCode: 'MY', countryName: 'Malaysia', lat: 1.4927, lng: 103.7414 },
  CGK: { city: 'Jakarta', countryCode: 'ID', countryName: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  DPS: { city: 'Denpasar', countryCode: 'ID', countryName: 'Indonesia', lat: -8.6705, lng: 115.2126 },
  PNH: { city: 'Phnom Penh', countryCode: 'KH', countryName: 'Cambodia', lat: 11.5564, lng: 104.9282 },
  VTE: { city: 'Vientiane', countryCode: 'LA', countryName: 'Laos', lat: 17.9757, lng: 102.6331 },
  RGN: { city: 'Yangon', countryCode: 'MM', countryName: 'Myanmar', lat: 16.8409, lng: 96.1735 },
  BWN: { city: 'Bandar Seri Begawan', countryCode: 'BN', countryName: 'Brunei', lat: 4.9031, lng: 114.9398 },
  BOM: { city: 'Mumbai', countryCode: 'IN', countryName: 'India', lat: 19.076, lng: 72.8777 },
  DEL: { city: 'New Delhi', countryCode: 'IN', countryName: 'India', lat: 28.6139, lng: 77.209 },
  BLR: { city: 'Bengaluru', countryCode: 'IN', countryName: 'India', lat: 12.9716, lng: 77.5946 },
  MAA: { city: 'Chennai', countryCode: 'IN', countryName: 'India', lat: 13.0827, lng: 80.2707 },
  HYD: { city: 'Hyderabad', countryCode: 'IN', countryName: 'India', lat: 17.385, lng: 78.4867 },
  CCU: { city: 'Kolkata', countryCode: 'IN', countryName: 'India', lat: 22.5726, lng: 88.3639 },
  AMD: { city: 'Ahmedabad', countryCode: 'IN', countryName: 'India', lat: 23.0225, lng: 72.5714 },
  COK: { city: 'Kochi', countryCode: 'IN', countryName: 'India', lat: 9.9312, lng: 76.2673 },
  NAG: { city: 'Nagpur', countryCode: 'IN', countryName: 'India', lat: 21.1458, lng: 79.0882 },
  PAT: { city: 'Patna', countryCode: 'IN', countryName: 'India', lat: 25.5941, lng: 85.1376 },
  DAC: { city: 'Dhaka', countryCode: 'BD', countryName: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  CMB: { city: 'Colombo', countryCode: 'LK', countryName: 'Sri Lanka', lat: 6.9271, lng: 79.8612 },
  KTM: { city: 'Kathmandu', countryCode: 'NP', countryName: 'Nepal', lat: 27.7172, lng: 85.324 },
  KHI: { city: 'Karachi', countryCode: 'PK', countryName: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  LHE: { city: 'Lahore', countryCode: 'PK', countryName: 'Pakistan', lat: 31.5204, lng: 74.3587 },
  ISB: { city: 'Islamabad', countryCode: 'PK', countryName: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  SYD: { city: 'Sydney', countryCode: 'AU', countryName: 'Australia', lat: -33.8688, lng: 151.2093 },
  MEL: { city: 'Melbourne', countryCode: 'AU', countryName: 'Australia', lat: -37.8136, lng: 144.9631 },
  BNE: { city: 'Brisbane', countryCode: 'AU', countryName: 'Australia', lat: -27.4698, lng: 153.0251 },
  PER: { city: 'Perth', countryCode: 'AU', countryName: 'Australia', lat: -31.9505, lng: 115.8605 },
  ADL: { city: 'Adelaide', countryCode: 'AU', countryName: 'Australia', lat: -34.9285, lng: 138.6007 },
  AKL: { city: 'Auckland', countryCode: 'NZ', countryName: 'New Zealand', lat: -36.8485, lng: 174.7633 },
  CHC: { city: 'Christchurch', countryCode: 'NZ', countryName: 'New Zealand', lat: -43.5321, lng: 172.6362 },
  SUV: { city: 'Suva', countryCode: 'FJ', countryName: 'Fiji', lat: -18.1416, lng: 178.4419 },

  // Middle East & Africa
  DXB: { city: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  DOH: { city: 'Doha', countryCode: 'QA', countryName: 'Qatar', lat: 25.2854, lng: 51.531 },
  RUH: { city: 'Riyadh', countryCode: 'SA', countryName: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  JED: { city: 'Jeddah', countryCode: 'SA', countryName: 'Saudi Arabia', lat: 21.4858, lng: 39.1925 },
  DMM: { city: 'Dammam', countryCode: 'SA', countryName: 'Saudi Arabia', lat: 26.4207, lng: 50.0888 },
  KWI: { city: 'Kuwait City', countryCode: 'KW', countryName: 'Kuwait', lat: 29.3759, lng: 47.9774 },
  BAH: { city: 'Manama', countryCode: 'BH', countryName: 'Bahrain', lat: 26.2285, lng: 50.586 },
  MCT: { city: 'Muscat', countryCode: 'OM', countryName: 'Oman', lat: 23.588, lng: 58.3829 },
  TLV: { city: 'Tel Aviv', countryCode: 'IL', countryName: 'Israel', lat: 32.0853, lng: 34.7818 },
  AMM: { city: 'Amman', countryCode: 'JO', countryName: 'Jordan', lat: 31.9454, lng: 35.9284 },
  BEY: { city: 'Beirut', countryCode: 'LB', countryName: 'Lebanon', lat: 33.8938, lng: 35.5018 },
  IST: { city: 'Istanbul', countryCode: 'TR', countryName: 'Turkey', lat: 41.0082, lng: 28.9784 },
  JNB: { city: 'Johannesburg', countryCode: 'ZA', countryName: 'South Africa', lat: -26.2041, lng: 28.0473 },
  CPT: { city: 'Cape Town', countryCode: 'ZA', countryName: 'South Africa', lat: -33.9249, lng: 18.4241 },
  DUR: { city: 'Durban', countryCode: 'ZA', countryName: 'South Africa', lat: -29.8587, lng: 31.0218 },
  CAI: { city: 'Cairo', countryCode: 'EG', countryName: 'Egypt', lat: 30.0444, lng: 31.2357 },
  LOS: { city: 'Lagos', countryCode: 'NG', countryName: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  ABV: { city: 'Abuja', countryCode: 'NG', countryName: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  NBO: { city: 'Nairobi', countryCode: 'KE', countryName: 'Kenya', lat: -1.2921, lng: 36.8219 },
  MBA: { city: 'Mombasa', countryCode: 'KE', countryName: 'Kenya', lat: -4.0435, lng: 39.6682 },
  CMN: { city: 'Casablanca', countryCode: 'MA', countryName: 'Morocco', lat: 33.5731, lng: -7.5898 },
  ALG: { city: 'Algiers', countryCode: 'DZ', countryName: 'Algeria', lat: 36.7538, lng: 3.0588 },
  TUN: { city: 'Tunis', countryCode: 'TN', countryName: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  DKR: { city: 'Dakar', countryCode: 'SN', countryName: 'Senegal', lat: 14.7167, lng: -17.4677 },
  ACC: { city: 'Accra', countryCode: 'GH', countryName: 'Ghana', lat: 5.6037, lng: -0.187 },
  ABJ: { city: 'Abidjan', countryCode: 'CI', countryName: "Côte d'Ivoire", lat: 5.36, lng: -4.0083 },
  ADD: { city: 'Addis Ababa', countryCode: 'ET', countryName: 'Ethiopia', lat: 9.032, lng: 38.7469 },
  DAR: { city: 'Dar es Salaam', countryCode: 'TZ', countryName: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  KGL: { city: 'Kigali', countryCode: 'RW', countryName: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  EBB: { city: 'Kampala', countryCode: 'UG', countryName: 'Uganda', lat: 0.3476, lng: 32.5825 },
  LAD: { city: 'Luanda', countryCode: 'AO', countryName: 'Angola', lat: -8.839, lng: 13.2894 },
  MPM: { city: 'Maputo', countryCode: 'MZ', countryName: 'Mozambique', lat: -25.9692, lng: 32.5732 },
  HRE: { city: 'Harare', countryCode: 'ZW', countryName: 'Zimbabwe', lat: -17.8252, lng: 31.0335 },
  MRU: { city: 'Port Louis', countryCode: 'MU', countryName: 'Mauritius', lat: -20.1609, lng: 57.5012 },

  // Europe
  LHR: { city: 'London', countryCode: 'GB', countryName: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  MAN: { city: 'Manchester', countryCode: 'GB', countryName: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  EDI: { city: 'Edinburgh', countryCode: 'GB', countryName: 'United Kingdom', lat: 55.9533, lng: -3.1883 },
  DUB: { city: 'Dublin', countryCode: 'IE', countryName: 'Ireland', lat: 53.3498, lng: -6.2603 },
  FRA: { city: 'Frankfurt', countryCode: 'DE', countryName: 'Germany', lat: 50.1109, lng: 8.6821 },
  MUC: { city: 'Munich', countryCode: 'DE', countryName: 'Germany', lat: 48.1351, lng: 11.582 },
  BER: { city: 'Berlin', countryCode: 'DE', countryName: 'Germany', lat: 52.52, lng: 13.405 },
  DUS: { city: 'Düsseldorf', countryCode: 'DE', countryName: 'Germany', lat: 51.2277, lng: 6.7735 },
  HAM: { city: 'Hamburg', countryCode: 'DE', countryName: 'Germany', lat: 53.5511, lng: 9.9937 },
  CDG: { city: 'Paris', countryCode: 'FR', countryName: 'France', lat: 48.8566, lng: 2.3522 },
  MRS: { city: 'Marseille', countryCode: 'FR', countryName: 'France', lat: 43.2965, lng: 5.3698 },
  LYS: { city: 'Lyon', countryCode: 'FR', countryName: 'France', lat: 45.764, lng: 4.8357 },
  AMS: { city: 'Amsterdam', countryCode: 'NL', countryName: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  BRU: { city: 'Brussels', countryCode: 'BE', countryName: 'Belgium', lat: 50.8503, lng: 4.3517 },
  LUX: { city: 'Luxembourg', countryCode: 'LU', countryName: 'Luxembourg', lat: 49.6116, lng: 6.1319 },
  ZRH: { city: 'Zurich', countryCode: 'CH', countryName: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  GVA: { city: 'Geneva', countryCode: 'CH', countryName: 'Switzerland', lat: 46.2044, lng: 6.1432 },
  VIE: { city: 'Vienna', countryCode: 'AT', countryName: 'Austria', lat: 48.2082, lng: 16.3738 },
  MXP: { city: 'Milan', countryCode: 'IT', countryName: 'Italy', lat: 45.4642, lng: 9.19 },
  FCO: { city: 'Rome', countryCode: 'IT', countryName: 'Italy', lat: 41.9028, lng: 12.4964 },
  MAD: { city: 'Madrid', countryCode: 'ES', countryName: 'Spain', lat: 40.4168, lng: -3.7038 },
  BCN: { city: 'Barcelona', countryCode: 'ES', countryName: 'Spain', lat: 41.3874, lng: 2.1686 },
  LIS: { city: 'Lisbon', countryCode: 'PT', countryName: 'Portugal', lat: 38.7223, lng: -9.1393 },
  WAW: { city: 'Warsaw', countryCode: 'PL', countryName: 'Poland', lat: 52.2297, lng: 21.0122 },
  PRG: { city: 'Prague', countryCode: 'CZ', countryName: 'Czechia', lat: 50.0755, lng: 14.4378 },
  BUD: { city: 'Budapest', countryCode: 'HU', countryName: 'Hungary', lat: 47.4979, lng: 19.0402 },
  OTP: { city: 'Bucharest', countryCode: 'RO', countryName: 'Romania', lat: 44.4268, lng: 26.1025 },
  SOF: { city: 'Sofia', countryCode: 'BG', countryName: 'Bulgaria', lat: 42.6977, lng: 23.3219 },
  ATH: { city: 'Athens', countryCode: 'GR', countryName: 'Greece', lat: 37.9838, lng: 23.7275 },
  ARN: { city: 'Stockholm', countryCode: 'SE', countryName: 'Sweden', lat: 59.3293, lng: 18.0686 },
  CPH: { city: 'Copenhagen', countryCode: 'DK', countryName: 'Denmark', lat: 55.6761, lng: 12.5683 },
  OSL: { city: 'Oslo', countryCode: 'NO', countryName: 'Norway', lat: 59.9139, lng: 10.7522 },
  HEL: { city: 'Helsinki', countryCode: 'FI', countryName: 'Finland', lat: 60.1699, lng: 24.9384 },
  TLL: { city: 'Tallinn', countryCode: 'EE', countryName: 'Estonia', lat: 59.437, lng: 24.7536 },
  RIX: { city: 'Riga', countryCode: 'LV', countryName: 'Latvia', lat: 56.9496, lng: 24.1052 },
  VNO: { city: 'Vilnius', countryCode: 'LT', countryName: 'Lithuania', lat: 54.6872, lng: 25.2797 },
  KBP: { city: 'Kyiv', countryCode: 'UA', countryName: 'Ukraine', lat: 50.4501, lng: 30.5234 },

  // North & South America
  SJC: { city: 'San Jose', countryCode: 'US', countryName: 'United States', lat: 37.3382, lng: -121.8863 },
  LAX: { city: 'Los Angeles', countryCode: 'US', countryName: 'United States', lat: 34.0522, lng: -118.2437 },
  SFO: { city: 'San Francisco', countryCode: 'US', countryName: 'United States', lat: 37.7749, lng: -122.4194 },
  SEA: { city: 'Seattle', countryCode: 'US', countryName: 'United States', lat: 47.6062, lng: -122.3321 },
  PDX: { city: 'Portland', countryCode: 'US', countryName: 'United States', lat: 45.5152, lng: -122.6784 },
  PHX: { city: 'Phoenix', countryCode: 'US', countryName: 'United States', lat: 33.4484, lng: -112.074 },
  DEN: { city: 'Denver', countryCode: 'US', countryName: 'United States', lat: 39.7392, lng: -104.9903 },
  SLC: { city: 'Salt Lake City', countryCode: 'US', countryName: 'United States', lat: 40.7608, lng: -111.891 },
  DFW: { city: 'Dallas', countryCode: 'US', countryName: 'United States', lat: 32.7767, lng: -96.797 },
  IAH: { city: 'Houston', countryCode: 'US', countryName: 'United States', lat: 29.7604, lng: -95.3698 },
  ORD: { city: 'Chicago', countryCode: 'US', countryName: 'United States', lat: 41.8781, lng: -87.6298 },
  MSP: { city: 'Minneapolis', countryCode: 'US', countryName: 'United States', lat: 44.9778, lng: -93.265 },
  DTW: { city: 'Detroit', countryCode: 'US', countryName: 'United States', lat: 42.3314, lng: -83.0458 },
  ATL: { city: 'Atlanta', countryCode: 'US', countryName: 'United States', lat: 33.749, lng: -84.388 },
  MIA: { city: 'Miami', countryCode: 'US', countryName: 'United States', lat: 25.7617, lng: -80.1918 },
  IAD: { city: 'Ashburn', countryCode: 'US', countryName: 'United States', lat: 38.9072, lng: -77.0369 },
  EWR: { city: 'Newark', countryCode: 'US', countryName: 'United States', lat: 40.7357, lng: -74.1724 },
  JFK: { city: 'New York', countryCode: 'US', countryName: 'United States', lat: 40.7128, lng: -74.006 },
  BOS: { city: 'Boston', countryCode: 'US', countryName: 'United States', lat: 42.3601, lng: -71.0589 },
  YYZ: { city: 'Toronto', countryCode: 'CA', countryName: 'Canada', lat: 43.6532, lng: -79.3832 },
  YUL: { city: 'Montreal', countryCode: 'CA', countryName: 'Canada', lat: 45.5017, lng: -73.5673 },
  YVR: { city: 'Vancouver', countryCode: 'CA', countryName: 'Canada', lat: 49.2827, lng: -123.1207 },
  YYC: { city: 'Calgary', countryCode: 'CA', countryName: 'Canada', lat: 51.0447, lng: -114.0719 },
  MEX: { city: 'Mexico City', countryCode: 'MX', countryName: 'Mexico', lat: 19.4326, lng: -99.1332 },
  QRO: { city: 'Querétaro', countryCode: 'MX', countryName: 'Mexico', lat: 20.5888, lng: -100.3899 },
  PTY: { city: 'Panama City', countryCode: 'PA', countryName: 'Panama', lat: 8.9824, lng: -79.5199 },
  SJO: { city: 'San José', countryCode: 'CR', countryName: 'Costa Rica', lat: 9.9281, lng: -84.0907 },
  GRU: { city: 'São Paulo', countryCode: 'BR', countryName: 'Brazil', lat: -23.5505, lng: -46.6333 },
  GIG: { city: 'Rio de Janeiro', countryCode: 'BR', countryName: 'Brazil', lat: -22.9068, lng: -43.1729 },
  FOR: { city: 'Fortaleza', countryCode: 'BR', countryName: 'Brazil', lat: -3.7172, lng: -38.5433 },
  EZE: { city: 'Buenos Aires', countryCode: 'AR', countryName: 'Argentina', lat: -34.6037, lng: -58.3816 },
  SCL: { city: 'Santiago', countryCode: 'CL', countryName: 'Chile', lat: -33.4489, lng: -70.6693 },
  BOG: { city: 'Bogotá', countryCode: 'CO', countryName: 'Colombia', lat: 4.711, lng: -74.0721 },
  LIM: { city: 'Lima', countryCode: 'PE', countryName: 'Peru', lat: -12.0464, lng: -77.0428 },
  UIO: { city: 'Quito', countryCode: 'EC', countryName: 'Ecuador', lat: -0.1807, lng: -78.4678 },
};

const intlRegionNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/**
 * Checks whether a coordinate pair is a placeholder/invalid fallback
 * (e.g. Sahara [20, 0] or Null Island [0, 0]).
 */
export function isPlaceholderCoord(lat?: number, lng?: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return true;
  }
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return true;
  if (Math.abs(lat - 20.0) < 0.05 && Math.abs(lng) < 0.05) return true;
  return false;
}

/**
 * Reverse-geocodes any arbitrary [lat, lng] coordinate to the nearest real country
 * in GLOBAL_COUNTRY_CATALOG so any coordinate on the map can be labeled.
 */
export function findNearestCountryByCoords(lat: number, lng: number): GeoCountryMeta {
  let bestCode = 'US';
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const [code, meta] of Object.entries(GLOBAL_COUNTRY_CATALOG)) {
    if (code === 'UK') continue;
    const dLat = lat - meta.lat;
    const dLng = lng - meta.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestCode = code;
    }
  }

  const found = GLOBAL_COUNTRY_CATALOG[bestCode];
  return {
    code: bestCode,
    name: found.name,
    lat: found.lat,
    lng: found.lng,
    continent: found.continent,
  };
}

/**
 * Resolves any ISO-2 code or country name into full Country Metadata
 * (2-letter code, display name, authentic coordinates, and continent).
 */
export function resolveCountryGeo(
  rawCountryOrCode?: string,
  rawColoCode?: string,
  hintLat?: number,
  hintLng?: number
): GeoCountryMeta {
  const coloKey = (rawColoCode || '').trim().toUpperCase();
  const coloMeta = coloKey ? GLOBAL_COLO_CATALOG[coloKey] : undefined;

  const trimmed = (rawCountryOrCode || '').trim();
  const upper = trimmed.toUpperCase();

  // 1. Direct 2-letter ISO lookup (ignoring placeholder 'XX')
  if (upper && upper !== 'XX' && GLOBAL_COUNTRY_CATALOG[upper]) {
    const entry = GLOBAL_COUNTRY_CATALOG[upper];
    return {
      code: upper === 'UK' ? 'GB' : upper,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      continent: entry.continent,
    };
  }

  // 2. Reverse lookup by full country name (e.g., "Philippines" -> "PH")
  const byNameCode = COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()];
  if (byNameCode && GLOBAL_COUNTRY_CATALOG[byNameCode]) {
    const entry = GLOBAL_COUNTRY_CATALOG[byNameCode];
    return {
      code: byNameCode,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      continent: entry.continent,
    };
  }

  // 3. Fallback to Colo metadata if known
  if (coloMeta) {
    const cMeta = GLOBAL_COUNTRY_CATALOG[coloMeta.countryCode];
    return {
      code: coloMeta.countryCode,
      name: coloMeta.countryName,
      lat: coloMeta.lat,
      lng: coloMeta.lng,
      continent: cMeta?.continent ?? 'AS',
    };
  }

  // 4. If valid coordinates are available, reverse-geocode to nearest country
  if (typeof hintLat === 'number' && typeof hintLng === 'number' && !isPlaceholderCoord(hintLat, hintLng)) {
    const nearest = findNearestCountryByCoords(hintLat, hintLng);
    if (upper.length === 2 && upper !== 'XX' && intlRegionNames) {
      try {
        const resolvedName = intlRegionNames.of(upper);
        if (resolvedName) {
          return {
            code: upper,
            name: resolvedName,
            lat: hintLat,
            lng: hintLng,
            continent: nearest.continent,
          };
        }
      } catch {
        // ignore
      }
    }
    return {
      ...nearest,
      lat: hintLat,
      lng: hintLng,
    };
  }

  // 5. Use Intl.DisplayNames if it's a valid 2-letter ISO code not in static dictionary
  const isoCode = upper.length === 2 && upper !== 'XX' ? upper : 'DZ';
  let displayName = trimmed && upper !== 'XX' ? trimmed : 'Algeria';
  if (isoCode.length === 2 && intlRegionNames) {
    try {
      const resolved = intlRegionNames.of(isoCode);
      if (resolved) displayName = resolved;
    } catch {
      // ignore
    }
  }

  const fallbackMeta = GLOBAL_COUNTRY_CATALOG[isoCode];
  if (fallbackMeta) {
    return {
      code: isoCode,
      name: fallbackMeta.name,
      lat: fallbackMeta.lat,
      lng: fallbackMeta.lng,
      continent: fallbackMeta.continent,
    };
  }

  return {
    code: isoCode,
    name: displayName,
    lat: 28.0339,
    lng: 1.6596,
    continent: 'AF',
  };
}

/**
 * Resolves a Cloudflare Colo + Country combination, automatically repairing
 * any placeholder coordinates like (20, 0) or (0, 0).
 */
export function resolveColoAndCountryGeo(input: {
  coloCode?: string;
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
}): {
  coloCode: string;
  city: string;
  countryCode: string;
  countryName: string;
  continent: ContinentCode;
  lat: number;
  lng: number;
} {
  const coloKey = (input.coloCode || '').trim().toUpperCase();
  const knownColo = coloKey ? GLOBAL_COLO_CATALOG[coloKey] : undefined;
  const countryMeta = resolveCountryGeo(
    input.country || knownColo?.countryCode,
    coloKey,
    input.lat,
    input.lng
  );

  const hasValidInputCoords = !isPlaceholderCoord(input.lat, input.lng);

  const lat = knownColo
    ? knownColo.lat
    : hasValidInputCoords
    ? (input.lat as number)
    : countryMeta.lat;

  const lng = knownColo
    ? knownColo.lng
    : hasValidInputCoords
    ? (input.lng as number)
    : countryMeta.lng;

  const city =
    knownColo?.city ||
    (input.city && input.city.toUpperCase() !== coloKey ? input.city : countryMeta.name);

  return {
    coloCode: coloKey || countryMeta.code,
    city,
    countryCode: knownColo?.countryCode || countryMeta.code,
    countryName: knownColo?.countryName || countryMeta.name,
    continent: countryMeta.continent,
    lat,
    lng,
  };
}

export interface DynamicMapEndpointLabel {
  id: string;
  countryCode: string;
  countryName: string;
  city: string;
  colo: string;
  continent: ContinentCode;
  lat: number;
  lng: number;
  nodeSvgX: number;
  nodeSvgY: number;
  labelX: number; // % of map width
  labelY: number; // % of map height
  labelSvgX: number;
  labelSvgY: number;
  requests: number;
  isViewerOrigin: boolean;
  isThreat: boolean;
  countryNode: GlobalCountryNode;
}

export interface ObstacleBoxPct {
  x: number; // center % X
  y: number; // center % Y
  w: number; // width %
  h: number; // height %
}

/**
 * Algorithmic Label Placement Engine for the Live Global Flat Map.
 * Automatically generates non-overlapping country labels with leader lines
 * for any live traffic endpoints/countries on the map so no active region is left blank.
 */
export function computeDynamicCountryMapLabels(params: {
  globalEdge: DashboardGlobalEdgeStats;
  projectCoords: (lat: number, lng: number) => [number, number];
  mapWidth: number;
  mapHeight: number;
  continentCardObstacles: ObstacleBoxPct[];
  domainScale: number;
}): DynamicMapEndpointLabel[] {
  const {
    globalEdge,
    projectCoords,
    mapWidth,
    mapHeight,
    continentCardObstacles,
    domainScale,
  } = params;

  const sec = globalEdge.securityTelemetry;
  const liveThreatCodes = new Set(
    (sec?.liveThreatCountries || []).map((t) =>
      resolveCountryGeo(t.countryCode).code.toUpperCase()
    )
  );

  // 1. Collect and normalize all active live nodes from countries + topColos + viewer origin
  const nodeMap = new Map<string, GlobalCountryNode>();

  // Always include viewer's live detected origin POP first
  const viewerGeo = resolveColoAndCountryGeo({
    coloCode: globalEdge.viewerColo,
    country: globalEdge.viewerCountry,
    city: globalEdge.viewerCity,
    lat: globalEdge.viewerLat,
    lng: globalEdge.viewerLng,
  });

  nodeMap.set(viewerGeo.countryCode, {
    code: viewerGeo.countryCode,
    country: viewerGeo.countryName,
    city: viewerGeo.city,
    colo: viewerGeo.coloCode,
    continent: viewerGeo.continent,
    lat: viewerGeo.lat,
    lng: viewerGeo.lng,
    requests:
      globalEdge.countries.find((c) => c.code === viewerGeo.countryCode)?.requests ||
      Math.max(120, Math.round(globalEdge.totalGlobalSignals * 0.25)),
    growthPct: 24,
    latencyMs: globalEdge.clientTcpRttMs || 12,
    status: 'sync',
  });

  // Add live Cloudflare colos if available
  if (sec?.hasLiveCloudflareData && sec.topColos.length > 0) {
    for (const rawColo of sec.topColos.slice(0, 10)) {
      const resolved = resolveColoAndCountryGeo({
        coloCode: rawColo.coloCode,
        country: rawColo.country,
        city: rawColo.city,
        lat: rawColo.lat,
        lng: rawColo.lng,
      });

      const key = `${resolved.countryCode}-${resolved.coloCode}`;
      const existingByCountry = nodeMap.get(resolved.countryCode);

      const node: GlobalCountryNode = {
        code: resolved.countryCode,
        country: resolved.countryName,
        city: resolved.city,
        colo: resolved.coloCode,
        continent: resolved.continent,
        lat: resolved.lat,
        lng: resolved.lng,
        requests: rawColo.requests,
        growthPct: 18,
        latencyMs: 16,
        status: liveThreatCodes.has(resolved.countryCode)
          ? 'threat'
          : rawColo.requests > 300
          ? 'busy'
          : 'normal',
      };

      if (!existingByCountry) {
        nodeMap.set(resolved.countryCode, node);
      } else if (existingByCountry.colo !== resolved.coloCode && nodeMap.size < 10) {
        nodeMap.set(key, node);
      } else {
        existingByCountry.requests = Math.max(existingByCountry.requests, rawColo.requests);
      }
    }
  }

  // Merge all globalEdge.countries (repairing any placeholder coordinates)
  for (const rawCountry of globalEdge.countries.slice(0, 10)) {
    const resolved = resolveColoAndCountryGeo({
      coloCode: rawCountry.colo,
      country: rawCountry.code || rawCountry.country,
      city: rawCountry.city,
      lat: rawCountry.lat,
      lng: rawCountry.lng,
    });

    if (!nodeMap.has(resolved.countryCode)) {
      nodeMap.set(resolved.countryCode, {
        ...rawCountry,
        code: resolved.countryCode,
        country: resolved.countryName,
        city: resolved.city,
        colo: resolved.coloCode,
        continent: resolved.continent,
        lat: resolved.lat,
        lng: resolved.lng,
        status: liveThreatCodes.has(resolved.countryCode) ? 'threat' : rawCountry.status,
      });
    }
  }

  // Also include any active live threat countries
  if (sec?.liveThreatCountries) {
    for (const threat of sec.liveThreatCountries) {
      const resolved = resolveCountryGeo(
        threat.countryCode || threat.countryName,
        undefined,
        threat.lat,
        threat.lng
      );
      if (!nodeMap.has(resolved.code)) {
        nodeMap.set(resolved.code, {
          code: resolved.code,
          country: resolved.name,
          city: resolved.name,
          colo: 'WAF',
          continent: resolved.continent,
          lat: isPlaceholderCoord(threat.lat, threat.lng) ? resolved.lat : threat.lat,
          lng: isPlaceholderCoord(threat.lat, threat.lng) ? resolved.lng : threat.lng,
          requests: 1,
          growthPct: 0,
          latencyMs: 45,
          status: 'threat',
        });
      }
    }
  }

  const allNodes = Array.from(nodeMap.values()).slice(0, 12);

  // 2. Place labels using candidate angle scoring + bounding-box collision avoidance
  const placedBoxes: ObstacleBoxPct[] = [...continentCardObstacles];
  const LABEL_W_PCT = 11.2;
  const LABEL_H_PCT = 6.8;

  // Radial candidate offsets in % space (dx, dy) around each node pin
  const candidateOffsets: Array<[number, number]> = [
    [0, -6.8],
    [0, 6.8],
    [7.8, -4.5],
    [-7.8, -4.5],
    [7.8, 4.5],
    [-7.8, 4.5],
    [9.8, 0],
    [-9.8, 0],
    [5.2, -9.5],
    [-5.2, -9.5],
    [5.2, 9.5],
    [-5.2, 9.5],
    [12.0, -6.2],
    [-12.0, -6.2],
    [12.0, 6.2],
    [-12.0, 6.2],
  ];

  // Precompute all node pin % positions so labels also avoid covering other pins
  const pinPctCoords = allNodes.map((n) => {
    const [sx, sy] = projectCoords(n.lat, n.lng);
    return {
      x: (sx / mapWidth) * 100,
      y: (sy / mapHeight) * 100,
      sx,
      sy,
    };
  });

  const boxesOverlap = (a: ObstacleBoxPct, b: ObstacleBoxPct): number => {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    const minDx = (a.w + b.w) / 2 + 1.0;
    const minDy = (a.h + b.h) / 2 + 1.0;
    if (dx < minDx && dy < minDy) {
      return (minDx - dx) * (minDy - dy);
    }
    return 0;
  };

  return allNodes.map((node, idx) => {
    const pin = pinPctCoords[idx];
    let bestX = Math.max(7, Math.min(93, pin.x));
    let bestY = Math.max(8, Math.min(92, pin.y - 6.8));
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (const [dx, dy] of candidateOffsets) {
      const candX = Math.max(7.0, Math.min(93.0, pin.x + dx));
      const candY = Math.max(8.0, Math.min(92.0, pin.y + dy));
      const candBox: ObstacleBoxPct = {
        x: candX,
        y: candY,
        w: LABEL_W_PCT,
        h: LABEL_H_PCT,
      };

      let penalty = 0;

      // Penalize overlap with continent cards & already placed country labels
      for (const obs of placedBoxes) {
        const overlapArea = boxesOverlap(candBox, obs);
        if (overlapArea > 0) {
          penalty += 5000 + overlapArea * 120;
        }
      }

      // Penalize covering any glowing node pin
      for (let pIdx = 0; pIdx < pinPctCoords.length; pIdx++) {
        const otherPin = pinPctCoords[pIdx];
        const pinBox: ObstacleBoxPct = { x: otherPin.x, y: otherPin.y, w: 3.0, h: 4.6 };
        const pinOverlap = boxesOverlap(candBox, pinBox);
        if (pinOverlap > 0) {
          penalty += 2200 + pinOverlap * 80;
        }
      }

      // Mild distance preference so label stays close to its own pin
      const distSq = (candX - pin.x) ** 2 + (candY - pin.y) ** 2;
      penalty += distSq * 0.45;

      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestX = candX;
        bestY = candY;
        if (penalty < 50) break;
      }
    }

    placedBoxes.push({
      x: bestX,
      y: bestY,
      w: LABEL_W_PCT,
      h: LABEL_H_PCT,
    });

    const labelSvgX = (bestX / 100) * mapWidth;
    const labelSvgY = (bestY / 100) * mapHeight;

    return {
      id: `live-lbl-${node.code}-${node.colo}-${idx}`,
      countryCode: node.code,
      countryName: node.country,
      city: node.city,
      colo: node.colo,
      continent: node.continent,
      lat: node.lat,
      lng: node.lng,
      nodeSvgX: pin.sx,
      nodeSvgY: pin.sy,
      labelX: bestX,
      labelY: bestY,
      labelSvgX,
      labelSvgY,
      requests: Math.max(1, Math.round(node.requests * domainScale)),
      isViewerOrigin: node.code === viewerGeo.countryCode,
      isThreat: node.status === 'threat' || liveThreatCodes.has(node.code),
      countryNode: node,
    };
  });
}

export function normalizeLiveColoTraffic(
  colos: CloudflareColoTraffic[]
): CloudflareColoTraffic[] {
  return colos.map((c) => {
    const resolved = resolveColoAndCountryGeo({
      coloCode: c.coloCode,
      country: c.country,
      city: c.city,
      lat: c.lat,
      lng: c.lng,
    });
    return {
      ...c,
      coloCode: resolved.coloCode,
      city: resolved.city,
      country: resolved.countryCode,
      lat: resolved.lat,
      lng: resolved.lng,
    };
  });
}
