import { revalidatePath } from "next/cache";
import { getPostsData } from "./fetchpost";
import { createServerClientInstance } from "@/config/createClientServer";
import PostsClient from "./PostsClient";

export interface CurrentUser {
  id: string;
  role?: string;
  user_name?: string;
  avatar_url?: string;
  is_anonymous?: boolean;
}

export default async function Posts() {
  const supabase = await createServerClientInstance();

  // Get authenticated user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "guest";
  
  // Fetch user profile data if authenticated
  let currentUser: CurrentUser | null = null;
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
      is_anonymous: user.is_anonymous || false,
    };
  }

  // Direct fetch without complex cache wrappers to eliminate TypeScript build errors permanently
  const initialPosts = await getPostsData(supabase, userId, currentUser?.is_anonymous);

  // Revalidate path on server actions
  async function handleRevalidate() {
    "use server";
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
