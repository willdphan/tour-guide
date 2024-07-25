import React from 'react';
import FlowChart from '@/components/flowchart';

export default function FlowchartPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">Flowchart</h1>
      <div className="container mx-auto px-4">
        <FlowChart />
      </div>
    </div>
  );
}