import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Ye file NextAuth API route setup karti hai.
const handler = NextAuth({
  providers: [
    // Google login provider: credentials .env se aate hain.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    // Default NextAuth sign-in page ki jagah custom login page use karo.
    signIn: "/login",
  },
});

// Same handler GET aur POST dono auth requests handle karega.
export { handler as GET, handler as POST };
