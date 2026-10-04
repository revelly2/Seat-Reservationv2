import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserProfile } from '@/types/seat-reservation';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'sotero-abra-salt-2026', 1000, 64, 'sha512').toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, studentId, password } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and Full Name are required.' },
        { status: 400 }
      );
    }

    const userPassword = password || 'AbraStudent2026!';

    if (userPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user account already exists in Supabase user_profiles table
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'REGISTRATION DENIED: An account is already registered to this email address. Limit is strictly 1 account per user.' },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(userPassword);
    const newUserRecord = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      full_name: fullName.trim(),
      student_id: studentId ? studentId.trim() : `UA-${Math.floor(1000 + Math.random() * 9000)}`,
      password_hash,
      role: 'USER',
    };

    const { data: insertedUser, error } = await supabaseAdmin
      .from('user_profiles')
      .insert([newUserRecord])
      .select('id, email, full_name, student_id, role')
      .single();

    if (error || !insertedUser) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    const user: UserProfile = {
      id: insertedUser.id,
      email: insertedUser.email,
      fullName: insertedUser.full_name,
      studentId: insertedUser.student_id,
      role: (insertedUser.role as any) || 'USER',
    };

    return NextResponse.json({
      success: true,
      message: 'Account created successfully under University of Abra Arena user directory.',
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
