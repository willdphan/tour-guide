import React, { useState, useRef, useEffect } from 'react';

const initialTree = {
  id: 'start',
  content: 'WHAT WOULD YOU DO?',
  position: { x: 0, y: 0 },
  outcomes: [
    { id: '1', content: 'SHE ASKS YOU A QUESTION', probability: 25, position: { x: 250, y: 0 } },
    { id: '2', content: 'SHE ASKS YOU A QUESTION', probability: 25, position: { x: 250, y: 100 } },
    { id: '3', content: 'SHE ASKS YOU A QUESTION', probability: 25, position: { x: 250, y: 200 } },
    { id: '4', content: 'SHE ASKS YOU A QUESTION', probability: 25, position: { x: 250, y: 300 } }
  ]
};

const OutcomePlotGenerator = () => {
  const [treeData, setTreeData] = useState(initialTree);
  const [userInput, setUserInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);

  const generateOutcomes = (parentX: number, parentY: number) => {
    const numOutcomes = Math.floor(Math.random() * 3) + 2; // 2 to 4 outcomes
    return Array.from({ length: numOutcomes }, (_, i) => ({
      id: `outcome-${Date.now()}-${i}`,
      content: `New Outcome ${i + 1}`,
      probability: Math.floor(100 / numOutcomes),
      position: { x: parentX + 250, y: parentY + i * 100 }
    }));
  };

  const handleNodeDoubleClick = (nodeId: string, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
    setTreeData(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const toggleOutcomes = (nodes: any) => {
        for (let node of nodes) {
          if (node.id === nodeId) {
            if (node.outcomes && node.outcomes.length > 0) {
              node.outcomes = [];
            } else {
              node.outcomes = generateOutcomes(node.position.x, node.position.y);
            }
            return true;
          }
          if (node.outcomes && toggleOutcomes(node.outcomes)) {
            return true;
          }
        }
        return false;
      };
      
      if (nodeId === 'start') {
        if (newTree.outcomes && newTree.outcomes.length > 0) {
          newTree.outcomes = [];
        } else {
          newTree.outcomes = generateOutcomes(newTree.position.x, newTree.position.y);
        }
      } else {
        toggleOutcomes(newTree.outcomes);
      }
      
      return newTree;
    });
  };

  const handleNodeDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, nodeId: React.SetStateAction<null>) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedNode(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodeDrag = (e: { clientX: any; clientY: any; }) => {
    if (!isDragging || !draggedNode) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setTreeData(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const updateNodePosition = (node: { id: any; position: { x: number; y: number; }; outcomes: any[]; }) => {
        if (node.id === draggedNode) {
          node.position.x += dx;
          node.position.y += dy;
          return true;
        }
        return node.outcomes && node.outcomes.some(updateNodePosition);
      };
      
      if (draggedNode === 'start') {
        newTree.position.x += dx;
        newTree.position.y += dy;
      } else {
        updateNodePosition(newTree);
      }
      
      return newTree;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodeDragEnd = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const renderTree = () => {
    const renderNode = (node: { id: any; content: any; position: any; outcomes: any; probability?: any; }, depth = 0) => {
      const hasOutcomes = node.outcomes && node.outcomes.length > 0;
      const isRoot = depth === 0;
      
      return (
        <div key={node.id}>
          <div 
            className={`absolute border p-2 rounded cursor-move text-center w-48 ${isRoot ? 'bg-blue-100' : 'bg-purple-100'}`}
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`
            }}
            onMouseDown={(e) => handleNodeDragStart(e, node.id)}
            onDoubleClick={(e) => handleNodeDoubleClick(node.id, e)}
          >
            <div>{node.content}</div>
            {!isRoot && <div className="text-sm text-gray-500">{node.probability}%</div>}
          </div>
          {hasOutcomes && (
            <>
              <svg className="absolute" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                {node.outcomes.map((outcome: { id: React.Key | null | undefined; position: { x: any; y: number; }; }) => (
                  <path
                    key={outcome.id}
                    d={`M ${node.position.x + 192},${node.position.y + 25} C ${(node.position.x + outcome.position.x) / 2},${node.position.y + 25} ${(node.position.x + outcome.position.x) / 2},${outcome.position.y + 25} ${outcome.position.x},${outcome.position.y + 25}`}
                    fill="none"
                    stroke="gray"
                    strokeWidth="2"
                  />
                ))}
              </svg>
              {node.outcomes.map((outcome: any) => renderNode(outcome, depth + 1))}
            </>
          )}
        </div>
      );
    };

    return (
      <div 
        className="relative" 
        style={{ 
          height: '2000px', 
          width: '2000px',
          transform: `translate(${viewPosition.x}px, ${viewPosition.y}px)`
        }}
      >
        {renderNode(treeData)}
      </div>
    );
  };

  // Update the handleMouseDown function type
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === containerRef.current) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewPosition.x, y: e.clientY - viewPosition.y });
    }
  };


  const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
    if (isPanning) {
      setViewPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isDragging) {
      handleNodeDrag(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    handleNodeDragEnd();
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, isDragging, dragStart, draggedNode]);

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setTreeData(prevTree => ({
      ...prevTree,
      content: userInput || 'WHAT WOULD YOU DO?'
    }));
    setUserInput('');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Outcome Plot Generator</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your scenario"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Generate Outcomes</button>
      </form>
      <div 
  ref={containerRef}
  className="border p-4 overflow-hidden cursor-move" 
  style={{ width: '100%', height: '600px' }}
  onMouseDown={handleMouseDown}
>
  {renderTree()}
</div>
    </div>
  );
};

export default OutcomePlotGenerator;
