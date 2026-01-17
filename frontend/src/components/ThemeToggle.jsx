import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export default function ThemeToggle({ variant = "ghost", size = "icon", className = "" }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`relative overflow-hidden ${className}`}
      data-testid="theme-toggle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className={`h-5 w-5 transition-all duration-300 ${
        theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
      }`} />
      <Moon className={`absolute h-5 w-5 transition-all duration-300 ${
        theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
      }`} />
    </Button>
  );
}
