import { passwordCheckHandler } from '@storyofams/next-password-protect'

export default passwordCheckHandler(process.env.NEXT_PUBLIC_APP_PASSWORD, {
  cookieName: 'next-password-protect',
})
