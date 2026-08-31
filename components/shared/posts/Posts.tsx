"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/config/createClient";
import CardPost, { TableItem } from "./CardPost";
import CreatePost from "./CreatePost";
import Modal from "@/components/ui/PopUp/Modal";

export default function Posts() {
  // State management 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [posts, setPosts] = useState<TableItem[] | null>(null);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClient();

  // Fetch Posts 
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

  // Handlers
  const handleAddItem = (newItem: TableItem) => {
    // Update the list 
    setPosts((prevData) => (prevData ? [newItem, ...prevData] : [newItem]));
    setIsModalOpen(false);
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

  // Filter Logic
  const filteredPosts = posts?.filter((item) => {
    const searchTerm = filter.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchTerm) ||
      item.content?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">العناصر</h1>
        
        {/* isModalOpen button */}
        <button
          className="btn btn-primary btn-circle text-xl shadow-md"
          onClick={() => setIsModalOpen(true)}
          title="إضافة عنصر جديد"
        >
          +
        </button>
      </div>

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
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة منشور جديد"
      >
        <CreatePost onAddSuccess={handleAddItem} />
      </Modal>

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

      {/* Empty State / No Search Results */}
      {filteredPosts && filteredPosts.length === 0 && posts && (
        <p className="text-center text-base-content/60 py-8">
          {filter ? "لا توجد نتائج تطابق بحثك." : "لا توجد عناصر لعرضها حالياً."}
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
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
