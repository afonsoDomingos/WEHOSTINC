import { NextResponse } from 'next/server';

let maintenanceState = {
  active: false,
  message: 'Estamos a realizar uma manutenção programada nos nossos servidores para melhorar a velocidade e segurança.',
  estimatedReturn: 'Brevemente',
  updatedAt: new Date().toISOString()
};

export async function GET() {
  return NextResponse.json({
    success: true,
    maintenance: maintenanceState
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { active, message, estimatedReturn } = body;

    maintenanceState = {
      active: typeof active === 'boolean' ? active : maintenanceState.active,
      message: message || maintenanceState.message,
      estimatedReturn: estimatedReturn || maintenanceState.estimatedReturn,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      maintenance: maintenanceState
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
