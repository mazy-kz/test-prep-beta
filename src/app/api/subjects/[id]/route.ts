import { NextResponse } from 'next/server'; import { prisma } from '@/server/db';
export async function PATCH(req: Request,{params}:{params:{id:string}}){ const {searchParams}=new URL(req.url); const name=searchParams.get('name'); if(!name) return NextResponse.json({error:'name required'},{status:400}); const s=await prisma.subject.update({where:{id:params.id},data:{name}}); return NextResponse.json(s); }
export async function DELETE(_: Request,{params}:{params:{id:string}}){ await prisma.subject.delete({where:{id:params.id}}); return NextResponse.json({ok:true}); }
