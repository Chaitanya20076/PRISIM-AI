
import Hero from "./sections/Hero/Hero";
import HomeIntroduction from "./sections/HomeIntroduction/HomeIntroduction";
import FeaturedProjects from "./sections/FeaturedProjects/FeaturedProjects";
import CommunityCTA from "./sections/CommunityCTA/CommunityCTA";
import Announcements from "./sections/Announcements/Announcements";
function Home() {
  return (
    <>
      <Hero />
      <HomeIntroduction />
      <Announcements/>
      <FeaturedProjects />
      <CommunityCTA />
      
    </>
  );
}

export default Home;
