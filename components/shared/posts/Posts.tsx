"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/config/createClient";
import CardPost, { TableItem } from "./CardPost";
import CreatePost from "./CreatePost";

export default function Posts() {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posts, setPosts] = useState<TableItem[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const supabase = createClient();

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

  const handleAddItem = (newItem: TableItem) => {
    setPosts((prevData) => (prevData ? [newItem, ...prevData] : [newItem]));
    setIsFormOpen(false);
  };

  const handleDeleteItem = (id: string | number) => {
    setPosts((prevData) =>
      prevData ? prevData.filter((item) => item.id !== id) : []
    );
  };

  const handleUpdateItem = (updatedItem: TableItem) => {
    setPosts((prevData) =>
      prevData
        ? prevData.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        : []
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">العناصر</h1>
        <button
          className={`btn ${isFormOpen ? "btn-error" : "btn-primary"} btn-circle text-xl shadow-md`}
          onClick={() => setIsFormOpen((prev) => !prev)}
          title={isFormOpen ? "إغلاق النموذج" : "إضافة عنصر جديد"}
        >
          {isFormOpen ? "✕" : "+"}
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <CreatePost onAddSuccess={handleAddItem} />
        </div>
      )}

      {fetchError && (
        <div className="alert alert-error mb-4">
          <span>{fetchError}</span>
        </div>
      )}

      {!posts && !fetchError && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {posts && posts.length === 0 && (
        <p className="text-center text-base-content/60 py-8">لا توجد عناصر لعرضها حالياً.</p>
      )}

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
