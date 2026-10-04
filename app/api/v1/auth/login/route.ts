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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and Password are required for authentication.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetHash = hashPassword(password);

    // Retrieve user profile from Supabase user_profiles
    const { data: userProfile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !userProfile) {
      return NextResponse.json(
        { error: 'AUTHENTICATION FAILED: Account not found for this email. Please register a new account.' },
        { status: 401 }
      );
    }

    if (userProfile.password_hash !== targetHash) {
      return NextResponse.json(
        { error: 'AUTHENTICATION FAILED: Incorrect password provided.' },
        { status: 401 }
      );
    }

    const user: UserProfile = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name,
      studentId: userProfile.student_id,
      role: (userProfile.role as any) || 'USER',
    };

    return NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
