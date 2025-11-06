import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

const nextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "password",
        },
      },
      async authorize(credentials, req) {
        console.log('[AUTH] Iniciando autorização');
        console.log('[AUTH] Email:', credentials?.email);
        console.log('[AUTH] Senha recebida (length):', credentials?.password?.length);

        await connectDB();
        console.log('[AUTH] Conectado ao MongoDB');

        let user = await User.findOne({ email: credentials.email })
          .select("+password")
          .lean();

        // Tentar popular DNBs apenas se existirem
        if (user && user.dnb) {
          try {
            user = await User.findOne({ email: credentials.email })
              .select("+password")
              .populate("dnb")
              .lean();
          } catch (err) {
            console.warn('[AUTH] Erro ao popular dnb, continuando sem populate:', err.message);
          }
        }

        if (user && user.dnbs && user.dnbs.length > 0) {
          try {
            user = await User.findOne({ email: credentials.email })
              .select("+password")
              .populate("dnb")
              .populate("dnbs")
              .lean();
          } catch (err) {
            console.warn('[AUTH] Erro ao popular dnbs, continuando sem populate:', err.message);
          }
        }

        console.log('[AUTH] Usuário encontrado:', !!user);
        if (user) {
          console.log('[AUTH] User ID:', user._id);
          console.log('[AUTH] User email:', user.email);
          console.log('[AUTH] User active:', user.active);
          console.log('[AUTH] Hash no banco (primeiros 20):', user.password?.substring(0, 20));
        }

        if (!user) {
          console.error('[AUTH] Usuário não encontrado');
          throw new Error("Email ou senha incorretos");
        }

        if (!user.active) {
          console.error('[AUTH] Usuário inativo');
          throw new Error("Usuário inativo");
        }

        console.log('[AUTH] Comparando senhas...');
        console.log('[AUTH] Senha fornecida:', credentials.password);
        console.log('[AUTH] Hash no banco:', user.password);

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('[AUTH] Senha válida:', isValid);

        if (!isValid) {
          console.error('[AUTH] Senha incorreta');
          throw new Error("Email ou senha incorretos");
        }

        console.log('[AUTH] Autenticação bem-sucedida!');

        // Retorna o objeto user, que estará disponível na sessão
        const userResponse = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };

        // Apenas adicionar DNBs se o usuário for técnico ou tiver DNBs atreladas
        if (user.role === 'tecnico') {
          // Verificar se dnb foi populado (tem propriedades além de _id)
          userResponse.dnb = user.dnb && typeof user.dnb === 'object' && user.dnb.name
            ? {
                id: user.dnb._id.toString(),
                name: user.dnb.name,
                code: user.dnb.code,
              }
            : null;

          // Verificar se dnbs foram populados
          userResponse.dnbs = user.dnbs && user.dnbs.length > 0
            ? user.dnbs
                .filter(dnb => typeof dnb === 'object' && dnb.name) // Apenas DNBs populados
                .map(dnb => ({
                  id: dnb._id.toString(),
                  name: dnb.name,
                  code: dnb.code,
                }))
            : (userResponse.dnb ? [userResponse.dnb] : []);
        } else {
          // Gestores e administradores não precisam de DNB
          userResponse.dnb = null;
          userResponse.dnbs = [];
        }

        return userResponse;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.dnb = user.dnb;
        token.dnbs = user.dnbs;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.dnb = token.dnb;
        session.user.dnbs = token.dnbs;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST, nextAuthOptions };
