import { FoodReference } from '@/types';

// Normalize food name for consistent matching (used for calculations)
export function normalizeFoodName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Capitalize for display (English only)
export function displayFoodName(name: string): string {
  const normalized = normalizeFoodName(name);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Format food name as "English (Urdu)" for display
export function formatBilingualName(englishName: string, urduName?: string | null): string {
  if (!urduName) return englishName;
  return `${englishName} (${urduName})`;
}

// Get formatted display name from a FoodReference object
export function getFoodDisplayName(food: FoodReference): string {
  return formatBilingualName(food.name, food.urdu_name);
}

// Get formatted display name for any food (with optional urdu lookup)
export function getDisplayNameWithUrdu(
  foodName: string, 
  foodList: FoodReference[]
): string {
  const normalized = normalizeFoodName(foodName);
  const match = foodList.find(f => normalizeFoodName(f.name) === normalized);
  if (match?.urdu_name) {
    return formatBilingualName(displayFoodName(foodName), match.urdu_name);
  }
  return displayFoodName(foodName);
}

// Roman Urdu to English mappings for search
const romanUrduMappings: Record<string, string[]> = {
  // Grains & Bread
  'chawal': ['rice', 'چاول'],
  'roti': ['roti', 'روٹی'],
  'chapati': ['roti', 'روٹی'],
  'naan': ['naan', 'نان'],
  'jo': ['barley', 'جو'],
  'jai': ['oats', 'جئی'],
  'paratha': ['paratha', 'پراٹھا'],
  'kulcha': ['kulcha', 'کلچہ'],
  'sheermal': ['sheermal', 'شیرمال'],
  'puri': ['puri', 'پوری'],
  'bhatura': ['bhatura', 'بھٹورہ'],
  'tandoori': ['tandoori roti', 'تندوری روٹی'],
  'laccha': ['laccha paratha', 'لچھا پراٹھا'],
  'makki': ['makki ki roti', 'مکئی کی روٹی'],
  'missi': ['missi roti', 'مسی روٹی'],
  'bakarkhani': ['bakarkhani', 'باقرخانی'],
  
  // Dairy
  'doodh': ['milk', 'دودھ'],
  'dahi': ['yogurt', 'دہی'],
  'paneer': ['cheese', 'پنیر'],
  'makhan': ['butter', 'مکھن'],
  'lassi': ['lassi', 'لسی'],
  
  // Rice dishes
  'biryani': ['biryani', 'بریانی'],
  'pulao': ['pulao', 'پلاؤ'],
  'zarda': ['zarda', 'زردہ'],
  'tahiri': ['tahiri', 'تہری'],
  'yakhni': ['yakhni pulao', 'یخنی پلاؤ'],
  'kabuli': ['kabuli pulao', 'کابلی پلاؤ'],
  'khichdi': ['khichdi', 'کھچڑی'],
  
  // Vegetables
  'gobi': ['cauliflower', 'گوبھی'],
  'gobhi': ['cauliflower', 'گوبھی'],
  'phool gobi': ['cauliflower', 'گوبھی'],
  'band gobi': ['cabbage', 'بند گوبھی'],
  'aloo': ['potato', 'آلو'],
  'alu': ['potato', 'آلو'],
  'pyaz': ['onion', 'پیاز'],
  'piyaz': ['onion', 'پیاز'],
  'pyaaz': ['onion', 'پیاز'],
  'tamatar': ['tomato', 'ٹماٹر'],
  'palak': ['spinach', 'پالک'],
  'gajar': ['carrot', 'گاجر'],
  'kheera': ['cucumber', 'کھیرا'],
  'matar': ['peas', 'مٹر'],
  'baingan': ['eggplant', 'بینگن'],
  'bengan': ['eggplant', 'بینگن'],
  'lehsun': ['garlic', 'لہسن'],
  'adrak': ['ginger', 'ادرک'],
  'kaddu': ['pumpkin', 'کدو'],
  'bhindi': ['okra', 'بھنڈی'],
  'tori': ['tori ki sabzi', 'توری'],
  'shakarkandi': ['sweet potato', 'شکرقندی'],
  'karela': ['karela sabzi', 'کریلا'],
  'lauki': ['lauki', 'لوکی'],
  'tinda': ['tinda', 'ٹنڈے'],
  'arvi': ['arvi', 'اروی'],
  'mooli': ['mooli ki sabzi', 'مولی'],
  'shimla': ['shimla mirch', 'شملہ مرچ'],
  'methi': ['methi aloo', 'میتھی'],
  'saag': ['saag', 'ساگ'],
  'kachnar': ['kachnar', 'کچنار'],
  'kathal': ['kathal', 'کٹھل'],
  
  // Legumes
  'daal': ['lentils', 'دال'],
  'dal': ['lentils', 'دال'],
  'chanay': ['chickpeas', 'چنے'],
  'chane': ['chickpeas', 'چنے'],
  'channay': ['channay', 'چنے'],
  'chole': ['chole', 'چھولے'],
  'cholay': ['chole', 'چھولے'],
  'rajma': ['rajma', 'راجما'],
  'lobiya': ['lobiya', 'لوبیا'],
  'masoor': ['daal masoor', 'مسور'],
  'moong': ['daal moong', 'مونگ'],
  'mash': ['daal mash', 'ماش'],
  'tarka': ['daal tarka', 'تڑکا'],
  
  // Fruits
  'kela': ['banana', 'کیلا'],
  'seb': ['apple', 'سیب'],
  'aam': ['mango', 'آم'],
  'angoor': ['grapes', 'انگور'],
  'santra': ['orange', 'سنگترہ'],
  'tarbooz': ['watermelon', 'تربوز'],
  'kharbuza': ['melon', 'خربوزہ'],
  'papita': ['papaya', 'پپیتا'],
  'amrood': ['guava', 'امرود'],
  'nashpati': ['pear', 'ناشپاتی'],
  'anaar': ['pomegranate', 'انار'],
  'jamun': ['black plum', 'جامن'],
  'falsa': ['falsa sharbat', 'فالسہ'],
  
  // Meat dishes
  'murgh': ['chicken', 'چکن'],
  'chicken': ['chicken', 'چکن'],
  'anda': ['egg', 'انڈا'],
  'machli': ['fish', 'مچھلی'],
  'gosht': ['beef', 'گوشت'],
  'mutton': ['mutton', 'گوشت'],
  'karahi': ['chicken karahi', 'کڑاہی'],
  'korma': ['korma', 'قورمہ'],
  'qorma': ['korma', 'قورمہ'],
  'nihari': ['nihari', 'نہاری'],
  'haleem': ['haleem', 'حلیم'],
  'qeema': ['qeema', 'قیمہ'],
  'keema': ['qeema', 'قیمہ'],
  'handi': ['chicken handi', 'ہانڈی'],
  'seekh': ['seekh kebab', 'سیخ کباب'],
  'chapli': ['chapli kebab', 'چپلی کباب'],
  'shami': ['shami kebab', 'شامی کباب'],
  'kebab': ['seekh kebab', 'کباب'],
  'kabab': ['seekh kebab', 'کباب'],
  'kofta': ['kofta curry', 'کوفتہ'],
  'tikka': ['chicken tikka', 'ٹکہ'],
  'reshmi': ['reshmi kebab', 'ریشمی کباب'],
  'pasanda': ['pasanda', 'پسندہ'],
  'bhuna': ['bhuna gosht', 'بھنا گوشت'],
  'paya': ['paya', 'پائے'],
  'kata kat': ['kata kat', 'کٹا کٹ'],
  'maghaz': ['brain masala', 'مغز'],
  'salan': ['korma', 'سالن'],
  
  // Snacks
  'samosa': ['samosa', 'سموسہ'],
  'pakora': ['pakora', 'پکوڑے'],
  'pakoray': ['pakora', 'پکوڑے'],
  'chaat': ['chaat', 'چاٹ'],
  'bhalla': ['dahi bhalla', 'بھلے'],
  'gol gappay': ['gol gappay', 'گول گپے'],
  'pani puri': ['gol gappay', 'گول گپے'],
  'tikki': ['aloo tikki', 'ٹکی'],
  'kachori': ['kachori', 'کچوری'],
  'namak paray': ['namak paray', 'نمک پارے'],
  'mathri': ['mathri', 'مٹھری'],
  'papri': ['papri chaat', 'پاپڑی'],
  'bun kebab': ['bun kebab', 'بن کباب'],
  'roll': ['roll paratha', 'رول'],
  
  // Beverages
  'chai': ['chai', 'چائے'],
  'coffee': ['coffee', 'کافی'],
  'doodh patti': ['doodh patti', 'دودھ پتی'],
  'rooh afza': ['rooh afza', 'روح افزا'],
  'shikanjvi': ['shikanjvi', 'شکنجوی'],
  'shikanjabeen': ['shikanjvi', 'شکنجوی'],
  'jaljeera': ['jaljeera', 'جلجیرا'],
  'sattu': ['sattu', 'ستو'],
  'kashmiri chai': ['kashmiri chai', 'کشمیری چائے'],
  'pink chai': ['kashmiri chai', 'کشمیری چائے'],
  'kehwa': ['kehwa', 'قہوہ'],
  'kahwa': ['kehwa', 'قہوہ'],
  'nimbu pani': ['nimbu pani', 'نمبو پانی'],
  
  // Desserts
  'kheer': ['kheer', 'کھیر'],
  'gulab jamun': ['gulab jamun', 'گلاب جامن'],
  'jalebi': ['jalebi', 'جلیبی'],
  'barfi': ['barfi', 'برفی'],
  'mithai': ['barfi', 'مٹھائی'],
  'rasmalai': ['rasmalai', 'رس ملائی'],
  'halwa': ['suji halwa', 'حلوہ'],
  'gajar halwa': ['gajar halwa', 'گاجر حلوہ'],
  'suji halwa': ['suji halwa', 'سوجی حلوہ'],
  'sheer khurma': ['sheer khurma', 'شیر خرما'],
  'sewaiyan': ['sheer khurma', 'سویاں'],
  'falooda': ['falooda', 'فالودہ'],
  'kulfi': ['kulfi', 'کلفی'],
  'ras gulla': ['ras gulla', 'رس گلہ'],
  'rasgulla': ['ras gulla', 'رس گلہ'],
  'phirni': ['phirni', 'فرنی'],
  'sohan halwa': ['sohan halwa', 'سوہن حلوہ'],
  'shahi tukray': ['shahi tukray', 'شاہی ٹکڑے'],
  'gajrela': ['gajrela', 'گجریلا'],
};

// Search foods by English, Urdu script, or Roman Urdu
export function searchFoods(query: string, foods: FoodReference[]): FoodReference[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = normalizeFoodName(query);
  
  // Check for Roman Urdu mapping first
  const romanMatch = romanUrduMappings[normalizedQuery];
  
  return foods.filter(food => {
    const normalizedName = normalizeFoodName(food.name);
    const normalizedUrdu = food.urdu_name || '';
    
    // Direct English match
    if (normalizedName.includes(normalizedQuery)) return true;
    
    // Direct Urdu script match
    if (normalizedUrdu.includes(query)) return true;
    
    // Roman Urdu mapping match
    if (romanMatch) {
      const [englishEquivalent] = romanMatch;
      if (normalizedName.includes(englishEquivalent.toLowerCase())) return true;
    }
    
    return false;
  });
}

// Calculate symptom score from a symptom log
export function calculateSymptomScore(
  bloating: number, 
  pain: number, 
  stoolIssue: boolean
): number {
  return (bloating + pain) / 2 + (stoolIssue ? 2 : 0);
}
