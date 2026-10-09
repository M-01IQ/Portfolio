import { revalidateTag, revalidatePath } from "next/cache";
import { getCachedPostsForUser, getPostsData } from "./fetchpost";
import { createServerClientInstance } from "@/config/createClientServer";
import PostsClient from "./PostsClient";

export default async function Posts() {
  const supabase = await createServerClientInstance();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "guest";

  const initialPosts = await getCachedPostsForUser(userId, () =>
    getPostsData(supabase, userId)
  );

  let currentUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, user_name, avatar_url")
      .eq("id", user.id)
      .single();

    currentUser = {
      id: user.id,
      role: profile?.role || "user",
      user_name: profile?.user_name,
      avatar_url: profile?.avatar_url,
    };
  }

  // Server Action with updated revalidateTag behavior
  async function handleRevalidate() {
    "use server";
    revalidateTag("posts", "max");
    revalidatePath("/posts");
  }

  return (
    <PostsClient
      initialPosts={initialPosts}
      currentUser={currentUser}
      onRevalidate={handleRevalidate}
    />
  );
}
