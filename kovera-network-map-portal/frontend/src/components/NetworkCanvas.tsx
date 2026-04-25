/**
 * @file frontend/src/components/NetworkCanvas.tsx
 * @description HTML5 Canvas renderer for the Kovera Network Map.
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useNetworkContext } from '../context/NetworkContext';
import { useCanvas } from '../hooks/useCanvas';
import { Plus, Minus, Maximize, MousePointer2 } from 'lucide-react';

const NetworkCanvas: React.FC = () => {
  const { graphData, selectedNode, setSelectedNode, activeChain, filter, theme, clusters, addressCycles } = useNetworkContext();
  
  const colors = useMemo(() => {
    if (theme === 'light') {
      return {
        bg: '#F5F7FA',
        blue: '#2563EB',
        green: '#059669',
        pink: '#DB2777',
        amber: '#D97706',
        gold: '#B45309',
        text: '#1A1F2E',
        textMuted: '#8B96B8',
        grid: 'rgba(55, 138, 221, 0.12)'
      };
    }
    return {
      bg: '#0A0F1E',
      blue: '#378ADD',
      green: '#22C98A',
      pink: '#D4537E',
      amber: '#BA7517',
      gold: '#D4A017',
      text: '#E8EBF4',
      textMuted: '#4D5A7C',
      grid: 'rgba(99, 130, 255, 0.04)'
    };
  }, [theme]);

  const [hoveredNode, setHoveredNode] = React.useState<any>(null);

  const { 
    canvasRef, 
    viewState, 
    handleMouseDown, 
    handleMouseMove: handleCanvasMove, 
    handleMouseUp, 
    handleWheel,
    screenToWorld,
    zoomIn,
    zoomOut,
    resetView
  } = useCanvas();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleCanvasMove(e);
    
    // Hit Detection for Hover
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const hit = graphData?.nodes?.find(n => {
      const dx = n.x - worldPos.x;
      const dy = n.y - worldPos.y;
      const collisionRadius = 15; // Slightly larger for easier hit
      return Math.sqrt(dx * dx + dy * dy) < collisionRadius;
    });
    
    if (hit?.id !== hoveredNode?.id) {
      setHoveredNode(hit || null);
    }
  }, [handleCanvasMove, screenToWorld, graphData, hoveredNode]);

  const animationRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  // Build sets for cluster/cycle node IDs
  const clusterNodeIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.forEach(c => {
      ids.add(c.targetNodeId);
      c.likers?.forEach((l: string) => ids.add(l));
    });
    return ids;
  }, [clusters]);

  const cycleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    addressCycles.forEach(c => {
      c.nodeIds?.forEach((id: string) => ids.add(id));
    });
    return ids;
  }, [addressCycles]);

  // Filtered Data
  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes) return [];
    if (filter === 'All') return graphData.nodes;
    if (filter === 'User Homes') return graphData.nodes.filter(n => n.type === 'user_home');
    if (filter === 'Seeded Listings') return graphData.nodes.filter(n => n.type === 'seeded_listing');
    if (filter === 'Dream Homes') return graphData.nodes.filter(n => n.type === 'dream_address');
    if (filter === 'Pure Buyers') return graphData.nodes.filter(n => n.type === 'pure_buyer');
    if (filter === 'Chains') return graphData.nodes.filter(n => {
      return graphData.chains?.some(c => c.path?.includes(n.id));
    });
    if (filter === 'Clusters') return graphData.nodes.filter(n => clusterNodeIds.has(n.id));
    if (filter === 'Address Cycles') return graphData.nodes.filter(n => cycleNodeIds.has(n.id));
    return graphData.nodes;
  }, [graphData, filter, clusterNodeIds, cycleNodeIds]);

  const filteredEdges = useMemo(() => {
    if (!graphData?.edges) return [];
    // Only show edges between filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return graphData.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [graphData, filteredNodes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Dot Grid
    ctx.save();
    ctx.translate(viewState.offset.x % (40 * viewState.scale), viewState.offset.y % (40 * viewState.scale));
    ctx.fillStyle = colors.grid;
    for (let i = -40; i < canvas.width + 40; i += 40 * viewState.scale) {
      for (let j = -40; j < canvas.height + 40; j += 40 * viewState.scale) {
        ctx.beginPath();
        ctx.arc(i, j, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Apply View Transform
    ctx.save();
    ctx.translate(viewState.offset.x, viewState.offset.y);
    ctx.scale(viewState.scale, viewState.scale);

    // Focus Logic
    const focusedId = selectedNode?.id || hoveredNode?.id;
    const connectedEdges = focusedId ? filteredEdges.filter(e => e.source === focusedId || e.target === focusedId) : [];
    const connectedNodeIds = new Set([
      ...(focusedId ? [focusedId] : []),
      ...connectedEdges.map(e => e.source === focusedId ? e.target : e.source)
    ]);

    // Draw Edges (Pass 1: Secondary/Background)
    filteredEdges.forEach(edge => {
      const isFocused = (focusedId && (edge.source === focusedId || edge.target === focusedId)) ||
                       (activeChain && activeChain.path.includes(edge.source) && activeChain.path.includes(edge.target));
      
      if (isFocused) return; // Skip focused edges for now

      const source = graphData.nodes.find(n => n.id === edge.source);
      const target = graphData.nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const cpX = midX + (target.y - source.y) * 0.18;
      const cpY = midY - (target.x - source.x) * 0.18;
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);

      ctx.strokeStyle = edge.type === 'DREAM' ? colors.pink : colors.blue;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = focusedId ? 0.05 : 0.15;
      if (edge.type === 'DREAM') ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Edges (Pass 2: Global/Ready Chains)
    filteredEdges.forEach(edge => {
      const isFocusedChainEdge = activeChain && 
        activeChain.path.indexOf(edge.source) !== -1 && 
        activeChain.path.indexOf(edge.target) === activeChain.path.indexOf(edge.source) + 1;

      const isAnyReadyChainEdge = graphData.chains?.some((c: any) => 
        c.isReady && 
        c.path.indexOf(edge.source) !== -1 && 
        c.path.indexOf(edge.target) === c.path.indexOf(edge.source) + 1
      );

      if (!isFocusedChainEdge && !isAnyReadyChainEdge) return;

      const source = graphData.nodes.find(n => n.id === edge.source);
      const target = graphData.nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const cpX = midX + (target.y - source.y) * 0.18;
      const cpY = midY - (target.x - source.x) * 0.18;
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);

      if (isFocusedChainEdge) {
        ctx.strokeStyle = colors.amber;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 1;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -offsetRef.current * 1.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.amber;
      } else {
        ctx.strokeStyle = colors.amber;
        ctx.lineWidth = 2;
        ctx.globalAlpha = focusedId && !connectedNodeIds.has(edge.source) ? 0.2 : 0.6;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    });

    // Draw Edges (Pass 3: Direct User Selection/Hover Focus)
    if (focusedId) {
      connectedEdges.forEach(edge => {
        const source = graphData.nodes.find(n => n.id === edge.source);
        const target = graphData.nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const cpX = midX + (target.y - source.y) * 0.18;
        const cpY = midY - (target.x - source.x) * 0.18;
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);

        ctx.strokeStyle = edge.type === 'DREAM' ? colors.pink : colors.blue;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.strokeStyle as string;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }

    // Draw Nodes
    filteredNodes.forEach(node => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isFocused = isSelected || isHovered;
      const isInNeighborhood = focusedId ? connectedNodeIds.has(node.id) : true;
      const isChainActive = activeChain && activeChain.path.includes(node.id);
      
      const baseRadius = 8;
      let radius = baseRadius + (node.incomeCount || 0) * 1.5;
      if (node.type === 'dream_address') {
        radius = node.dreamHomeSource === 'dream_anchor' ? 11 : 7;
      }
      if (isFocused) radius *= 1.2;

      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.globalAlpha = (focusedId && !isInNeighborhood) ? 0.15 : 1;

      // Pulse for active entities
      if (isChainActive || isFocused) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 4 + Math.sin(offsetRef.current * 0.1) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = isChainActive ? colors.amber : colors.blue;
        ctx.lineWidth = 1;
        ctx.globalAlpha *= 0.4;
        ctx.stroke();
        ctx.globalAlpha /= 0.4;
      }

      // Node Shape
      ctx.beginPath();
      if (node.type === 'user_home' || node.type === 'seeded_listing') {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
      } else if (node.type === 'dream_address') {
        ctx.rotate(Math.PI / 4);
        ctx.rect(-radius, -radius, radius * 2, radius * 2);
      } else if (node.type === 'pure_buyer') {
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          ctx.lineTo(radius * 1.2 * Math.cos(angle), radius * 1.2 * Math.sin(angle));
        }
        ctx.closePath();
      }

      const color = colors[node.type === 'user_home' ? 'blue' : node.type === 'seeded_listing' ? 'green' : node.type === 'dream_address' ? 'pink' : 'amber'];
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = (theme === 'dark' && !isFocused) ? 'rgba(255,255,255,0.2)' : color;
      ctx.lineWidth = isFocused ? 2.5 : 1;
      ctx.stroke();

      // Labels: Semantic Zoom
      const showLabel = isFocused || (viewState.scale > 0.8) || (viewState.scale > 0.4 && node.type === 'user_home');
      if (showLabel) {
        ctx.fillStyle = isFocused ? colors.text : colors.textMuted;
        ctx.font = `${isFocused ? 'bold' : ''} 10px ${theme === 'light' ? 'Inter, sans-serif' : 'Courier New'}`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, 0, radius + 15);
      }

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });

    ctx.restore();
  }, [graphData, filteredNodes, filteredEdges, selectedNode, activeChain, viewState, canvasRef, colors, theme, hoveredNode, clusterNodeIds, cycleNodeIds]);

  // Main Draw Loop
  useEffect(() => {
    const loop = () => {
      offsetRef.current += 0.5;
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    // Simple hit detection
    const hitNode = filteredNodes.find(node => {
      const dist = Math.hypot(node.x - worldPos.x, node.y - worldPos.y);
      return dist < 20; // Hit radius
    });

    setSelectedNode(hitNode || null);
  };

  return (
    <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden canvas-grid">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full"
      />

      {/* Hardware-Style Instrument Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-40 items-end">
        <div className="flex flex-col bg-panel/30 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/20 group">
          <button 
            onClick={zoomIn}
            className="p-4 hover:bg-white/5 text-text/40 hover:text-blue-node transition-all active:scale-90"
            title="Increase Resolution (Zoom In)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="mx-3 h-[1px] bg-white/5" />
          <button 
            onClick={zoomOut}
            className="p-4 hover:bg-white/5 text-text/40 hover:text-blue-node transition-all active:scale-90"
            title="Decrease Resolution (Zoom Out)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="mx-3 h-[1px] bg-white/5" />
          <button 
            onClick={resetView}
            className="p-4 hover:bg-white/5 text-text/40 hover:text-white transition-all active:scale-90"
            title="Recenter Coordinate Map"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Scale Synchronizer */}
        <div className="px-4 py-2.5 bg-panel/30 backdrop-blur-2xl border border-white/5 rounded-full text-[9px] font-bold text-text/40 mono uppercase tracking-[0.25em] text-center shadow-2xl flex items-center gap-3 ring-1 ring-black/20">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-2 h-2 rounded-full bg-blue-node/40 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-blue-node" />
          </div>
          <span className="opacity-80">Zoom Factor:</span>
          <span className="text-text tracking-normal font-black">{Math.round(viewState.scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkCanvas;
