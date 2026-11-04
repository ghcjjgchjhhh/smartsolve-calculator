import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  voiceCode: string;
  direction?: 'ltr' | 'rtl';
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English (Global)', flag: '🇺🇸', voiceCode: 'en-US' },
  { code: 'en-ng', name: 'English (Nigeria)', nativeName: 'Nigerian English', flag: '🇳🇬', voiceCode: 'en-NG' },
  { code: 'en-gb', name: 'English (UK)', nativeName: 'British English', flag: '🇬🇧', voiceCode: 'en-GB' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', voiceCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', voiceCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', voiceCode: 'de-DE' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', voiceCode: 'ar-SA', direction: 'rtl' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', voiceCode: 'pt-BR' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', flag: '🇨🇳', voiceCode: 'zh-CN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', voiceCode: 'hi-IN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', voiceCode: 'ja-JP' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', voiceCode: 'sw-KE' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬', voiceCode: 'yo-NG' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', voiceCode: 'ig-NG' },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', flag: '🇳🇬', voiceCode: 'ha-NG' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', voiceCode: 'ru-RU' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // English (default)
  en: {
    calculator: 'Scientific Calculator',
    standard: 'Standard',
    scientific: 'Scientific',
    history: 'History',
    recent_history: 'Recent Calculations',
    view_all: 'View All',
    set_value: 'Set Value',
    ready: 'Ready',
    steps: 'View Steps',
    clear_history: 'Clear History',
    ai_chat: 'AI Chat',
    ai_solver: 'AI Solver',
    math_hub: 'Math Hub',
    physics_hub: 'Physics Hub',
    equations: 'Equations',
    converter: 'Converter',
    exam_prep: 'Exam Prep',
    smart_input: 'Smart Input',
    settings: 'Settings',
    language: 'App Language & Writing',
    theme: 'Appearance & Theme',
    voice: 'AI Voice',
    search: 'Quick Search',
    install: 'Install',
  },
  // Spanish
  es: {
    calculator: 'Calculadora Científica',
    standard: 'Estándar',
    scientific: 'Científica',
    history: 'Historial',
    recent_history: 'Cálculos Recientes',
    view_all: 'Ver Todo',
    set_value: 'Fijar Valor',
    ready: 'Listo',
    steps: 'Ver Pasos',
    clear_history: 'Borrar Historial',
    ai_chat: 'Chat con IA',
    ai_solver: 'Solucionador IA',
    math_hub: 'Matemáticas',
    physics_hub: 'Física',
    equations: 'Ecuaciones',
    converter: 'Conversor',
    exam_prep: 'Exámenes',
    smart_input: 'Entrada Inteligente',
    settings: 'Ajustes',
    language: 'Idioma de la App y Escritura',
    theme: 'Apariencia y Tema',
    voice: 'Voz de IA',
    search: 'Búsqueda Rápida',
    install: 'Instalar',
  },
  // French
  fr: {
    calculator: 'Calculatrice Scientifique',
    standard: 'Standard',
    scientific: 'Scientifique',
    history: 'Historique',
    recent_history: 'Calculs Récents',
    view_all: 'Voir Tout',
    set_value: 'Définir Valeur',
    ready: 'Prêt',
    steps: 'Voir les Étapes',
    clear_history: 'Effacer Historique',
    ai_chat: 'Discussion IA',
    ai_solver: 'Résolveur IA',
    math_hub: 'Mathématiques',
    physics_hub: 'Physique',
    equations: 'Équations',
    converter: 'Convertisseur',
    exam_prep: 'Examens',
    smart_input: 'Saisie Intelligente',
    settings: 'Paramètres',
    language: "Langue de l'App & Écriture",
    theme: 'Apparence & Thème',
    voice: 'Voix IA',
    search: 'Recherche Rapide',
    install: 'Installer',
  },
  // German
  de: {
    calculator: 'Wissenschaftlicher Rechner',
    standard: 'Standard',
    scientific: 'Wissenschaftlich',
    history: 'Verlauf',
    recent_history: 'Letzte Berechnungen',
    view_all: 'Alle Anzeigen',
    set_value: 'Wert Setzen',
    ready: 'Bereit',
    steps: 'Schritte Anzeigen',
    clear_history: 'Verlauf Löschen',
    ai_chat: 'KI-Chat',
    ai_solver: 'KI-Löser',
    math_hub: 'Mathematik',
    physics_hub: 'Physik',
    equations: 'Gleichungen',
    converter: 'Umrechner',
    exam_prep: 'Prüfungen',
    smart_input: 'Intelligente Eingabe',
    settings: 'Einstellungen',
    language: 'App-Sprache & Schrift',
    theme: 'Erscheinungsbild',
    voice: 'KI-Stimme',
    search: 'Schnellsuche',
    install: 'Installieren',
  },
  // Arabic
  ar: {
    calculator: 'آلة حاسبة علمية',
    standard: 'قياسي',
    scientific: 'علمي',
    history: 'السجل',
    recent_history: 'الحسابات الأخيرة',
    view_all: 'عرض الكل',
    set_value: 'تعيين القيمة',
    ready: 'جاهز',
    steps: 'عرض الخطوات',
    clear_history: 'مسح السجل',
    ai_chat: 'محادثة الذكاء الاصطناعي',
    ai_solver: 'محلل الذكاء الاصطناعي',
    math_hub: 'الرياضيات',
    physics_hub: 'الفيزياء',
    equations: 'المعادلات',
    converter: 'محول الوحدات',
    exam_prep: 'الامتحانات',
    smart_input: 'الإدخال الذكي',
    settings: 'الإعدادات',
    language: 'لغة التطبيق والكتابة',
    theme: 'المظهر والسمة',
    voice: 'صوت الذكاء الاصطناعي',
    search: 'بحث سريع',
    install: 'تثبيت',
  },
  // Portuguese
  pt: {
    calculator: 'Calculadora Científica',
    standard: 'Padrão',
    scientific: 'Científica',
    history: 'Histórico',
    recent_history: 'Cálculos Recentes',
    view_all: 'Ver Tudo',
    set_value: 'Definir Valor',
    ready: 'Pronto',
    steps: 'Ver Passos',
    clear_history: 'Limpar Histórico',
    ai_chat: 'Chat com IA',
    ai_solver: 'Resolvedor IA',
    math_hub: 'Matemática',
    physics_hub: 'Física',
    equations: 'Equações',
    converter: 'Conversor',
    exam_prep: 'Exames',
    smart_input: 'Entrada Inteligente',
    settings: 'Configurações',
    language: 'Idioma do App e Escrita',
    theme: 'Aparência e Tema',
    voice: 'Voz da IA',
    search: 'Busca Rápida',
    install: 'Instalar',
  },
  // Chinese
  zh: {
    calculator: '科学计算器',
    standard: '标准',
    scientific: '科学',
    history: '历史记录',
    recent_history: '近期计算',
    view_all: '查看全部',
    set_value: '设定数值',
    ready: '就绪',
    steps: '查看步骤',
    clear_history: '清空历史',
    ai_chat: 'AI 对话',
    ai_solver: 'AI 解题',
    math_hub: '数学中心',
    physics_hub: '物理中心',
    equations: '方程式',
    converter: '单位转换',
    exam_prep: '模拟考试',
    smart_input: '智能输入',
    settings: '设置',
    language: '应用语言与书写',
    theme: '外观与主题',
    voice: 'AI 语音',
    search: '快捷搜索',
    install: '安装应用',
  },
  // Yoruba
  yo: {
    calculator: 'Ẹrọ Ìṣirò Ìmọ̀ Ẹ̀kọ́',
    standard: 'Ìpìlẹ̀',
    scientific: 'Ìmọ̀ Ẹ̀kọ́',
    history: 'Ìtàn Ìṣirò',
    recent_history: 'Àwọn Ìṣirò Lọ́ọ́lọ́ọ́',
    view_all: 'Wo Gbogbo Rẹ̀',
    set_value: 'Fi Iye Sí I',
    ready: 'Ṣe Tán',
    steps: 'Wo Àwọn Ìgbésẹ̀',
    clear_history: 'Nu Ìtàn Rẹ́',
    ai_chat: 'Bá AI Sọ̀rọ̀',
    ai_solver: 'Olùtúbọ̀ AI',
    math_hub: 'Ìmọ̀ Ìṣirò',
    physics_hub: 'Físíìsì',
    equations: 'Àwọn Ìdọ́gba',
    converter: 'Olùyípadà',
    exam_prep: 'Ìmúra Ìdánwò',
    smart_input: 'Ìtẹ̀wọlé Ọlọ́gbọ́n',
    settings: 'Àwọn Ètò',
    language: 'Èdè Àti Ìkọ̀wé',
    theme: 'Ìrí àti Àwọ̀',
    voice: 'Ohùn AI',
    search: 'Wá Kíá',
    install: 'Fi Sori Ẹrọ',
  },
  // Igbo
  ig: {
    calculator: 'Mgbakọ Sayensị',
    standard: 'Ọkọlọtọ',
    scientific: 'Sayensị',
    history: 'Akụkọ Mgbakọ',
    recent_history: 'Mgbakọ Ndị Dị Nso',
    view_all: 'Lee Ha Niile',
    set_value: 'Tọọ Uru',
    ready: 'Dị Njikere',
    steps: 'Lee Nzọụkwụ',
    clear_history: 'Hichapụ Akụkọ',
    ai_chat: 'Mkparịta ụka AI',
    ai_solver: 'Onye Ndozi AI',
    math_hub: 'Mgbakọ',
    physics_hub: 'Fisiks',
    equations: 'Nhata',
    converter: 'Ntụgharị',
    exam_prep: 'Nkwadebe Ule',
    smart_input: 'Ntinye Smart',
    settings: 'Ntọala',
    language: 'Asụsụ ngwa na ide',
    theme: 'Ọdịdị na isiokwu',
    voice: 'Olu AI',
    search: 'Chọọ Ngwa Ngwa',
    install: 'Wụnye',
  },
  // Hausa
  ha: {
    calculator: 'Kwamfutar Lissafi',
    standard: 'Na Yau da Kullum',
    scientific: 'Na Kimiyya',
    history: 'Tarihin Lissafi',
    recent_history: 'Lissafin Kwanan Nan',
    view_all: 'Duba Duka',
    set_value: 'Saita Ƙima',
    ready: 'A Shirye',
    steps: 'Duba Matakai',
    clear_history: 'Share Tarihi',
    ai_chat: 'Tattaunawar AI',
    ai_solver: 'Mai Magance AI',
    math_hub: 'Lissafi',
    physics_hub: 'Fiziks',
    equations: 'Daidaito',
    converter: 'Mai Canza Ma’auni',
    exam_prep: 'Shirin Jarrabawa',
    smart_input: 'Shigarwa Mai Hankali',
    settings: 'Saituna',
    language: 'Harshen Manhaja da Rubutu',
    theme: 'Fasali da Launi',
    voice: 'Muryar AI',
    search: 'Bincike Mai Sauri',
    install: 'Sanya Manhaja',
  },
};

interface LanguageContextType {
  currentLanguage: AppLanguage;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  isLanguageModalOpen: boolean;
  setIsLanguageModalOpen: (open: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: APP_LANGUAGES[0],
  setLanguage: () => {},
  t: (_k, fb) => fb || '',
  isLanguageModalOpen: false,
  setIsLanguageModalOpen: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCode, setCurrentCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('smartsolve_app_language');
      if (saved && APP_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      // Check browser language
      const navLang = (navigator.language || 'en').toLowerCase();
      const match = APP_LANGUAGES.find((l) => l.code === navLang || navLang.startsWith(l.code));
      if (match) return match.code;
    } catch {}
    return 'en';
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const setLanguage = (code: string) => {
    setCurrentCode(code);
    try {
      localStorage.setItem('smartsolve_app_language', code);
      window.dispatchEvent(new CustomEvent('smartsolve_language_changed', { detail: { code } }));
    } catch {}
  };

  const currentLanguage =
    APP_LANGUAGES.find((l) => l.code === currentCode) || APP_LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[currentCode] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || fallback || key;
  };

  useEffect(() => {
    if (currentLanguage.direction === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        isLanguageModalOpen,
        setIsLanguageModalOpen,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useAppLanguage = () => useContext(LanguageContext);
