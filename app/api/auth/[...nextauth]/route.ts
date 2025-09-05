

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export const runtime = 'nodejs'; // Edge runtime cannot open TCP sockets (Prisma won't work)

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
