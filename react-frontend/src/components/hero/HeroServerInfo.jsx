import React from 'react';
import { ServerIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, UsersIcon, SignalIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const HeroServerInfo = ({ serverStatus, serverStatusLoading, copyServerAddress, copySuccess }) => (
  <div className="flex flex-col gap-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-4 md:p-6">
    <div className="flex items-center gap-2 mb-2">
      <span className="block w-1.5 h-6 rounded bg-minecraft-green shadow-glow"></span>
      <h2 className="px-3 py-1 rounded-lg bg-white/10 font-minecraft text-minecraft-habbo-blue text-base sm:text-lg tracking-wide shadow">
        SERVER INFO
      </h2>
      <div className="flex items-center gap-2 ml-auto bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-3 py-1 shadow">
        <span className={`h-2 w-2 rounded-full ${serverStatus?.online ? 'bg-green-400' : 'bg-red-500'} animate-pulse`}></span>
        <span className={`text-sm ${serverStatus?.online ? 'text-green-400' : 'text-red-400'}`}>
          {serverStatusLoading ? '...' : serverStatus?.online ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>

    <div className="flex flex-col items-center w-full mb-2">
      <div className="flex items-center gap-2 w-full justify-center bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-3 shadow">
        <svg className="w-5 h-5 text-[#4a90e2] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/></svg>
        <span className="font-minecraft text-minecraft-green text-lg tracking-wide select-all truncate">
          play.bizzynation.co.uk
        </span>
      </div>
      <button
        onClick={copyServerAddress}
        className="mt-3 flex items-center gap-2 px-5 py-2 rounded-md bg-minecraft-green text-minecraft-dark font-minecraft font-bold text-base border-2 border-minecraft-green shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-minecraft-green/90 hover:shadow-lg active:scale-95 transition-all text-center tracking-wide"
      >
        {copySuccess ? (
          <ClipboardDocumentCheckIcon className="h-4 w-4 text-minecraft-dark" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4 text-minecraft-dark" />
        )}
        <span>{copySuccess ? "Copied!" : "Copy IP"}</span>
      </button>
    </div>

    <div className="flex flex-row items-center justify-between gap-2 w-full">
      <div className="flex-1 flex flex-col items-center bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-3 shadow min-h-[100px]">
        <CommandLineIcon className="h-5 w-5 text-minecraft-green mb-1" />
        <span className="text-gray-400 text-xs mb-1">Version</span>
        <span className="font-minecraft text-white/90 text-xs text-center leading-tight break-words">
          {serverStatusLoading ? '...' : (serverStatus?.version || '1.7.2-1.21.5')}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-3 shadow min-h-[100px]">
        <UsersIcon className="h-5 w-5 text-minecraft-green mb-1" />
        <span className="text-gray-400 text-xs mb-1">Players</span>
        <span className="font-minecraft text-white/90 text-sm text-center">
          {serverStatusLoading ? '...' : `${serverStatus?.playerCount || 0}/${serverStatus?.maxPlayers || 69}`}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-3 shadow min-h-[100px]">
        <SignalIcon className="h-5 w-5 text-minecraft-green mb-1" />
        <span className="text-gray-400 text-xs mb-1">Ping</span>
        <span className="font-minecraft text-white/90 text-sm text-center">
          {serverStatusLoading ? '...' : `${serverStatus?.ping || '12'}ms`}
        </span>
      </div>
    </div>

    <button
      onClick={copyServerAddress}
      className="w-full mt-4 py-2 bg-minecraft-green text-minecraft-dark font-minecraft font-bold text-base rounded-md border-2 border-minecraft-green shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-minecraft-green/90 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-center tracking-wide"
    >
      <ServerIcon className="h-5 w-5" />
      <span>JOIN SERVER</span>
    </button>

    <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full items-center justify-between">
      <div className="flex flex-col gap-1 bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-2 w-full sm:w-1/2">
        <span className="text-gray-100 text-xs font-semibold">Server Location</span>
        <span className="text-white font-minecraft text-base">London, UK</span>
      </div>
      <div className="flex flex-col gap-1 bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-2 w-full sm:w-1/2">
        <span className="text-gray-100 text-xs font-semibold">Last Updated</span>
        <span className="text-white font-minecraft text-base">Just now</span>
      </div>
    </div>
  </div>
);

export default HeroServerInfo; 