import { stages } from '../stagesData';

export default function Analyze() {
  const stage = stages.find(s => s.link === '/finalize');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF9ED]">
      <div className="text-center text-[#27433F]" >
        <h1 className="text-3xl font-bold mb-3 font-Marcellus animate-fade-in-up">
          I am on {stage?.name} page.
        </h1>
        <p className="text-lg delay-500 animate-fade-in-up">
          {stage?.description}
        </p>
      </div>
    </div>
  );
}