import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Search,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Info,
  CheckCircle2,
  Layers,
  Building,
  KeyRound,
  User,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import { api } from '../api/client';
import { GraphData, GraphNode, GraphLink } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

export const RelationshipExplorerPage: React.FC = () => {
  const toast = useToast();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction states
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getGraph();
      // Compute force-directed or circular positions for nodes
      const positioned = layoutNodes(data.nodes, data.links);
      setGraphData({ ...data, nodes: positioned });
    } catch (err: any) {
      setError(err.message || 'Failed to load graph relationships from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Simple layout algorithm positioning nodes by category clusters
  const layoutNodes = (nodes: GraphNode[], links: GraphLink[]): GraphNode[] => {
    const width = 1000;
    const height = 650;
    const centerX = width / 2;
    const centerY = height / 2;

    const clusters: Record<string, { x: number; y: number; count: number; radius: number }> = {
      Hostel: { x: centerX, y: centerY - 160, count: 0, radius: 100 },
      Block: { x: centerX - 240, y: centerY - 100, count: 0, radius: 110 },
      Room: { x: centerX - 180, y: centerY + 100, count: 0, radius: 180 },
      Student: { x: centerX + 180, y: centerY + 60, count: 0, radius: 200 },
      Payment: { x: centerX + 260, y: centerY + 220, count: 0, radius: 150 },
      Complaint: { x: centerX - 60, y: centerY + 240, count: 0, radius: 130 },
      Staff: { x: centerX - 280, y: centerY - 20, count: 0, radius: 110 },
      Warden: { x: centerX + 160, y: centerY - 220, count: 0, radius: 90 },
    };

    return nodes.map((node) => {
      const cluster = clusters[node.label] || { x: centerX, y: centerY, count: 0, radius: 150 };
      const idx = cluster.count++;
      const angle = (idx * 0.8) + (node.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 6);
      const r = 40 + (idx * 16) % cluster.radius;

      return {
        ...node,
        x: cluster.x + Math.cos(angle) * r,
        y: cluster.y + Math.sin(angle) * r,
      };
    });
  };

  // Node color mapping by label
  const getNodeColor = (label: string): { bg: string; stroke: string; text: string } => {
    switch (label) {
      case 'Hostel':
        return { bg: '#17243A', stroke: '#0F172A', text: '#FFFFFF' };
      case 'Block':
        return { bg: '#78977C', stroke: '#58735C', text: '#FFFFFF' };
      case 'Room':
        return { bg: '#3978F6', stroke: '#1E40AF', text: '#FFFFFF' };
      case 'Student':
        return { bg: '#10B981', stroke: '#047857', text: '#FFFFFF' };
      case 'Payment':
        return { bg: '#F59E0B', stroke: '#D97706', text: '#FFFFFF' };
      case 'Complaint':
        return { bg: '#EF4444', stroke: '#B91C1C', text: '#FFFFFF' };
      case 'Staff':
        return { bg: '#8B5CF6', stroke: '#6D28D9', text: '#FFFFFF' };
      case 'Warden':
        return { bg: '#EC4899', stroke: '#BE185D', text: '#FFFFFF' };
      default:
        return { bg: '#64748B', stroke: '#475569', text: '#FFFFFF' };
    }
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as any).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Connected nodes lookup
  const connectedIds = new Set<string>();
  const activeNode = selectedNode || hoveredNode;
  if (activeNode && graphData) {
    connectedIds.add(activeNode.id);
    graphData.links.forEach((l) => {
      if (l.source === activeNode.id) connectedIds.add(l.target);
      if (l.target === activeNode.id) connectedIds.add(l.source);
    });
  }

  // Filter nodes based on selected type
  const visibleNodes = (graphData?.nodes || []).filter((n) => {
    if (selectedTypeFilter !== 'All' && n.label !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.name.toLowerCase().includes(q) || n.label.toLowerCase().includes(q);
    }
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleLinks = (graphData?.links || []).filter((l) => {
    return visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Neo4j Graph Relationship Explorer
            </h2>
            <Badge variant="info" size="sm">
              Live Graph Model
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Visualizes college student residence graphs, room allocations, block hierarchies, and payment links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="sage" size="md">
            <Database className="w-3.5 h-3.5 mr-1" />
            {graphData?.engine || 'Graph Engine'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGraph}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-sync Graph
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Find entity by name, room number, or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Node Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Hostel', 'Block', 'Room', 'Student', 'Payment', 'Complaint', 'Staff', 'Warden'].map(
              (label) => {
                const color = label === 'All' ? null : getNodeColor(label);
                return (
                  <button
                    key={label}
                    onClick={() => setSelectedTypeFilter(label)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      selectedTypeFilter === label
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {color && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color.bg }}
                      />
                    )}
                    {label}
                  </button>
                );
              }
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-surface-border rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded hover:bg-white text-slate-600"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 rounded hover:bg-white text-slate-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 rounded hover:bg-white text-slate-600"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Main Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph SVG Canvas */}
        <Card className="lg:col-span-3 p-0 overflow-hidden relative bg-white border border-surface-border h-[620px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Traversing Neo4j database relations...
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Network className="w-12 h-12 text-rose-400 mb-2" />
              <p className="text-sm font-semibold text-slate-800">{error}</p>
              <Button size="sm" onClick={fetchGraph} className="mt-3">
                Retry
              </Button>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Links / Relationships */}
                {visibleLinks.map((link) => {
                  const sourceNode = graphData?.nodes.find((n) => n.id === link.source);
                  const targetNode = graphData?.nodes.find((n) => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;

                  const isHighlighted =
                    connectedIds.has(link.source) && connectedIds.has(link.target);
                  const isDimmed = activeNode && !isHighlighted;

                  const midX = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
                  const midY = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;

                  return (
                    <g key={link.id} className="transition-opacity duration-300">
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isHighlighted ? '#3978F6' : '#CBD5E1'}
                        strokeWidth={isHighlighted ? 2.5 : 1.2}
                        strokeDasharray={link.type === 'MADE' ? '4 4' : undefined}
                        opacity={isDimmed ? 0.15 : 0.8}
                        markerEnd="url(#arrow)"
                      />
                      {/* Edge Label */}
                      <text
                        x={midX}
                        y={midY}
                        fill={isHighlighted ? '#1E40AF' : '#64748B'}
                        fontSize="8"
                        textAnchor="middle"
                        dy="-3"
                        className="font-mono font-semibold pointer-events-none select-none"
                        opacity={isDimmed ? 0.1 : 0.85}
                      >
                        {link.type}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = connectedIds.has(node.id);
                  const isDimmed = activeNode && !isConnected;
                  const colors = getNodeColor(node.label);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="cursor-pointer transition-all duration-300"
                      opacity={isDimmed ? 0.2 : 1}
                    >
                      <circle
                        r={isSelected ? 20 : 15}
                        fill={colors.bg}
                        stroke={isSelected ? '#3978F6' : colors.stroke}
                        strokeWidth={isSelected ? 3.5 : 1.5}
                        className="shadow-sm"
                      />

                      {/* Icon or Label Initial */}
                      <text
                        fill={colors.text}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        dy="3.5"
                        className="pointer-events-none select-none font-sans"
                      >
                        {node.label.charAt(0)}
                      </text>

                      {/* Node Text Label */}
                      <text
                        y={26}
                        fill="#1E293B"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                      >
                        {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                      </text>

                      <text
                        y={36}
                        fill="#64748B"
                        fontSize="7"
                        textAnchor="middle"
                        className="pointer-events-none select-none font-mono uppercase"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Graph Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-surface-border shadow-xs text-[10px] text-content-secondary space-y-1">
            <div className="font-semibold text-content-primary mb-1">
              Nodes: {visibleNodes.length} • Edges: {visibleLinks.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Student
              <span className="w-2 h-2 rounded-full bg-brand-blue" /> Room
              <span className="w-2 h-2 rounded-full bg-navy-800" /> Hostel
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Payment
            </div>
          </div>
        </Card>

        {/* Selected Entity Inspector Side Panel */}
        <Card className="p-5 flex flex-col justify-between h-[620px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-sm font-bold text-content-primary">
                Graph Node Inspector
              </h3>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-brand-blue hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <Badge variant="sage" size="sm">
                    {selectedNode.label} Node
                  </Badge>
                  <h4 className="text-base font-bold text-content-primary mt-1.5">
                    {selectedNode.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedNode.id}
                  </span>
                </div>

                {/* Node Properties */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Node Properties
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                    {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-semibold text-content-primary truncate">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Relationships */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Connected Relationships
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-1.5">
                    {graphData?.links
                      .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                      .map((l) => {
                        const isOutgoing = l.source === selectedNode.id;
                        const otherId = isOutgoing ? l.target : l.source;
                        const otherNode = graphData.nodes.find((n) => n.id === otherId);
                        return (
                          <div
                            key={l.id}
                            onClick={() => otherNode && setSelectedNode(otherNode)}
                            className="p-2 bg-white hover:bg-blue-50 border border-surface-border rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <span className="font-semibold text-brand-blue text-[11px]">
                              {isOutgoing ? `→ ${l.type}` : `← ${l.type}`}
                            </span>
                            <span className="text-[11px] text-content-primary truncate max-w-[130px]">
                              {otherNode?.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-content-secondary space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-content-primary">No node selected</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Click any Student, Room, Hostel, or Payment node on the graph canvas to inspect its connected graph properties.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-surface-border text-[11px] text-slate-400">
            Powered by Neo4j & BACSE202 DA3 Knowledge Model
          </div>
        </Card>
      </div>
    </div>
  );
};
