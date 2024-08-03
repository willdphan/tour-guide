'use client';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import debounce from 'lodash/debounce';
import Counter from './Counter';

interface ComponentProps {
  probability: number;
  index: number;
  isSelected: boolean;
}

const Component: React.FC<ComponentProps> = ({ probability, index, isSelected }) => {
  const rotation = (index % 4) * 90;
  const startAngle = rotation;
  const endAngle = startAngle + 360;

  const data = [
    { name: "Probability", value: probability },
    { name: "Remaining", value: 100 - probability }
  ];

  const nodeWidth = Math.max(20, probability.toFixed(0).length * 10);

  return (
    <div className={`relative w-${nodeWidth} h-16`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius="100%"
            innerRadius="0%"
            dataKey="value"
            startAngle={startAngle}
            endAngle={endAngle}
            stroke="none"
          >
            <Cell fill={isSelected ? "#009BD6" : "#DCA7D6"} />
            <Cell fill="none" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg text-[#3C3C3C] font-ibm uppercase">{probability.toFixed(0)}%</span>
      </div>
    </div>
  );
};

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [outcomesReady, setOutcomesReady] = useState(false);
  const [chartFullyRendered, setChartFullyRendered] = useState(false);
  const [showSpline, setShowSpline] = useState(false);
  const [numberOfOutcomes, setNumberOfOutcomes] = useState(0);
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef(new AbortController());

  const questions = [
    "Set the setting",
    "What action will you take?"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[step] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else if (!isGeneratingRef.current) {
      await debouncedProgressStep();
    }
  };

  const progressStep = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log('Already generating outcomes, skipping...');
      return;
    }
    
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setShowSpline(true);
    
    const callId = Date.now();
    console.log(`Starting outcome generation... (Call ID: ${callId})`);
    
    try {
      abortControllerRef.current.abort(); // Cancel any ongoing requests
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://localhost:8000/generate-outcomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: answers[1] }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`API response received: (Call ID: ${callId})`, data);

      if (Array.isArray(data.outcomes) && data.outcomes.length > 0) {
        console.log(`Updating number of outcomes to ${data.outcomes.length} (Call ID: ${callId})`);
        setNumberOfOutcomes(data.outcomes.length);
      } else {
        console.error(`No outcomes or invalid outcomes array: (Call ID: ${callId})`, data.outcomes);
        setNumberOfOutcomes(0);
      }
      
      console.log(`Setting outcomesReady to true (Call ID: ${callId})`);
      setOutcomesReady(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request aborted (Call ID: ${callId})`);
      } else {
        console.error(`Error in outcome generation: (Call ID: ${callId})`, error);
        setNumberOfOutcomes(0);
      }
    } finally {
      console.log(`Finishing outcome generation... (Call ID: ${callId})`);
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [answers]);

  const debouncedProgressStep = useMemo(
    () => debounce(progressStep, 300),
    [progressStep]
  );

  useEffect(() => {
    if (outcomesReady) {
      setShowChart(true);
    }
  }, [outcomesReady]);

  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
      debouncedProgressStep.cancel();
    };
  }, [debouncedProgressStep]);

  const handleChartRendered = useCallback(() => {
    setChartFullyRendered(true);
    setShowSpline(false);
  }, []);

  const updateNumberOfOutcomes = useCallback((count: number) => {
    setNumberOfOutcomes(count);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden max-w-screen">
      <div className={`${chartFullyRendered ? 'w-2/6' : 'w-full'} h-full flex flex-col z-[99] ${chartFullyRendered ? 'bg-white' : 'bg-[#E8E4DB]'} transition-colors duration-500`}>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {!isGenerating && !outcomesReady ? (
              <motion.div
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <h2 className="text-lg mb-4 text-center uppercase font-mono">{questions[step]}</h2>
                <form onSubmit={handleInputSubmit}>
                  <input
                    type="text"
                    value={answers[step]}
                    onChange={handleInputChange}
                    className="w-full mb-4 text-center placeholder-center focus:outline-none focus:ring-0 font-man bg-transparent"
                    placeholder="Enter your answer"
                    autoFocus
                    style={{
                      '::placeholder': {
                        textAlign: 'center',
                      },
                    }}
                  />
                </form>
              </motion.div>
            ) : showSpline ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center w-full h-full bg-[#E8E4DB] flex items-center justify-center"
              >
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="flex items-center justify-center"
                >
                  <Spline
                    scene="https://prod.spline.design/gbG6-0xtiOTPHBfn/scene.splinecode" 
                    width={400}
                    height={400}
                  />
                </motion.div>
              </motion.div>
            ) : chartFullyRendered ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center w-full"
              >
                <div className="mb-4">
                  <span className="text-6xl font-bold font-ibm text-[#3C3C3C]"><Counter numberOfOutcomes={numberOfOutcomes} /></span>
                </div>
                <h2 className="text-lg mb-2 font-ibm uppercase text-[#3C3C3C]">Possible outcomes generated</h2>
                <p className='font-man text-gray-500'>Interact with the flowchart.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      {showChart && (
        <div className={`${chartFullyRendered ? 'w-4/6' : 'w-0'} h-full transition-all duration-500`}>
          <FlowChart 
            initialSituation={answers[0]} 
            initialAction={answers[1]} 
            showChart={showChart}
            onChartRendered={handleChartRendered}
            updateNumberOfOutcomes={updateNumberOfOutcomes}
          />
        </div>
      )}
    </div>
  );
};

const FullScreenPopup = ({ node, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-4/6 bg-[#E8E4DB] shadow-lg z-50 flex flex-col p-12 ">
      <div className="flex justify-between items-start">
        <div className='flex flex-col'>
          <h2 className="text-3xl mb-2">{node.probability}% {node.title}</h2>
          <p className="text-3xl text-gray-500">Option {node.optionNumber}</p>
        </div>
        <button
          onClick={onClose}
          className="text-2xl font-bold hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      <div className="flex-grow mt-16">
        <h3 className="text-xl font-mono uppercase mb-6">WHY IS THIS?</h3>
        <p className="text-lg font-man leading-relaxed">{node.content}</p>
      </div>
    </div>
  );
};

const FlowChart = ({ initialSituation, initialAction, showChart, onChartRendered, updateNumberOfOutcomes }) => {
  const [treeData, setTreeData] = useState(initialTree);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [editingNode, setEditingNode] = useState('start');
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupNode, setPopupNode] = useState(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const INITIAL_HORIZONTAL_SPACING = 300;
  const HORIZONTAL_SPACING = 550;
  const VERTICAL_SPACING = 150;

  useEffect(() => {
    if (showChart) {
      generateInitialFlowchart(initialSituation, initialAction).then(() => {
        onChartRendered();
      });
    }
  }, [showChart, initialSituation, initialAction, onChartRendered]);

  const generateInitialFlowchart = async (situation, action) => {
    const outcomes = await generateOutcomes(0, 0, action);
    const totalHeight = (outcomes.length - 1) * VERTICAL_SPACING;
    const startY = window.innerHeight / 2 - totalHeight / 2;
  
    const initialTree = {
      id: 'start',
      content: situation,
      position: { x: 0, y: startY + totalHeight / 2 },
      type: 'situation',
      outcomes: outcomes.map((outcome, index) => ({
        ...outcome,
        position: {
          x: INITIAL_HORIZONTAL_SPACING,
          y: startY + index * VERTICAL_SPACING
        }
      }))
    };
    setTreeData(initialTree);
  };

  const generateOutcomes = useCallback(async (parentX: number, parentY: number, action: string): Promise<any[]> => {
    try {
      const response = await fetch('http://localhost:8000/generate-outcomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const totalHeight = (data.outcomes.length - 1) * VERTICAL_SPACING;
      const startY = parentY - totalHeight / 2;

      const newOutcomes = data.outcomes.map((outcome: Outcome, i: number) => ({
        id: `outcome-${Date.now()}-${i}`,
        title: outcome.title,
        content: outcome.description,
        probability: outcome.probability,
        optionNumber: i + 1, // Generate option number if not provided by API

        position: { 
          x: parentX + HORIZONTAL_SPACING, 
          y: startY + i * VERTICAL_SPACING
        },
        type: 'outcome',
        outcomes: []
      }));

      updateNumberOfOutcomes(newOutcomes.length);

      return newOutcomes;
    } catch (error) {
      console.error('Error generating outcomes:', error);
      updateNumberOfOutcomes(0);
      return [];
    }
  }, [updateNumberOfOutcomes]);

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
      setPopupNode(clickedNode);
    }
  };

  const closePopup = () => {
    setPopupNode(null);
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
    const isOnSelectedPath = selectedPath.length >= path.length && 
      JSON.stringify(path) === JSON.stringify(selectedPath.slice(0, path.length));
    const isEditing = editingNode === node.id;
    
    let nodeBackgroundColor = 'bg-white';
    if (node.type === 'action') {
      nodeBackgroundColor = 'bg-[#3C3C3C]';
    } else if (node.type === 'outcome') {
      nodeBackgroundColor = isOnSelectedPath ? 'bg-[#00B7FC]' : 'bg-[#F2B8EB]';
    }
  
    const nodeBorderClass = isSelected ? 'border-[2px] border-black' : 'border-[2px] border-[#C2BEB5]';
    
    
    if (depth === 0) {
      return (
        <div key={node.id}>
          {hasOutcomes && (
            <>
              <svg className="absolute" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                {node.outcomes.map((outcome, index) => {
                  const isOutcomeSelected = selectedPath.length > path.length && 
                                            selectedPath[path.length] === index;
                  const startX = 0;
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
                      strokeWidth={isOutcomeSelected ? "2" : "1"}
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
          className={`absolute p-2 py-2 px-4 cursor-pointer text-wrap w-[20em] h-[5em] uppercase text-center font-normal ${nodeBackgroundColor} ${nodeBorderClass}`}
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
                className={`w-full h-full p-2 text-center text-white font-mono uppercase text-center text-sm text-wrap ${nodeBackgroundColor} outline-none`}
                autoFocus
              />
            </form>
          ) : (
            <>
            <div className="w-full flex-grow flex items-center justify-between ">
              {node.type === 'outcome' && (
                <div className="w-16 h-16 font-medium">
                  <Component 
                    probability={node.probability}
                    index={path[path.length - 1]}
                    isSelected={isSelected}
                  />
                </div>
              )}
              <div className="flex-grow text-sm overflow-hidden text-black">
                <div className="text-ellipsis overflow-hidden font-ibm">
                  {node.type === 'action' ? node.content : node.title}
                </div>
              </div>
              {node.type === 'outcome' && (
                <button 
                  className={`flex-shrink-0 text-xl ${isSelected ? 'bg-[#00B7FC] hover:bg-[#007AB3]' : 'hover:bg-[#DCA7D6]'} pl-2 pr-2 text-black transition-colors duration-200`}
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
                const startX = node.position.x + 320;
                const startY = node.position.y + NODE_HEIGHT / 2;
                const endX = outcome.position.x;
                const endY = outcome.position.y + NODE_HEIGHT / 2;
                const midX = (startX + endX) / 2;

                return (
                  <path
                    key={outcome.id}
                    d={`M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`}
                    fill="none"
                    stroke={isOutcomeSelected ? "black" : "#C2BEB5"}
                    strokeWidth={isOutcomeSelected ? "3" : "2"}
                  />
                );
              })}
            </svg>
            {hasOutcomes && node.outcomes.map((outcome, index) => renderNode(outcome, depth + 1, [...path, index]))}
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
      {popupNode && (
        <FullScreenPopup 
          node={popupNode} 
          onClose={closePopup} 
        />
      )}
    </div>
  );
};

export default FlowchartPage;