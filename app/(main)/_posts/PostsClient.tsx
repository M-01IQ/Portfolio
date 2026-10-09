"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardPost, { TableItem, CurrentUser } from "./CardPost";
import PostFormModal from "./PostFormModal";

interface PostsClientProps {
  initialPosts: TableItem[];
  currentUser: CurrentUser | null;
}

export default function PostsClient({ initialPosts, currentUser }: PostsClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<TableItem[]>(initialPosts);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);

  // Safely sync posts when initialPosts change from server
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TableItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string | number) => {
    setPosts((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((item) =>
      item.text?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [posts, filter]);

  return (
    <div className="relative min-h-screen max-w-7xl mx-auto pt-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-3">
        <h1 className="text-2xl font-bold">المنشورات</h1>
      </div>

      {/* Add button for Admin */}
      {currentUser?.role === "admin" && (
        <button
          type="button"
          className="fixed bottom-8 right-6 z-30 btn btn-primary btn-circle text-2xl shadow-xl opacity-75 hover:opacity-100 hover:scale-110 transition-all duration-300"
          onClick={handleOpenAdd}
          title="إضافة منشور جديد"
        >
          +
        </button>
      )}

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

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <p className="text-center text-base-content/60 py-8">
          {filter ? "لا توجد نتائج تطابق بحثك." : "لا توجد منشورات لعرضها حالياً."}
        </p>
      )}

      {/* Posts Grid */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((item) => (
            <CardPost
              key={item.id}
              item={item}
              currentUser={currentUser}
              onDelete={handleDeleteItem}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Add and Edit Modal */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
