import { supabase } from "../../../lib/supabaseClient";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'File or user ID missing' }, { status: 400 });
    }

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(`${userId}/${file.name}`, file, { upsert: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Upload successful', data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
