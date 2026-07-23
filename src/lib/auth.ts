import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logAdminAction } from "@/lib/admin/audit-log";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (
          email &&
          password &&
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          try {
            await logAdminAction({
              action: "login_success",
              entityType: "auth",
              actorEmail: email,
            });
          } catch {
            // Audit must not block authentication.
          }
          return { id: "admin", email, name: "Admin" };
        }

        if (email) {
          try {
            await logAdminAction({
              action: "login_failed",
              entityType: "auth",
              actorEmail: email,
              details: { reason: "invalid_credentials" },
            });
          } catch {
            // Audit must not block authentication flow.
          }
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
});
