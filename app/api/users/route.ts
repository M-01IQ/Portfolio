import { NextResponse } from "next/server";
interface User {
  id: number;
  name: string;
  age: number;
  email:string;
  password:any;
  isAdmin: boolean;
}
let users:User[]=[
  {id :1,
  name :"ali",
  age :23,
  email:"ali@gmail.com",
  password:123,
  isAdmin:true,
  },
  {id :2,
  name :"mod",
  age :28,
  email:"mod@gmail.com",
  password:123,
  isAdmin:false,
  },
  {id :3,
  name :"hin",
  age :24,
  email:"hin@gmail.com",
  password:123,
  isAdmin:false,
  },
  ]
  
// GET
export async function GET() {
  return NextResponse.json(users, { status: 200 });
}
//POST
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ message: "تم الإضافة", data: body }, { status: 201 });
}