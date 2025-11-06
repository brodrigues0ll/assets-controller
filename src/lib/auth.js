import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import User from './models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('[AUTH] Credenciais incompletas');
            return null;
          }

          await connectDB();

          const user = await User.findOne({ email: credentials.email })
            .select('+password')
            .populate('dnb');

          if (!user) {
            console.error('[AUTH] Usuário não encontrado:', credentials.email);
            return null;
          }

          if (!user.active) {
            console.error('[AUTH] Usuário inativo:', credentials.email);
            return null;
          }

          console.log('[AUTH] Verificando senha para:', credentials.email);
          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            console.error('[AUTH] Senha inválida para:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login bem-sucedido:', credentials.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            dnb: user.dnb ? {
              id: user.dnb._id.toString(),
              name: user.dnb.name,
              code: user.dnb.code
            } : null
          };
        } catch (error) {
          console.error('[AUTH] Erro no authorize:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.dnb = user.dnb;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.dnb = token.dnb;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};
