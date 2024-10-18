import { stages } from "../../utils/stagesData";

export default function Analyze() {
  const stage = stages.find((s) => s.link === "/finalize");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDF9ED]">
      <div className="text-center text-[#27433F]">
        <h1 className="mb-3 animate-fade-in-up font-Marcellus text-3xl font-bold">
          I am on {stage?.name} page.
        </h1>
        <p className="animate-fade-in-up text-lg delay-500">
          {stage?.description}
        </p>
      </div>
    </div>
  );
}
