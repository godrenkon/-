export function getTheme() {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('rpgedit_theme') || 'dark';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}

export function setTheme(theme) {
  localStorage.setItem('rpgedit_theme', theme);
  applyTheme(theme);
}