"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/config/createClient";
import CardPost, { TableItem } from "./CardPost";
import PostFormModal from "./PostFormModal";

export default function Posts() {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posts, setPosts] = useState<TableItem[] | null>(null);
  const [filter, setFilter] = useState("");

  // Model control 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);

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

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TableItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleFormSuccess = (item: TableItem, isEdit: boolean) => {
    if (isEdit) {
      setPosts((prev) =>
        prev ? prev.map((p) => (p.id === item.id ? item : p)) : []
      );
    } else {
      setPosts((prev) => (prev ? [item, ...prev] : [item]));
    }
  };

  const handleDeleteItem = (id: string | number) => {
    setPosts((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
  };

  const filteredPosts = posts?.filter((item) =>
    item.title?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="relative min-h-screen max-w-7xl mx-auto pt-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">العناصر</h1>
      </div>

      {/* Add button  */}
      <button
        className="fixed bottom-8 right-6 z-30 btn btn-primary btn-circle text-2xl shadow-xl opacity-75 hover:opacity-100 hover:scale-110 transition-all duration-300"
        onClick={handleOpenAdd}
        title="إضافة عنصر جديد"
      >
        +
      </button>

      {/* Filter Input */}
      <div className="mb-6 flex items-center">
        <input 
          type="text"
          placeholder="ابحث..."
          value={filter}
          className="input input-bordered w-full max-w-md mx-3"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Error handling */}
      {fetchError && (
        <div className="alert alert-error mb-4">
          <span>{fetchError}</span>
        </div>
      )}

      {/* Loading State */}
      {!posts && !fetchError && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Empty State */}
      {filteredPosts && filteredPosts.length === 0 && posts && (
        <p className="text-center text-base-content/60 py-8">
          {filter ? "لا توجد نتائج تطابق بحثك." : "لا توجد عناصر لعرضها حالياً."}
        </p>
      )}

      {/* Render Posts Grid */}
      {filteredPosts && filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredPosts.map((item) => (
            <CardPost
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Add and edit modal  */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
