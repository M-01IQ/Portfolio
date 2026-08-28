"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/config/createClient";
import CardPost, { TableItem } from "./CardPost";
import CreatePost from "./CreatePost";

export default function Posts() {
  //state management 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posts, setPosts] = useState<TableItem[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const supabase = createClient();
  //fetch Posts 
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        setFetchError("تعذر جلب البيانات من الجدول.");
        setPosts([]);
      } else if (data) {
        setPosts(data);
        setFetchError(null);
      }
    };

    fetchPosts();
  }, []);
  //Add function 
  const handleAddItem = (newItem: TableItem) => {
    setPosts((prevData) => (prevData ? [newItem, ...prevData] : [newItem]));
    setIsFormOpen(false);
  };
  //Delete function 
  const handleDeleteItem = (id: string | number) => {
    setPosts((prevData) =>
      prevData ? prevData.filter((item) => item.id !== id) : []
    );
  };
  //Update function 
  const handleUpdateItem = (updatedItem: TableItem) => {
    setPosts((prevData) =>
      prevData
        ? prevData.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        : []
    );
  };

  return (
    <div className=" max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">العناصر</h1>
        
      {/*Add State Management Button   */}
        <button
          className={`btn ${isFormOpen ? "btn-error" : "btn-primary"} btn-circle text-xl shadow-md`}
          onClick={() => setIsFormOpen((prev) => !prev)}
          title={isFormOpen ? "إغلاق النموذج" : "إضافة عنصر جديد"}
        >
          {isFormOpen ? "✕" : "+"}
        </button>
      </div>
      
      {/*Post Addition Form   */}
      {isFormOpen && (
        <div className="mb-8">
          <CreatePost onAddSuccess={handleAddItem} />
        </div>
      )}
      {/*handle fetch Error  */}
      {fetchError && (
        <div className="alert alert-error mb-4">
          <span>{fetchError}</span>
        </div>
      )}
      {/*loading */}
      {!posts && !fetchError && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
      {/*No posts */}
      {posts && posts.length === 0 && (
        <p className="text-center text-base-content/60 py-8">لا توجد عناصر لعرضها حالياً.</p>
      )}
      {/* View posts   */}
      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((item) => (
            <CardPost
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
