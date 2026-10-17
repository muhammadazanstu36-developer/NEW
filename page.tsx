import { AppProvider } from "@/components/AppContext";
import { AtsCheck } from "@/components/AtsCheck";
import { AuthDialog } from "@/components/AuthDialog";
import { CVMaker } from "@/components/CVMaker";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Gate } from "@/components/Gate";
import { Hero } from "@/components/Hero";
import { InstallPrompt } from "@/components/InstallPrompt";
import { HowItWorks } from "@/components/HowItWorks";
import { JobFinder } from "@/components/JobFinder";
import { Nav } from "@/components/Nav";
import { Results } from "@/components/Results";
import { TailorForm } from "@/components/TailorForm";
import { Tracker } from "@/components/Tracker";
import { Wallpaper } from "@/components/Wallpaper";

export default function Page() {
  return (
    <AppProvider>
      <Wallpaper />
      <Nav />
      <main className="mx-auto max-w-[1160px] px-3 pb-28 pt-5 sm:px-5 sm:pt-9">
        <HowItWorks />
        <Hero />
        <Gate>
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 min-[860px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <TailorForm />
            <Results />
          </div>
          <AtsCheck />
          <CVMaker />
          <JobFinder />
          <Tracker />
        </Gate>
        <Features />
        <Footer />
      </main>
      <AuthDialog />
      <InstallPrompt />
    </AppProvider>
  );
}
