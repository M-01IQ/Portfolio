import SectorBarTest from "@/components/ui/SectorBarTest";
import Posts from "@/components/shared/posts/Posts";
import EmbedManager from "@/components/shared/EmbedManager";

export default function Home() {
  return (
    <div className="bg-base-200 text-base-content min-h-screen scroll-smooth">
      
      <Posts />
      <EmbedManager></EmbedManager>
    </div>
  );
}
