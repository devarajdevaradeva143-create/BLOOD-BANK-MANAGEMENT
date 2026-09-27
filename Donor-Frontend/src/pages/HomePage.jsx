import Hero from "../components/home/Hero";
import StatsCounter from "../components/home/StatsCounter";
import WhyDonate from "../components/home/WhyDonate";
import HowItWorksTeaser from "../components/home/HowItWorksTeaser";
import EmergencyCta from "../components/home/EmergencyCta";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <StatsCounter />
      <WhyDonate />
      <HowItWorksTeaser />
      <EmergencyCta />
    </div>
  );
}
