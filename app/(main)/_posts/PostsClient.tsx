"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardPost, { TableItem, CurrentUser } from "./CardPost";
import PostFormModal from "./PostFormModal";

interface PostsClientProps {
  initialPosts: TableItem[];
  currentUser: CurrentUser | null;
  onRevalidate: () => Promise<void>;
}

export default function PostsClient({ initialPosts, currentUser, onRevalidate }: PostsClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<TableItem[]>(initialPosts);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);

  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | number | null>(null);

  // Synchronize internal state with incoming initialPosts prop updates
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Open modal in create mode
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open modal in edit mode with selected post data
  const handleOpenEdit = (item: TableItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Remove deleted post locally from state
  const handleDeleteItem = (id: string | number) => {
    setPosts((prev) => prev.filter((item) => item.id !== id));
  };

  // Safely close modal and refresh state to prevent browser pointer capture race conditions
  const handleFormSuccess = () => {
    requestAnimationFrame(() => {
      setIsModalOpen(false);
      setTimeout(async () => {
        await onRevalidate();
        router.refresh();
      }, 50);
    });
  };

  // Safely close modal without triggering revalidation
  const handleCloseModal = () => {
    requestAnimationFrame(() => {
      setIsModalOpen(false);
    });
  };

  // Filter posts based on user search input
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((item) =>
      item.text?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [posts, filter]);

  // Check if current user has administrative permissions
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="relative min-h-screen max-w-7xl mx-auto pt-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-3">
        <h1 className="text-2xl font-bold">المنشورات</h1>
      </div>

      {/* Floating Action Button strictly for admin users */}
      {isAdmin && (
        <button
          type="button"
          className="fixed bottom-8 right-6 z-30 btn btn-primary btn-circle text-2xl shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          onClick={handleOpenAdd}
          title="إضافة منشور جديد"
        >
          +
        </button>
      )}

      {/* Search Filter Input */}
      <div className="mb-6 flex items-center">
        <input
          type="text"
          placeholder="ابحث..."
          value={filter}
          className="input input-bordered w-full max-w-md mx-3"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Empty State View */}
      {filteredPosts.length === 0 && (
        <p className="text-center text-base-content/60 py-8">
          {filter ? "لا توجد نتائج تطابق بحثك." : "لا توجد منشورات لعرضها حالياً."}
        </p>
      )}

      {/* Posts List Grid */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((item) => (
            <CardPost
              key={item.id}
              item={item}
              currentUser={currentUser}
              onDelete={handleDeleteItem}
              onEdit={handleOpenEdit}
              isCommentsOpen={openCommentsPostId === item.id}
              onToggleComments={() =>
                setOpenCommentsPostId(openCommentsPostId === item.id ? null : item.id)
              }
            />
          ))}
        </div>
      )}

      {/* Post Modal Component */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingItem}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
