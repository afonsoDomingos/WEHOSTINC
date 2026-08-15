import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, status } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    if (!status || !['active', 'pending', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be active, pending, or suspended' }, { status: 400 });
    }

    await connectDB();

    const result = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { status },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User status updated to ${status}`,
      user: {
        email: result.email,
        name: result.name,
        status: result.status
      }
    });
  } catch (error) {
    console.error('[Fix User Status] Error:', error);
    return NextResponse.json({ error: 'Error updating user status' }, { status: 500 });
  }
}
