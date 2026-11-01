import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { GraphData, GraphNode, GraphLink } from '../types';

export const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
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
      const positioned = layoutNodes(data.nodes, data.links);
      setGraphData({ ...data, nodes: positioned });
    } catch (err: any) {
      setError(err.message || 'Failed to load graph relationships from Neo4j');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Simple layout algorithm positioning nodes by category
  const layoutNodes = (nodes: GraphNode[], _links: GraphLink[]): GraphNode[] => {
    const width = 900;
    const height = 550;
    const cx = width / 2;
    const cy = height / 2;

    const clusters: Record<string, { x: number; y: number; count: number; radius: number }> = {
      Hostel: { x: cx, y: cy - 140, count: 0, radius: 80 },
      Block: { x: cx - 220, y: cy - 70, count: 0, radius: 90 },
      Room: { x: cx - 140, y: cy + 100, count: 0, radius: 140 },
      Student: { x: cx + 180, y: cy + 60, count: 0, radius: 170 },
      Payment: { x: cx + 240, y: cy + 180, count: 0, radius: 110 },
      Complaint: { x: cx - 50, y: cy + 190, count: 0, radius: 100 },
      Staff: { x: cx - 240, y: cy + 20, count: 0, radius: 80 },
      Warden: { x: cx + 160, y: cy - 160, count: 0, radius: 70 },
      EmergencyContact: { x: cx + 280, y: cy - 40, count: 0, radius: 80 },
      MaintenanceRequest: { x: cx - 260, y: cy + 160, count: 0, radius: 80 },
      Visitor: { x: cx - 80, y: cy - 180, count: 0, radius: 70 },
    };

    return nodes.map((node) => {
      const cluster = clusters[node.label] || { x: cx, y: cy, count: 0, radius: 120 };
      const idx = cluster.count++;
      const angle = (idx * 0.9) + (node.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5);
      const r = 35 + (idx * 14) % cluster.radius;

      return {
        ...node,
        x: cluster.x + Math.cos(angle) * r,
        y: cluster.y + Math.sin(angle) * r,
      };
    });
  };

  const getNodeColor = (label: string): { bg: string; border: string } => {
    switch (label) {
      case 'Hostel':
        return { bg: '#1E3A8A', border: '#172554' }; // dark blue
      case 'Block':
        return { bg: '#0D9488', border: '#115E59' }; // teal
      case 'Room':
        return { bg: '#2563EB', border: '#1D4ED8' }; // blue
      case 'Student':
        return { bg: '#16A34A', border: '#15803D' }; // green
      case 'Payment':
        return { bg: '#D97706', border: '#B45309' }; // amber
      case 'Complaint':
        return { bg: '#DC2626', border: '#B91C1C' }; // red
      case 'Staff':
        return { bg: '#7C3AED', border: '#6D28D9' }; // purple
      case 'Warden':
        return { bg: '#DB2777', border: '#BE185D' }; // pink
      default:
        return { bg: '#4B5563', border: '#374151' }; // gray
    }
  };

  const getNodeTitle = (node: GraphNode): string => {
    const p = node.properties || {};
    return p.name || p.student_name || p.room_no || p.hostel_name || p.block_name || node.id;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Filter nodes & links
  const filteredNodes = (graphData?.nodes || []).filter((n) => {
    const matchesType = typeFilter === 'All' || n.label === typeFilter;
    const title = getNodeTitle(n).toLowerCase();
    const id = n.id.toLowerCase();
    const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const nodeMap = new Map((graphData?.nodes || []).map((n) => [n.id, n]));

  // Connected links for selected node
  const selectedLinks = selectedNode
    ? (graphData?.links || []).filter(
        (l) => l.source === selectedNode.id || l.target === selectedNode.id
      )
    : [];

  const availableLabels = Array.from(
    new Set((graphData?.nodes || []).map((n) => n.label))
  ).sort();

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Neo4j Graph View</h1>
          <p className="text-xs text-gray-500">
            Interactive property graph of college hostel entities and relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 bg-gray-100 border border-gray-300 px-2 py-1 rounded font-mono">
            {graphData?.nodes.length ?? 0} Nodes • {graphData?.links.length ?? 0} Relationships
          </span>
          <button
            onClick={fetchGraph}
            className="px-3 py-1 bg-white border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-50"
          >
            Refresh Graph
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded">
          {error}
        </div>
      )}

      {/* Filter and Controls Toolbar */}
      <div className="p-2.5 bg-white border border-gray-300 rounded flex flex-wrap gap-2 items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium">Filter Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded bg-white text-xs"
          >
            <option value="All">All Types ({graphData?.nodes.length ?? 0})</option>
            {availableLabels.map((lbl) => (
              <option key={lbl} value={lbl}>
                {lbl}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search node..."
            className="px-2 py-1 border border-gray-300 rounded text-xs w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Zoom +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Zoom -
          </button>
          <button
            onClick={resetView}
            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Canvas and Inspector Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* SVG Graph Canvas */}
        <div className="lg:col-span-3 bg-white border border-gray-300 rounded overflow-hidden relative">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center text-xs text-gray-500">
              Querying Neo4j Cypher graph topology...
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-[520px] bg-slate-50 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 -5 10 10"
                  refX="18"
                  refY="0"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill="#94A3B8" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 -5 10 10"
                  refX="18"
                  refY="0"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,-5L10,0L0,5" fill="#2563EB" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {(graphData?.links || []).map((link, idx) => {
                  const s = nodeMap.get(link.source);
                  const t = nodeMap.get(link.target);
                  if (
                    !s ||
                    !t ||
                    s.x === undefined ||
                    t.x === undefined ||
                    s.y === undefined ||
                    t.y === undefined
                  )
                    return null;

                  const isConnected =
                    selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);

                  return (
                    <g key={`link-${idx}`}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isConnected ? '#2563EB' : '#CBD5E1'}
                        strokeWidth={isConnected ? 2 : 1}
                        markerEnd={isConnected ? 'url(#arrow-active)' : 'url(#arrow)'}
                      />
                      {isConnected && (
                        <text
                          x={(s.x + t.x) / 2}
                          y={(s.y + t.y) / 2 - 4}
                          textAnchor="middle"
                          className="text-[9px] fill-blue-700 font-mono font-medium"
                        >
                          {link.type}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  if (node.x === undefined || node.y === undefined) return null;
                  const isSelected = selectedNode?.id === node.id;
                  const color = getNodeColor(node.label);
                  const title = getNodeTitle(node);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        r={isSelected ? 16 : 12}
                        fill={color.bg}
                        stroke={isSelected ? '#000000' : color.border}
                        strokeWidth={isSelected ? 2.5 : 1}
                      />
                      <text
                        y={24}
                        textAnchor="middle"
                        className={`text-[10px] select-none ${
                          isSelected ? 'font-bold fill-blue-800' : 'fill-gray-700'
                        }`}
                      >
                        {title.length > 14 ? `${title.slice(0, 12)}…` : title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Canvas Help Badge */}
          <div className="absolute bottom-2 left-2 bg-white/90 border border-gray-300 px-2 py-1 rounded text-[11px] text-gray-500">
            Click a node to inspect properties • Drag canvas to pan
          </div>
        </div>

        {/* Node Properties Inspector */}
        <div className="bg-white border border-gray-300 rounded p-3 space-y-3">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1.5">
            Node Inspector
          </h2>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Label</span>
                <div className="font-bold text-gray-900">{selectedNode.label}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Node ID</span>
                <div className="font-mono text-gray-700 break-all">{selectedNode.id}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Properties</span>
                <div className="mt-1 bg-gray-50 border border-gray-200 rounded p-2 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-1 border-b border-gray-100 pb-0.5">
                      <span className="text-gray-500">{k}:</span>
                      <span className="text-gray-800 font-semibold truncate max-w-[140px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(selectedNode.properties || {}).length === 0 && (
                    <span className="text-gray-400 italic">No extra properties</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  Connected Edges ({selectedLinks.length})
                </span>
                <div className="mt-1 space-y-1 max-h-36 overflow-y-auto text-[11px]">
                  {selectedLinks.map((l, i) => (
                    <div
                      key={i}
                      className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-700"
                    >
                      <span className="font-medium text-blue-700">{l.type}</span>
                      <div className="text-[10px] text-gray-500 truncate">
                        {l.source === selectedNode.id ? `→ ${l.target}` : `← ${l.source}`}
                      </div>
                    </div>
                  ))}
                  {selectedLinks.length === 0 && (
                    <div className="text-gray-400 italic text-[11px]">No relationships found</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full mt-2 px-2 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs">
              Select any node in the graph view to inspect its properties and relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GraphPage;
