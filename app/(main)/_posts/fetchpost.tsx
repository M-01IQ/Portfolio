import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// Data fetch function 
export async function getPostsData(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return data;
}

// The cache function stores and retrieves data
export const getCachedPostsForUser = (userId: string, fetcher: () => Promise<any>) =>
  unstable_cache(
    async () => {
      return fetcher();
    },
    ["posts-list", userId],
    { revalidate: 60, tags: ["posts"] }
  )();
