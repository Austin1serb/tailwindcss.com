import { FooterSitemap, FooterMeta } from "@/components/footer";
import { Header } from "@/components/header";
import Hero from "@/components/home/hero";
import GridContainer from "@/components/grid-container";
import ExplainerSection from "@/components/home/explainer-section";
import TailwindUiSection from "@/components/home/tailwind-ui-section";
import WhyTailwindCssSection from "@/components/home/why-tailwind-css-section";
import BuildAnythingSection from "@/components/home/build-anything-section";
import PartnersSection from "@/components/home/partners-section";

export default function Home() {
  return (
    <div className="max-w-screen overflow-x-hidden">
      <WhyTailwindCssSection />
    </div>
  );
}
