import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, Key, ShieldCheck, Server, AlertCircle } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../data/supabaseSchema';
import { isSupabaseConfigured } from '../lib/supabase';

export function SupabaseSetupGuide() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Supabase Connection & SQL Setup Guide</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Follow these instructions to connect Haashiya Air Travels CRM with your Supabase Postgres database.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isSupabaseConfigured
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo / Standalone Mode'}</span>
          </span>
        </div>
      </div>

      {/* Step 1: Env Vars */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <Key className="w-4 h-4 text-sky-600" />
          <span>1. Environment Variables Configuration</span>
        </div>
        <p className="text-xs text-slate-600">
          Add the following environment variables in your deployment setup or <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-slate-800">.env</code> file:
        </p>
        <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
          <div><span className="text-sky-400">VITE_SUPABASE_URL</span>=hhttps://cbzbhtcffazkgfmfwffm.supabase.co</div>
          <div><span className="text-sky-400">VITE_SUPABASE_ANON_KEY</span>=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiemJodGNmZmF6a2dmbWZ3ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NzUxMzksImV4cCI6MjEwMjI1MTEzOX0.qSbw_Kf36vWu7F6iNDbxSScauoeJIieX4oqtc7W71DQ</div>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          Note: Do NOT include your <code className="font-mono">service_role</code> key in frontend code. Use <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </div>

      {/* Step 2: SQL Schema */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Terminal className="w-4 h-4 text-sky-600" />
            <span>2. Run Database DDL Script in Supabase SQL Editor (Includes Required RLS Fix)</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-600" />
                <span>Copy Entire SQL Schema</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Copy the SQL script below, open your Supabase Dashboard → <span className="font-semibold text-slate-800">SQL Editor</span>, paste the code, and click <span className="font-semibold text-slate-800">Run</span>:
        </p>

        <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto leading-relaxed border border-slate-800 select-all">
          <pre>{SUPABASE_SQL_SCHEMA}</pre>
        </div>
      </div>

      {/* Step 3: Security & RLS Explanation */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>3. Security & Row Level Security (RLS) Features</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">Admin Role</div>
            <p className="text-slate-600 text-[11px]">Can create, view, update, soft-delete, restore, and permanently purge any CRM record.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">Manager Role</div>
            <p className="text-slate-600 text-[11px]">Can create, view, and update all records across all agents; cannot permanently purge records.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">Agent Role</div>
            <p className="text-slate-600 text-[11px]">Can create and manage records assigned to their own AGT code account; cannot delete items.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
