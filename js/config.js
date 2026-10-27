export const FUNCTION_URL = 'https://akqounxjxmyizotbhsow.supabase.co/functions/v1/verify-telegram';

// سرعت پایه (پایین و واقعی)
export const BASE_HASHRATE = 0.0001; 
export const LEVEL_RATE_MULTIPLIER = 1.05; 
export const MAX_LEVEL = 100;

// سقف روزانه (لول 1 = 10 MCH)
export const dailyCapForLevel = (level) => {
  const lv = Math.max(1, Math.floor(level));
  return Math.floor(10 + (lv - 1) * 5 + Math.pow(lv, 1.2));
};

// هزینه ارتقا
export const upgradeCostForLevel = (level) => {
  const lv = Math.max(1, Math.floor(level));
  return Math.floor(50 * Math.pow(lv, 2.2));
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