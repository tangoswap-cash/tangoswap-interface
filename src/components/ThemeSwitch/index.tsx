import React, { useContext, useLayoutEffect, useState } from 'react'
import { Sun, Moon } from 'react-feather'
import cookie from 'cookie-cutter'

type Theme = 'light' | 'dark'

const themeContext = React.createContext<{
  theme: Theme
  setTheme(theme: Theme): void
}>({
  theme: 'dark',
  setTheme(theme: Theme) {},
})

export function ThemeProvider(props: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return cookie.get('Theme') || 'dark'
  })

  useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <themeContext.Provider
      value={{
        setTheme,
        theme,
      }}
    >
      {props.children}
    </themeContext.Provider>
  )
}

export const useTheme = () => {
  return useContext(themeContext)
}
