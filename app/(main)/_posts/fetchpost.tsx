import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fetch posts optimized and lightweight to prevent lag
export async function getPostsData(supabase: SupabaseClient, userId?: string, isAnonymous?: boolean) {
  //  Fetch only essential fields to reduce network and database load
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

  // Skip like queries entirely for guests or anonymous users for faster response
  if (!userId || userId === "guest" || isAnonymous) {
    return posts.map((post) => ({ ...post, user_has_liked: false }));
  }

  //  Batch fetch user likes for visible posts using an efficient In-Query
  const postIds = posts.map((p) => p.id);
  
  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);

  // Map like status to posts
  return posts.map((post) => ({
    ...post,
    user_has_liked: likedPostIds.has(post.id),
  }));
}

// Cached wrapper function using Next.js unstable_cache safely
export const getCachedPostsForUser = (userId: string, fetcher: () => Promise<any>) =>
  unstable_cache(
    async () => fetcher(),
    [`posts-list-${userId}`],
    { 
      revalidate: 60,
      tags: ["posts"] 
    }
  )();
