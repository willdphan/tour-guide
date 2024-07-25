'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const calculateInitialPanOffset = () => {
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 32 : 1000;
  const containerHeight = 500; // Assuming a fixed container height
  return {
    x: 50, // Small offset from the left edge
    y: containerHeight / 2 // Center vertically
  };
};

const initialPanOffset = calculateInitialPanOffset();

const initialTree = {
  id: 'start',
  content: '',
  position: { x: 0, y: 0 },
  type: 'action',
  outcomes: []
};

const FlowChart = () => {
  const [treeData, setTreeData] = useState(initialTree);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState(initialPanOffset);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [editingNode, setEditingNode] = useState('start');
  const [selectedNodeDetail, setSelectedNodeDetail] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const HORIZONTAL_SPACING = 450;
  const VERTICAL_SPACING = 400;

  const getAllNodes = (node) => {
    let nodes = [node];
    if (node.outcomes) {
      for (const outcome of node.outcomes) {
        nodes = nodes.concat(getAllNodes(outcome));
      }
    }
    return nodes;
  };

  const checkCollision = (node1, node2) => {
    return (
      node1.position.x < node2.position.x + NODE_WIDTH &&
      node1.position.x + NODE_WIDTH > node2.position.x &&
      node1.position.y < node2.position.y + NODE_HEIGHT &&
      node1.position.y + NODE_HEIGHT > node2.position.y
    );
  };

  const adjustPositions = (nodes, newNodes) => {
    const allNodes = [...nodes, ...newNodes];
    let adjusted = true;
    while (adjusted) {
      adjusted = false;
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = 0; j < allNodes.length; j++) {
          if (newNodes[i] !== allNodes[j] && checkCollision(newNodes[i], allNodes[j])) {
            newNodes[i].position.y += VERTICAL_SPACING;
            adjusted = true;
          }
        }
      }
    }
    return newNodes;
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
      const nodeWidth = 320; // 20em * 16px
      const nodeHeight = 80; // 5em * 16px
      const horizontalSpacing = 550;
      const verticalSpacing = 100;
  
      const totalHeight = (data.outcomes.length - 1) * verticalSpacing;
      const startY = parentY - totalHeight / 2;
  
      const newOutcomes = data.outcomes.map((outcome, i) => ({
        id: `outcome-${Date.now()}-${i}`,
        title: outcome,
        content: outcome,
        probability: Math.floor(100 / data.outcomes.length),
        position: { 
          x: parentX + horizontalSpacing, 
          y: startY + i * verticalSpacing
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
        
        // Remove action nodes from all sibling outcomes
        parentNode.outcomes.forEach(outcome => {
          outcome.outcomes = [];
        });
        
        // Create a new action node for the clicked outcome
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

  const handleNodeDrag = (e) => {
    if (!isDragging || !draggedNode) return;
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;
  
    setTreeData(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      const allNodes = getAllNodes(newTree);
      const updateNodePosition = (node) => {
        if (node.id === draggedNode) {
          const newPosition = {
            x: node.position.x + dx,
            y: node.position.y + dy
          };
          const newNode = { ...node, position: newPosition };
          const adjustedNodes = adjustPositions(
            allNodes.filter(n => n.id !== node.id),
            [newNode]
          );
          node.position = adjustedNodes[0].position;
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

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedNode(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleNodeDragEnd = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.min(Math.max(prevScale * scaleFactor, 0.1), 3));
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('pan-area')) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isDragging) {
      handleNodeDrag(e);
    }
  }, [isPanning, isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    handleNodeDragEnd();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

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
    
    return (
      <div key={node.id}>
        <div 
          className={`absolute border p-2 py-2 px-4  cursor-pointer text-wrap w-[20em] h-[5em]  ${
            node.type === 'action' ? 'bg-blue-100' : 'bg-purple-100'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
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
            }} className="w-full">
              <input
                name="action"
                defaultValue={node.content}
                className="w-full p-1 text-center text-black"
                
                autoFocus
              />
            </form>
          ) : (
            <>
              <div className="w-full flex items-center justify-between mb-2">
                {node.type === 'outcome' && (
                  <div className="text-md text-gray-500 mr-2">{node.probability}%</div>
                )}
                <div className="flex-grow text-sm font-medium text-center overflow-hidden text-black">
                  <div className="text-ellipsis overflow-hidden">
                    {node.type === 'action' ? node.content : node.title}
                  </div>
                </div>
                {node.type === 'outcome' && (
                  <button 
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 ml-2 text-black"
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
            <svg className="absolute pan-area" style={{ left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
              
  {node.outcomes.map((outcome, index) => {
    const isOutcomeSelected = selectedPath.length > path.length && 
                              selectedPath[path.length] === index;
    const nodeWidth = 320; // 20em * 16px (assuming 1em = 16px)
    const nodeHeight = 80; // 5em * 16px
    const startX = node.position.x + nodeWidth;
    const startY = node.position.y + nodeHeight / 2;
    const endX = outcome.position.x;
    const endY = outcome.position.y + nodeHeight / 2;
    const midX = (startX + endX) / 2;

    return (
      <path
        key={outcome.id}
        d={`M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`}
        fill="none"
        stroke={isOutcomeSelected ? "blue" : "gray"}
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

// expanded view
const DetailView = ({ node, onClose }) => {
  if (!node) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-2 text-black">{node.title}</h2>
        <p className="mb-4 text-black">{node.content}</p>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

  return (
    <div className="">
 
      <div 
        ref={containerRef}
        className="p-4 overflow-hidden cursor-move pan-area" 
        style={{ width: '100%', height: '600px', position: 'relative' }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute pan-area" 
          style={{ 
            height: '4000px',
            width: '4000px',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {renderNode(treeData)}
        </div>
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

// New page component
const FlowchartPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-4">Flowchart</h1>
      <FlowChart />
    </div>
  );
};

// Change the default export to the new page component
export default FlowchartPage;