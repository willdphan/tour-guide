'use client';
import React, { useCallback, useEffect, useMemo,useRef, useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import { Cell, Pie, PieChart, ResponsiveContainer,Tooltip } from 'recharts';

import Spline from '@splinetool/react-spline';

import Counter from './Counter';
import { NavigationMenuDemo } from "@/components/navigation-menu"


interface ComponentProps {
  probability: number;
  index: number;
  isSelected: boolean;
}

interface PopupNode {
  probability: number;
  title: string;
  optionNumber: number;
  content: string;
}

interface FullScreenPopupProps {
  node: PopupNode;
  onClose: () => void;
}

interface FlowChartProps {
  initialSituation: string;
  initialAction: string;
  showChart: boolean;
  onChartRendered: () => void;
  updateNumberOfOutcomes: (count: number) => void;
}

interface Outcome {
  title: string;
  description: string;
  probability: number;
}

type NodeType = 'situation' | 'action' | 'outcome';

interface TreeNode {
  id: string;
  content: string;
  position: { x: number; y: number };
  type: NodeType;
  outcomes: TreeNode[];
  probability?: number;
  title?: string;
  optionNumber?: number;
}

const findNodeById = (tree: TreeNode, id: string): TreeNode | null => {
  if (tree.id === id) {
    return tree;
  }
  for (const outcome of tree.outcomes) {
    const found = findNodeById(outcome, id);
    if (found) {
      return found;
    }
  }
  return null;
};

const getNodePath = (tree: TreeNode, id: string): number[] | null => {
  if (tree.id === id) {
    return [];
  }
  for (let i = 0; i < tree.outcomes.length; i++) {
    const path = getNodePath(tree.outcomes[i], id);
    if (path !== null) {
      return [i, ...path];
    }
  }
  return null;
};

const getNodeByPath = (tree: TreeNode, path: number[]): TreeNode | null => {
  let currentNode = tree;
  for (const index of path) {
    if (currentNode.outcomes[index]) {
      currentNode = currentNode.outcomes[index];
    } else {
      return null;
    }
  }
  return currentNode;
};

const Component: React.FC<ComponentProps> = ({ probability, index, isSelected }) => {
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
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={isSelected ? "#009BD6" : "#DCA7D6"} />
            <Cell fill="transparent" />
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log(`Request aborted (Call ID: ${callId})`);
        } else {
          console.error(`Error in outcome generation: (Call ID: ${callId})`, error);
        }
      } else {
        console.error(`Unknown error occurred: (Call ID: ${callId})`, error);
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

  const [activeView, setActiveView] = useState<'profile' | 'outcomes'>('outcomes');


  return (
    <div className="flex h-screen w-screen overflow-hidden max-w-screen">
      <div className={`${chartFullyRendered ? 'w-2/6' : 'w-full'} h-full flex flex-col z-[99] ${chartFullyRendered ? 'bg-white' : 'bg-[#E8E4DB]'} transition-colors duration-500 relative`}>
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
                  />
                </motion.div>
              </motion.div>
            ) : chartFullyRendered ? (
              <AnimatePresence mode="wait">
                {activeView === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center w-full"
                  >
                    <h2 className="text-lg mb-2 font-ibm uppercase text-[#3C3C3C]">PROFILE</h2>
                    <p className='font-man text-gray-500'>PROFILE DESCRIPTION.</p>
                  </motion.div>
                )}
  
                {activeView === 'outcomes' && (
                  <motion.div
                    key="outcomes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center w-full"
                  >
                    <div className="mb-4">
                      <span className="text-6xl font-bold font-ibm text-[#3C3C3C]">
                        <Counter value={numberOfOutcomes} />
                        {`${numberOfOutcomes}`}
                      </span>
                    </div>
                    <h2 className="text-lg mb-2 font-ibm uppercase text-[#3C3C3C]">Possible outcomes generated</h2>
                    <p className='font-man text-gray-500'>Interact with the flowchart.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : null}
          </AnimatePresence>
        </div>
        
        {chartFullyRendered && (
          <div className="absolute bottom-4 left-4 flex">
            <button
              onClick={() => setActiveView('profile')}
              className={`px-4 py-2 mr-2 ${activeView === 'profile' ? 'bg-[#3C3C3C] text-white' : 'bg-white text-[#3C3C3C]'} border border-[#3C3C3C]`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveView('outcomes')}
              className={`px-4 py-2 ${activeView === 'outcomes' ? 'bg-[#3C3C3C] text-white' : 'bg-white text-[#3C3C3C]'} border border-[#3C3C3C]`}
            >
              Outcomes
            </button>
          </div>
        )}
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

const FullScreenPopup: React.FC<FullScreenPopupProps> = ({ node, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-4/6 bg-[#E8E4DB] shadow-lg z-50 flex flex-col p-12 ">
      <div className="flex justify-between items-start px-5">
        <div className='flex flex-col'>
          <h2 className="text-2xl mb-2 font-semibold">{node.probability}% {node.title}</h2>
          <p className="text-lg text-gray-500 uppercase font-ibm">Option {node.optionNumber}</p>
        </div>
        <button
          onClick={onClose}
          className="text-2xl font-bold hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      <div className="flex-grow mt-12 px-5 pr-28">
        <h3 className="text-lg font-ibm uppercase mb-3">WHY IS THIS?</h3>
        <p className="text-md font-man leading-relaxed">{node.content}</p>
      </div>
    </div>
  );
};

const FlowChart: React.FC<FlowChartProps> = ({ 
  initialSituation, 
  initialAction, 
  showChart, 
  onChartRendered, 
  updateNumberOfOutcomes 
}) => {

  
  const [treeData, setTreeData] = useState<TreeNode>({
    id: 'start',
    content: '',
    position: { x: 0, y: 0 },
    type: 'action',
    outcomes: []  // This should now be correctly typed
  });

  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [editingNode, setEditingNode] = useState('start');
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupNode, setPopupNode] = useState<PopupNode | null>(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const INITIAL_HORIZONTAL_SPACING = 300;
  const HORIZONTAL_SPACING = 550;
  const VERTICAL_SPACING = 150;

  const generateOutcomes = useCallback(async (parentX: number, parentY: number, action: string): Promise<TreeNode[]> => {

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
  
      const data: { outcomes: Outcome[] } = await response.json();
      const totalHeight = (data.outcomes.length - 1) * VERTICAL_SPACING;
      const startY = parentY - totalHeight / 2;
  
      const newOutcomes: TreeNode[] = data.outcomes.map((outcome: Outcome, i: number) => ({
        id: `outcome-${Date.now()}-${i}`,
        title: outcome.title,
        content: outcome.description,
        probability: outcome.probability,
        optionNumber: i + 1,
        position: { 
          x: parentX + HORIZONTAL_SPACING, 
          y: startY + i * VERTICAL_SPACING
        },
        type: 'outcome',
        outcomes: []  // This should now be correctly typed
      }));
  
      updateNumberOfOutcomes(newOutcomes.length);
      return newOutcomes;
    } catch (error) {
      console.error('Error generating outcomes:', error);
      updateNumberOfOutcomes(0);
      return [];
    }
  }, [updateNumberOfOutcomes, VERTICAL_SPACING, HORIZONTAL_SPACING]);

  const generateInitialFlowchart = useCallback(async (situation: string, action: string) => {
    const outcomes = await generateOutcomes(0, 0, action);
    const totalHeight = (outcomes.length - 1) * VERTICAL_SPACING;
    const startY = window.innerHeight / 2 - totalHeight / 2;
  
    const initialTree: TreeNode = {
      id: 'start',
      content: situation,
      position: { x: 0, y: startY + totalHeight / 2 },
      type: 'situation',
      outcomes: outcomes.map((outcome, index) => ({
        ...outcome,
        id: `outcome-${Date.now()}-${index}`,
        position: {
          x: INITIAL_HORIZONTAL_SPACING,
          y: startY + index * VERTICAL_SPACING
        },
        type: 'outcome' as const,
        outcomes: []
      }))
    };
    setTreeData(initialTree);
  }, [generateOutcomes, VERTICAL_SPACING, INITIAL_HORIZONTAL_SPACING]);

  useEffect(() => {
    if (showChart) {
      generateInitialFlowchart(initialSituation, initialAction).then(() => {
        onChartRendered();
      });
    }
  }, [showChart, initialSituation, initialAction, onChartRendered, generateInitialFlowchart]);

  const handleNodeClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    if (clickedNode) {
      const path = getNodePath(treeData, nodeId);
      if (path !== null) {
        setSelectedPath(path);
        if (clickedNode.type === 'action') {
          setEditingNode(nodeId);
        }
      }
    }
  }, [treeData]);

  const handleNodeDoubleClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    if (clickedNode && clickedNode.type === 'outcome') {
      setTreeData(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
        const parentPath = getNodePath(newTree, nodeId);
        if (parentPath === null) return prevTree;
  
        const parentNodePath = parentPath.slice(0, -1);
        const parentNode = getNodeByPath(newTree, parentNodePath);
        
        if (!parentNode) return prevTree;
  
        parentNode.outcomes.forEach(outcome => {
          outcome.outcomes = [];
        });
        
        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            const newAction: TreeNode = {
              id: `action-${Date.now()}`,
              content: '',
              position: {
                x: node.position.x + HORIZONTAL_SPACING,
                y: node.position.y
              },
              type: 'action',
              outcomes: []  // This should now be correctly typed
            };
            node.outcomes = [newAction];
            setEditingNode(newAction.id);
            return true;
          }
          return node.outcomes.some(updateNode);
        };
        updateNode(newTree);
        
        return newTree;
      });
    }
  }, [treeData, HORIZONTAL_SPACING]);


  const handleExpandClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickedNode = findNodeById(treeData, nodeId);
    if (clickedNode && clickedNode.type === 'outcome') {
      const popupData: PopupNode = {
        probability: clickedNode.probability ?? 0, // Provide a default value if undefined
        title: clickedNode.title ?? '', // Provide a default value if undefined
        optionNumber: clickedNode.optionNumber ?? 0, // Provide a default value if undefined
        content: clickedNode.content
      };
      setPopupNode(popupData);
    }
  }, [treeData]);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = findNodeById(treeData, nodeId);
    if (node) {
      setIsDragging(true);
      setDraggedNode(nodeId);
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      });
    }
  }, [treeData]);

  const handleNodeDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedNode) return;
  
    setTreeData(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const updateNodePosition = (node: TreeNode): boolean => {
        if (node.id === draggedNode) {
          node.position = {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          };
          return true;
        }
        return node.outcomes.some(updateNodePosition);
      };
      
      updateNodePosition(newTree);
      return newTree;
    });
  }, [isDragging, draggedNode, dragOffset]);

  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  const handleActionSubmit = useCallback(async (nodeId: string, content: string) => {
    try {
      const node = findNodeById(treeData, nodeId);
      if (!node) return;
  
      const outcomes = await generateOutcomes(node.position.x, node.position.y, content);
      
      setTreeData(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
        const updateNode = (node: TreeNode): boolean => {
          if (node.id === nodeId) {
            node.content = content;
            node.outcomes = outcomes;
            return true;
          }
          return node.outcomes.some(updateNode);
        };
        updateNode(newTree);
        return newTree;
      });
      setEditingNode('');
    } catch (error) {
      console.error('Error submitting action:', error);
    }
  }, [treeData, generateOutcomes]);




  const renderNode = (node: TreeNode, depth: number = 0, path: number[] = []): React.ReactNode => {
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
  
    const nodeBorderClass = isSelected ? 'border-[2px] border-black' : 'border-[2px] border-black';
    
    
    
    if (depth === 0) {
      return (
        <div key={node.id}>
          {hasOutcomes && (
            <>
              <svg className="absolute" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                {node.outcomes.map((outcome: TreeNode, index: number) => {
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
              {node.outcomes.map((outcome: TreeNode, index: number) => renderNode(outcome, depth + 1, [...path, index]))}
            </>
          )}
        </div>
      );
    
    }

    
              // Add this custom style for the solid shadow
  const solidShadowStyle = {
    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.75)',
  };
    
    return (
      <div key={node.id}>
        <div 
        className={`absolute p-2 py-2 px-4 cursor-pointer text-wrap w-[20em] h-[5em] uppercase text-center font-normal ${nodeBackgroundColor} ${nodeBorderClass}`}
          style={{
            ...solidShadowStyle,  // Apply the solid shadow style here
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
              const form = e.currentTarget;
              const actionInput = form.elements.namedItem('action') as HTMLInputElement;
              if (actionInput) {
                handleActionSubmit(node.id, actionInput.value);
              }
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
  probability={node.probability ?? 0} // Use nullish coalescing operator to provide a default value
  index={path[path.length - 1] ?? 0} // Also provide a default for index
  isSelected={isSelected || isOnSelectedPath}
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
                  className={`flex-shrink-0 text-xl ${isSelected ? 'bg-[#00B7FC] hover:bg-[#00A6E5]' : 'hover:bg-[#DCA7D6]'} pl-2 pr-2 text-black transition-colors duration-200`}
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
                  <motion.path
                  key={outcome.id}
                  d={`M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`}
                  fill="none"
                  stroke={isOutcomeSelected ? "black" : "#C2BEB5"}
                  strokeWidth={isOutcomeSelected ? "3" : "2"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: (depth + 1) * 0.1 }}
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

  const getMaxCoordinates = (node: TreeNode) => {
    let maxX = node.position.x;
    let maxY = node.position.y;
    if (node.outcomes) {
      node.outcomes.forEach((outcome: any) => {
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

  function closePopup(): void {
    setPopupNode(null);
  }

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
      key={JSON.stringify(treeData)} // Add this line
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