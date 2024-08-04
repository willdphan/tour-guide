'use client';

import React, { useCallback, useEffect,useRef, useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import { Cell, Pie, PieChart, ResponsiveContainer,Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const generateRandomPercentages = (count) => {
  let percentages = Array(count).fill(0).map(() => Math.random());
  const total = percentages.reduce((a, b) => a + b, 0);
  return percentages.map(p => +(p / total * 100).toFixed(1));
};

export function Component() {
  const percentages = generateRandomPercentages(5);
  const chartData = [
    { name: "Outcome 1", value: percentages[0] },
    { name: "Outcome 2", value: percentages[1] },
    { name: "Outcome 3", value: percentages[2] },
    { name: "Outcome 4", value: percentages[3] },
    { name: "Outcome 5", value: percentages[4] },
  ];

  return (
    <div className="w-16 h-16">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius="90%"
            innerRadius="0%"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const initialTree = {
  id: 'start',
  content: '',
  position: { x: 0, y: 0 },
  type: 'action',
  outcomes: []
};

const FlowchartPage = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(['', '']);
  const [showChart, setShowChart] = useState(false);

  const questions = [
    "What is your initial situation?",
    "What action will you take?"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[step] = e.target.value;
    setAnswers(newAnswers);
  };

  const progressStep = useCallback(debounce(async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowChart(true);
    }
  }, 1000), [step, questions.length, answers]);

  useEffect(() => {
    if (answers[step].trim().length > 0) {
      progressStep();
    }
    return () => progressStep.cancel();
  }, [answers, step, progressStep]);

  return (
    <div className="flex h-screen w-screen overflow-hidden max-w-screen">
      <div className="w-1/4 h-full bg-gray-100 border-r-2 border-black flex flex-col z-[99]">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {!showChart ? (
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <h2 className="text-lg font-semibold mb-4 text-center">{questions[step]}</h2>
                <input
                  type="text"
                  value={answers[step]}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded mb-4 text-center placeholder-center focus:outline-none focus:ring-0 focus:border-gray-300"
                  placeholder="Enter your answer"
                  autoFocus
                  style={{
                    '::placeholder': {
                      textAlign: 'center',
                    },
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <h2 className="text-lg font-semibold mb-4">Flowchart Generated</h2>
                <p>You can now interact with the flowchart.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="w-3/4 h-full">
        <FlowChart 
          initialSituation={answers[0]} 
          initialAction={answers[1]} 
          showChart={showChart} 
        />
      </div>
    </div>
  );
};

const FlowChart = ({ initialSituation, initialAction, showChart }) => {
  const [treeData, setTreeData] = useState(initialTree);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [editingNode, setEditingNode] = useState('start');
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const INITIAL_HORIZONTAL_SPACING = 300; // Adjust this value as needed

  const HORIZONTAL_SPACING = 550;
  const VERTICAL_SPACING = 150;

  useEffect(() => {
    if (showChart && initialSituation && initialAction) {
      generateInitialFlowchart(initialSituation, initialAction);
    }
  }, [showChart, initialSituation, initialAction]);

  const generateInitialFlowchart = async (situation, action) => {
    const outcomes = await generateOutcomes(0, 0, action);
    const totalHeight = (outcomes.length - 1) * VERTICAL_SPACING;
    const startY = window.innerHeight / 2 - totalHeight / 2; // Center vertically
  
    const initialTree = {
      id: 'start',
      content: situation,
      position: { x: 0, y: startY + totalHeight / 2 }, // Center the root node
      type: 'situation',
      outcomes: outcomes.map((outcome, index) => ({
        ...outcome,
        position: {
          x: INITIAL_HORIZONTAL_SPACING,
          // x: INITIAL_HORIZONTAL_SPACING + (index * NODE_WIDTH / 2), // Add horizontal offset based on index
          y: startY + index * VERTICAL_SPACING
        }
      }))
    };
    setTreeData(initialTree);
  };

  const generateOutcomes = async (parentX, parentY, action) => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-outcomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      const totalHeight = (data.outcomes.length - 1) * VERTICAL_SPACING;
      const startY = parentY - totalHeight / 2;
  
      const newOutcomes = data.outcomes.map((outcome, i) => ({
        id: `outcome-${Date.now()}-${i}`,
        title: outcome,
        content: outcome,
        probability: Math.floor(100 / data.outcomes.length),
        position: { 
          x: parentX + HORIZONTAL_SPACING, 
          y: startY + i * VERTICAL_SPACING
        },
        type: 'outcome',
        outcomes: []
      }));
  
      return newOutcomes;
    } catch (error) {
      console.error('Error generating outcomes:', error);
      return [];
    }
  };

  const getNodePath = (tree, nodeId, path = []) => {
    if (tree.id === nodeId) return path;
    if (tree.outcomes) {
      for (let i = 0; i < tree.outcomes.length; i++) {
        const result = getNodePath(tree.outcomes[i], nodeId, [...path, i]);
        if (result) return result;
      }
    }
    return null;
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    setSelectedPath(getNodePath(treeData, nodeId));
    if (clickedNode.type === 'action') {
      setEditingNode(nodeId);
    }
  };

  const handleNodeDoubleClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    if (clickedNode.type === 'outcome') {
      setTreeData(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree));
        const parentPath = getNodePath(newTree, nodeId).slice(0, -1);
        const parentNode = getNodeByPath(newTree, parentPath);
        
        parentNode.outcomes.forEach(outcome => {
          outcome.outcomes = [];
        });
        
        const updateNode = (node) => {
          if (node.id === nodeId) {
            const newAction = {
              id: `action-${Date.now()}`,
              content: '',
              position: {
                x: node.position.x + HORIZONTAL_SPACING,
                y: node.position.y
              },
              type: 'action',
              outcomes: []
            };
            node.outcomes = [newAction];
            setEditingNode(newAction.id);
            return true;
          }
          return node.outcomes && node.outcomes.some(updateNode);
        };
        updateNode(newTree);
        
        return newTree;
      });
    }
  };

  const handleExpandClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    if (clickedNode.type === 'outcome') {
      setSelectedNodeDetail(clickedNode);
    }
  };

  const getNodeByPath = (tree, path) => {
    let node = tree;
    for (const index of path) {
      node = node.outcomes[index];
    }
    return node;
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = findNodeById(treeData, nodeId);
    setIsDragging(true);
    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
  };

  const handleNodeDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedNode) return;

    setTreeData(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const updateNodePosition = (node) => {
        if (node.id === draggedNode) {
          node.position = {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          };
          return true;
        }
        return node.outcomes && node.outcomes.some(updateNodePosition);
      };
      
      updateNodePosition(newTree);
      return newTree;
    });
  }, [isDragging, draggedNode, dragOffset]);

  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleNodeDrag);
      document.addEventListener('mouseup', handleNodeDragEnd);
    } else {
      document.removeEventListener('mousemove', handleNodeDrag);
      document.removeEventListener('mouseup', handleNodeDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleNodeDrag);
      document.removeEventListener('mouseup', handleNodeDragEnd);
    };
  }, [isDragging, handleNodeDrag, handleNodeDragEnd]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleNodeDrag(e);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    handleNodeDragEnd();
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const findNodeById = (node, id) => {
    if (node.id === id) return node;
    if (node.outcomes) {
      for (const outcome of node.outcomes) {
        const found = findNodeById(outcome, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleActionSubmit = async (nodeId: string, content: string) => {
    try {
      const node = findNodeById(treeData, nodeId);
      if (!node) return;
  
      const outcomes = await generateOutcomes(node.position.x, node.position.y, content);
      
      setTreeData(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree));
        const updateNode = (node) => {
          if (node.id === nodeId) {
            node.content = content;
            node.outcomes = outcomes;
            return true;
          }
          return node.outcomes && node.outcomes.some(updateNode);
        };
        updateNode(newTree);
        return newTree;
      });
      setEditingNode(null);
    } catch (error) {
      console.error('Error submitting action:', error);
    }
  };

  const renderNode = (node, depth = 0, path = []) => {
    if (!node) return null;
    const hasOutcomes = node.outcomes && node.outcomes.length > 0;
    const isSelected = JSON.stringify(path) === JSON.stringify(selectedPath);
    const isEditing = editingNode === node.id;
    
    const nodeBackgroundColor = node.type === 'action' ? 'bg-blue-100' : '';
    const nodeBorderClass = isSelected ? 'border-2 border-black' : 'border-2 border-black';
    
    if (depth === 0) {
      return (
        <div key={node.id}>
          {hasOutcomes && (
            <>
              <svg className="absolute" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                {node.outcomes.map((outcome, index) => {
                  const isOutcomeSelected = selectedPath.length > path.length && 
                                            selectedPath[path.length] === index;
                  const startX = 0; // Start from the left edge of the flowchart area
                  const startY = node.position.y + NODE_HEIGHT / 2;
                  const endX = outcome.position.x;
                  const endY = outcome.position.y + NODE_HEIGHT / 2;
                  const midX = (startX + endX) / 2;
  
                  return (
                    <path
                      key={outcome.id}
                      d={`M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`}
                      fill="none"
                      stroke={isOutcomeSelected ? "black" : "gray"}
                      strokeWidth={isOutcomeSelected ? "3" : "2"}
                    />
                  );
                })}
              </svg>
              {node.outcomes.map((outcome, index) => renderNode(outcome, depth + 1, [...path, index]))}
            </>
          )}
        </div>
      );
    }
        
    return (
      <div key={node.id}>
        <div 
          className={`absolute p-2 py-2 px-4 cursor-pointer text-wrap w-[20em] h-[5em] ${nodeBackgroundColor} ${nodeBorderClass}`}
          style={{
            left: `${node.position.x}px`,
            top: `${node.position.y}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={(e) => handleNodeClick(node.id, e)}
          onDoubleClick={(e) => handleNodeDoubleClick(node.id, e)}
          onMouseDown={(e) => handleNodeDragStart(e, node.id)}
        >
          {node.type === 'action' && (isEditing || node.content === '') ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleActionSubmit(node.id, e.currentTarget.action.value);
            }} className="w-full h-full">
              <input
                name="action"
                defaultValue={node.content}
                className={`w-full h-full p-1 text-center text-black ${nodeBackgroundColor} outline-none`}
                autoFocus
              />
            </form>
           ) : (
            <>
              <div className="w-full flex-grow flex items-center justify-between ">
                {node.type === 'outcome' && (
                  <div className="w-16 h-16 mr-4">
                    <Component />
                  </div>
                )}
                <div className="flex-grow text-sm font-medium overflow-hidden text-black">
                  <div className="text-ellipsis overflow-hidden">
                    {node.type === 'action' ? node.content : node.title}
                  </div>
                </div>
                {node.type === 'outcome' && (
                  <button 
                    className="flex-shrink-0 text-3xl px-2 py-1 rounded hover:bg-gray-300 ml-2 text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpandClick(node.id, e);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {hasOutcomes && (
      <>
        <svg className="absolute" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          {node.outcomes.map((outcome, index) => {
            const isOutcomeSelected = selectedPath.length > path.length && 
                                      selectedPath[path.length] === index;
            const startX = node.position.x + 320; // Adjust this value based on your actual node width
            const startY = node.position.y + NODE_HEIGHT / 2;
            const endX = outcome.position.x;
            const endY = outcome.position.y + NODE_HEIGHT / 2;
            const midX = (startX + endX) / 2;

            return (
              <path
                key={outcome.id}
                d={`M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`}
                fill="none"
                stroke={isOutcomeSelected ? "black" : "gray"}
                strokeWidth={isOutcomeSelected ? "3" : "2"}
              />
            );
          })}
        </svg>
        {node.outcomes.map((outcome, index) => renderNode(outcome, depth + 1, [...path, index]))}
      </>
    )}
    </div>
  );
};


  const getMaxCoordinates = (node) => {
    let maxX = node.position.x;
    let maxY = node.position.y;
    if (node.outcomes) {
      node.outcomes.forEach(outcome => {
        const { maxX: childMaxX, maxY: childMaxY } = getMaxCoordinates(outcome);
        maxX = Math.max(maxX, childMaxX);
        maxY = Math.max(maxY, childMaxY);
      });
    }
    return { maxX, maxY };
  };

  const { maxX, maxY } = getMaxCoordinates(treeData);
  const containerWidth = Math.max(maxX + NODE_WIDTH + HORIZONTAL_SPACING, window.innerWidth);
  const containerHeight = Math.max(maxY + NODE_HEIGHT + VERTICAL_SPACING, window.innerHeight);

  return (
    <div className="h-full w-full bg-[#E8E4DB] overflow-auto">
      <div 
        ref={containerRef}
        className="relative"
        style={{ 
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          minHeight: '100vh'
        }}
      >
        {renderNode(treeData)}
      </div>
      {selectedNodeDetail && (
        <DetailView 
          node={selectedNodeDetail} 
          onClose={() => setSelectedNodeDetail(null)} 
        />
      )}
    </div>
  );
};

export default FlowchartPage;