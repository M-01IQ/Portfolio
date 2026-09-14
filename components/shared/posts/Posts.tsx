"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/config/createClient";
import CardPost, { TableItem } from "./CardPost";
import PostFormModal from "./PostFormModal";
import Loading from "@/components/ui/Loading/Loading";

export default function Posts() {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posts, setPosts] = useState<TableItem[] | null>(null);
  const [filter, setFilter] = useState("");

  // Modal control 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);

  const supabase = createClient();

  // دالة جلب المنشورات مع بيانات المستخدم (profiles) وبضمنها avatar_url
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(user_name, email, avatar_url)")
      .order("id", { ascending: false });

    if (error) {
      console.error("خطأ جلب البيانات:", error.message);
      setFetchError("تعذر جلب البيانات من الجدول.");
      setPosts([]);
    } else if (data) {
      setPosts(data as unknown as TableItem[]);
      setFetchError(null);
    }
  };

  useEffect(() => {
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

  // إعادة جلب المنشورات عند الإضافة أو التعديل لضمان استدعاء كائن profiles فوراً
  const handleFormSuccess = async (_item: TableItem, _isEdit: boolean) => {
    await fetchPosts();
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
        <h1 className="text-2xl font-bold">المنشورات</h1>
      </div>

      {/* Add button */}
      <button
        className="fixed bottom-8 right-6 z-30 btn btn-primary btn-circle text-2xl shadow-xl opacity-75 hover:opacity-100 hover:scale-110 transition-all duration-300"
        onClick={handleOpenAdd}
        title="إضافة منشور جديد"
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
        <Loading />
      )}

      {/* Empty State */}
      {filteredPosts && filteredPosts.length === 0 && posts && (
        <p className="text-center text-base-content/60 py-8">
          {filter ? "لا توجد نتائج تطابق بحثك." : "لا توجد منشورات لعرضها حالياً."}
        </p>
      )}

      {/* Render Posts Grid */}
      {filteredPosts && filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Add and edit modal */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
