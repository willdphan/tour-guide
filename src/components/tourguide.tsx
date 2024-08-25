import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Step {
  thought: string;
  action: string;
  instruction: string;
  element_description?: string;
  screen_location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AgentResponse {
  steps: Step[];
  final_answer?: string;
  current_url: string;
}

const AgentGuide: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Sending request to:', '/api/run-agent');
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question }),
      });
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${res.status}, body: ${errorBody}`);
      }
      const data = await res.json();
      console.log('Response data:', data);
      if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error('Invalid response format: missing or empty steps array');
      }
      setResponse(data);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response?.steps?.[currentStep]?.screen_location && highlightRef.current) {
      const { x, y, width, height } = response.steps[currentStep].screen_location;
      highlightRef.current.style.left = `${x}px`;
      highlightRef.current.style.top = `${y}px`;
      highlightRef.current.style.width = `${width}px`;
      highlightRef.current.style.height = `${height}px`;
    }
  }, [response, currentStep]);

  const handleNext = () => {
    if (response?.steps && currentStep < response.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">Website Tour Guide</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input 
                    type="text" 
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600" 
                    placeholder="Ask a question" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Ask a question about the website</label>
                </div>
                <div className="relative">
                  <button className="bg-blue-500 text-white rounded-md px-2 py-1" type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}
            {response?.steps && response.steps.length > 0 && (
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p className="font-bold">Step {currentStep + 1} of {response.steps.length}</p>
                <p><span className="font-semibold">Thought:</span> {response.steps[currentStep].thought}</p>
                <p><span className="font-semibold">Action:</span> {response.steps[currentStep].action}</p>
                <p><span className="font-semibold">Instruction:</span> {response.steps[currentStep].instruction}</p>
                {response.steps[currentStep].element_description && (
                  <p><span className="font-semibold">Element:</span> {response.steps[currentStep].element_description}</p>
                )}
                <div className="flex justify-between mt-4">
                  <button 
                    onClick={handlePrevious} 
                    disabled={currentStep === 0}
                    className="bg-gray-300 text-gray-700 rounded-md px-2 py-1 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={currentStep === response.steps.length - 1}
                    className="bg-blue-500 text-white rounded-md px-2 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {response?.steps?.[currentStep]?.screen_location && (
        <motion.div
          ref={highlightRef}
          className="fixed border-2 border-red-500 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  );
};

export default AgentGuide;