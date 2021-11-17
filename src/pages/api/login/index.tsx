import { loginHandler } from '@storyofams/next-password-protect'

export default loginHandler(process.env.NEXT_PUBLIC_APP_PASSWORD, {
  cookieName: 'next-password-protect',
})
