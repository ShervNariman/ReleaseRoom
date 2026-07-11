import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({status:"ok",service:"release-room",time:new Date().toISOString()});}
