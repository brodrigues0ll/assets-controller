import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    await connectDB();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se já existe algum usuário no sistema
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'O sistema já foi configurado' },
        { status: 400 }
      );
    }

    // Verificar se email já existe (segurança adicional)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Criar primeiro usuário como administrador
    // A senha será automaticamente hasheada pelo middleware pre('save') do modelo
    const newUser = new User({
      name,
      email,
      password,
      role: 'administrador',
      active: true,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: 'Administrador criado com sucesso',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar administrador: ' + error.message },
      { status: 500 }
    );
  }
}

// GET para verificar se o setup já foi feito
export async function GET() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();

    return NextResponse.json({
      needsSetup: userCount === 0,
      userCount,
    });
  } catch (error) {
    console.error('Erro ao verificar setup:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status do sistema' },
      { status: 500 }
    );
  }
}
