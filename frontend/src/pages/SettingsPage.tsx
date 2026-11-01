import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Network,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { api, getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, PRODUCTION_API_URL } from '../api/client';
import { SystemHealth } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setTestError(null);
    try {
      setApiBaseUrl(apiUrl);
      const [h, db] = await Promise.all([api.getHealth(), api.getDbStatus()]);
      setHealth(h);
      setDbStatus(db);
      toast.success('Successfully connected to HostelOS FastAPI Backend');
    } catch (err: any) {
      setHealth(null);
      setDbStatus(null);
      setTestError(err.message || 'Connection failed');
      toast.error('Failed to connect to backend endpoint');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    testConnection();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            System & Database Settings
          </h2>
          <Badge variant="neutral" size="sm">
            Configuration
          </Badge>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Configure FastAPI endpoint, examine BCNF table records, and inspect Neo4j Graph database connections.
        </p>
      </div>

      {/* Backend API Configuration */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-content-primary flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-brand-blue" />
          Backend Service Endpoint
        </h3>
        <p className="text-xs text-content-secondary mb-4">
          Base URL for the Python FastAPI server powering HostelOS.
        </p>

        <form onSubmit={handleSaveUrl} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            required
            placeholder={PRODUCTION_API_URL}
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="flex-1 min-w-[260px] px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button type="submit" size="sm" isLoading={isTesting} icon={<Save className="w-3.5 h-3.5" />}>
            Test & Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetApiBaseUrl();
              setApiUrl(PRODUCTION_API_URL);
              setApiBaseUrl(PRODUCTION_API_URL);
              testConnection();
            }}
          >
            Reset Default
          </Button>
        </form>

        {testError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{testError}</span>
          </div>
        )}

        {health && (
          <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Backend Connection Verified
              </span>
              <Badge variant="success" size="sm">
                v{health.version}
              </Badge>
            </div>
            <div className="text-[11px] text-emerald-800 grid grid-cols-2 gap-1 pt-1">
              <div>Service: {health.service}</div>
              <div>Database: {health.database}</div>
              <div>Neo4j Mode: {health.neo4j.mode}</div>
              <div>Active Student Records: {health.active_records}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Database Schema Diagnostics (BCNF 15 Relations) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              BACSE202 DA3 Relational Schema Table Counts
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Live record counts across all 15 BCNF normalized tables in SQLite
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-count
          </Button>
        </div>

        {dbStatus?.tables ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(dbStatus.tables).map(([table, count]: [string, any]) => (
              <div
                key={table}
                className="p-3 bg-slate-50 border border-surface-border rounded-xl flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-content-primary">{table}</span>
                <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Connect to backend to inspect schema tables.</p>
        )}
      </Card>

      {/* Neo4j Bolt Driver Connection Info */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-content-primary flex items-center gap-2 mb-1">
          <Network className="w-4 h-4 text-purple-600" />
          Neo4j Graph Database Integration
        </h3>
        <p className="text-xs text-content-secondary mb-4">
          Direct Bolt graph driver integration settings (accessed exclusively via backend API).
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-surface-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Default Bolt URI:</span>
            <span className="font-mono font-semibold text-content-primary">
              bolt://localhost:7687
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Driver Status:</span>
            <Badge variant={health?.neo4j?.connected ? 'success' : 'sage'} size="sm">
              {health?.neo4j?.connected ? 'Neo4j Live Connected' : 'Relational Graph Engine Active'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            Note: If Neo4j Desktop or Docker is started on port 7687, the backend automatically transitions to live Cypher execution without modifying the frontend.
          </div>
        </div>
      </Card>
    </div>
  );
};
