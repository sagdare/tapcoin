export const FUNCTION_URL = 'https://akqounxjxmyizotbhsow.supabase.co/functions/v1/verify-telegram';

// تنظیمات پایه ماینر
export const BASE_HASHRATE = 0.0001; 
export const LEVEL_RATE_MULTIPLIER = 1.04; // ضریب ملایم برای اینکه به لول ۴۶ برسه
export const MAX_LEVEL = 100;

// سقف روزانه (واحد MRG) بر اساس لول
export const dailyCapForLevel = (level) => {
  const lv = Math.max(1, Math.floor(level));
  // فرمول تقریبی برای رسیدن به عدد ۴۶ در لول ۴۶
  return Math.floor(8 + (lv - 1) * 0.8 + Math.pow(lv, 1.1));
};

// هزینه ارتقا
export const upgradeCostForLevel = (level) => {
  const lv = Math.max(1, Math.floor(level));
  return Math.floor(500 * Math.pow(lv, 2.4));
};

export const MINER_INFO = {
  basic:    { name: 'ماینر پایه',     rate: 0.0001, price: 100  },
  advanced: { name: 'ماینر پیشرفته', rate: 0.0005, price: 500  },
  pro:      { name: 'ماینر حرفه‌ای', rate: 0.0020, price: 2000 },
};

export const TASK_INFO = {
  join_channel: { title: 'عضویت در کانال', reward: 500 },
  invite_3:     { title: 'دعوت ۳ دوست',     reward: 1000 },
  daily_login:  { title: 'ورود روزانه',     reward: 100 },
};