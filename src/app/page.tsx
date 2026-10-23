import Loader from "@/components/chrome/Loader";
import Nav from "@/components/chrome/Nav";
import Cursor from "@/components/chrome/Cursor";
import Hero from "@/components/hero/Hero";
import Story from "@/components/story/Story";
import Capabilities from "@/components/capabilities/Capabilities";
import Demos from "@/components/demos/Demos";
import Structure from "@/components/structure/Structure";
import Contact from "@/components/contact/Contact";
import Footer from "@/components/chrome/Footer";

export default function Home() {
  return (
    <>
      <Loader />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Story />
        <Capabilities />
        <Demos />
        <Structure />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
