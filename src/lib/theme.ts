// Light/dark theme. The choice is stored per browser in localStorage; without a
// choice we follow the OS setting. Colors live in globals.css.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "thehinhai.theme";

/**
 * Runs inline in <head> before the page is painted, so there is no flash of the
 * wrong theme. Keep it tiny and dependency-free — it is a string, not a module.
 */
export const themeInitScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t}catch(e){d.dataset.theme="dark"}})()`;

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies until reload.
  }
}
