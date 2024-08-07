import React, { useState, useEffect } from 'react';
import { listFlowcharts, loadFlowchart } from './flowchart-actions';

interface Flowchart {
  name: string;
  created_at: string;
}

export function UserFlowcharts({ onFlowchartSelect }: { onFlowchartSelect: (flowchart: any) => void }) {
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlowcharts() {
      try {
        const data = await listFlowcharts();
        setFlowcharts(data);
      } catch (err) {
        setError('Failed to load flowcharts');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlowcharts();
  }, []);

  const handleFlowchartClick = async (name: string) => {
    try {
      const flowchartData = await loadFlowchart(name);
      onFlowchartSelect(flowchartData);
    } catch (err) {
      console.error('Error loading flowchart:', err);
      setError('Failed to load flowchart');
    }
  };

  if (isLoading) return <div>Loading your flowcharts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Flowcharts</h2>
      {flowcharts.length === 0 ? (
        <p>You haven't created any flowcharts yet.</p>
      ) : (
        <ul>
          {flowcharts.map((flowchart) => (
            <li key={flowchart.name}>
              <button onClick={() => handleFlowchartClick(flowchart.name)}>
                {flowchart.name}
              </button>
              <span> (Created: {new Date(flowchart.created_at).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}