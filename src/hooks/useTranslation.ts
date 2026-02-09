import { useState, useEffect } from 'react';
import { tokens as en } from '@/lib/i18n/en';
import { tokens as ko } from '@/lib/i18n/ko';

export const useTranslation = () => {
    const [language, setLanguage] = useState<'en' | 'ko'>('en');

    useEffect(() => {
        // Browser Preference Auto-detection 🕵️‍♂️
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
        if (browserLang.toLowerCase().includes('ko')) {
            setLanguage('ko');
        } else {
            setLanguage('en');
        }
    }, []);

    return {
        // 현재 언어에 맞는 토큰 반환
        t: language === 'ko' ? ko : en,
        lang: language,
        // 수동 언어 변경 기능도 대비
        setLanguage
    };
};
