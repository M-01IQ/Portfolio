"use client"
import React from 'react';
import {createClient} from "@/config/createClient"
import {useState} from 'react'

interface PostProps{
  
  post : object;
  id : string | number,
  title : string,
  text : string,
}
const supabase = createClient();

const Posts: React.FC<PostProps> = () => {
  //تعريف الحالات
  const [title,setTitle] = useState("")
  const [text,setText] = useState("")
  //دالة النشر
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !text ) {
      alert("يرجى ملء جميع الحقول بشكل صحيح.")
      return
    }
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, text}])
      .select()
      
    if (error) {
      console.error(error)
      console.log("حدث خطأ أثناء إضافة البيانات، يرجى المحاولة لاحقاً.")} 
    else if (data && data.length > 0) {
      console.log("تمت الإضافة بنجاح:", data[0])}
    
    setTitle("")
    setText("")
  }
  
  //دالة التعديل
  
  //دالة الحذف
  
  //دالة جلب المنشورات
  
  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-primary p-4">
      <form onSubmit={handlePost} name="post"className="flex flex-col gap-3">
        <input 
        type="text" 
        className="input input-bordered input-sm w-full"
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
          />
        <input 
        type="text" 
        className="input input-bordered input-sm w-full"
        value={text} 
        onChange={(e) => setText(e.target.value)} 
          />
        <div className="flex justify-end gap-2 mt-2">
          <button 
              type="submit" 
              className="btn btn-ghost btn-sm" >
              نشر
          </button>
          </div>
      </form>
    </div>
  );
};
export default Posts;