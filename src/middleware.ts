import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/leaderboard/:path*', '/measurements/:path*', '/users/:path*', '/admin/:path*'],
};
