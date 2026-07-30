export const defaultLang = 'en' as const;
export const languages = ['en'] as const;
export type Language = (typeof languages)[number];
