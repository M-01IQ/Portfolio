import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fetch posts
export async function getPostsData(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      created_at,
      text,
      media_url,
      user_id,
      profiles (
        id,
        user_name,
        avatar_url,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return data;
}

// Cache handler function
export const getCachedPostsForUser = (userId: string, fetcher: () => Promise<any>) =>
  unstable_cache(
    async () => fetcher(),
    ["posts-list", userId],
    { revalidate: false, tags: ["posts"] }
  )();
