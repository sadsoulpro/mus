import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Language chip component - 20x20px with 4px border radius
const LanguageChip = ({ code, isActive, onClick, showCheck = false }) => (
  <button
    onClick={onClick}
    className={`
      w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold uppercase transition-all
      ${isActive 
        ? 'bg-primary text-white' 
        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      }
    `}
    style={{ minWidth: '20px', minHeight: '20px', borderRadius: '4px' }}
  >
    {showCheck && isActive ? <Check className="w-3 h-3" /> : code}
  </button>
);

const LanguageSwitcher = ({ variant = 'default', className = '', dropDirection = 'auto' }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currentLang = languages[language] || languages.en;

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  // Compact variant for sidebar
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4" />
          <LanguageChip code={language} isActive={true} onClick={(e) => e.stopPropagation()} />
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 bottom-full mb-2 py-2 px-2 bg-card border border-border rounded-lg shadow-xl z-[100]"
            >
              <div className="flex flex-col gap-1">{/* Changed to vertical layout */}
                {Object.values(languages).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                      ${language === lang.code
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <span 
                      className={`
                        w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold uppercase flex-shrink-0
                        ${language === lang.code ? 'bg-primary text-white' : 'bg-muted'}
                      `}
                      style={{ borderRadius: '4px' }}
                    >
                      {lang.code}
                    </span>
                    <span>{lang.nativeName}</span>
                    {language === lang.code && (
                      <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant (horizontal chips)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Object.values(languages).map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold uppercase transition-all
              ${language === lang.code 
                ? 'bg-primary text-white' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }
            `}
            style={{ borderRadius: '4px' }}
          >
            {lang.code}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span 
          className="w-5 h-5 flex items-center justify-center rounded bg-primary text-white text-[10px] font-bold uppercase"
          style={{ borderRadius: '4px' }}
        >
          {language}
        </span>
        <span className="text-sm font-medium">{currentLang.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 py-2 px-2 bg-card border border-border rounded-xl shadow-xl z-50 min-w-[160px]"
          >
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-1 last:mb-0
                  ${language === lang.code
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <span 
                  className={`
                    w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold uppercase
                    ${language === lang.code ? 'bg-primary text-white' : 'bg-muted'}
                  `}
                  style={{ borderRadius: '4px' }}
                >
                  {lang.code}
                </span>
                <span className="font-medium">{lang.nativeName}</span>
                {language === lang.code && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
