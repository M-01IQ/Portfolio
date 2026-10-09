import { getCachedPostsForUser, getPostsData } from "./fetchpost";
import { createServerClientInstance } from "@/config/createClientServer";
import PostsClient from "./PostsClient";

export default async function Posts() {
// Create server client 
  const supabase = await createServerClientInstance();

// Verify the user's login session 
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "guest";
  //Fetching posts using the server client 
  const initialPosts = await getCachedPostsForUser(userId, () =>
    getPostsData(supabase)
  );

  //Role of user
  let currentUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    currentUser = {
      id: user.id,
      role: profile?.role || "user",
    };
  }

  return <PostsClient initialPosts={initialPosts} currentUser={currentUser} />;
}
