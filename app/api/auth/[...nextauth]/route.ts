import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add dynamic config to prevent static export errors
export const dynamic = 'force-dynamic';