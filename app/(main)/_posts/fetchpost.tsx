import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostsData(supabase: SupabaseClient, userId?: string, isAnonymous?: boolean) {
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      created_at,
      text,
      media_url,
      likes_count,
      user_id,
      profiles (
        id,
        user_name,
        avatar_url,
        role
      )
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  if (!posts || posts.length === 0) return [];

  if (!userId || userId === "guest" || isAnonymous) {
    return posts.map((post) => ({ ...post, user_has_liked: false }));
  }

  const postIds = posts.map((p) => p.id);
  
  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);

  return posts.map((post) => ({
    ...post,
    user_has_liked: likedPostIds.has(post.id),
  }));
}

// استخدام اسم جديد كلياً لتجاوز الذاكرة المؤقتة القديمة في فيرسل
export const fetchAndCachePosts = (userId: string, fetcher: () => Promise<any>) =>
  unstable_cache(
    fetcher,
    ["posts-cache-v2", userId],
    { 
      revalidate: 60, 
      tags: ["posts"] 
    }
  )();
