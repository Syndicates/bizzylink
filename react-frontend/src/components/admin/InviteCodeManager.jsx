import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const InviteCodeManager = () => {
  const [inviteCodes, setInviteCodes] = useState([]);
  const [betaMode, setBetaMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCode, setNewCode] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchInviteCodes();
    checkBetaMode();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      const res = await api.get('/api/invite');
      setInviteCodes(res.data.invites);
    } catch (err) {
      setError('Failed to fetch invite codes');
    } finally {
      setLoading(false);
    }
  };

  const checkBetaMode = async () => {
    try {
      const res = await api.get('/api/invite/mode');
      setBetaMode(res.data.enabled);
    } catch (err) {
      setError('Failed to check beta mode status');
    }
  };

  const toggleBetaMode = async () => {
    try {
      await api.post('/api/invite/toggle', { enabled: !betaMode });
      setBetaMode(!betaMode);
    } catch (err) {
      setError('Failed to toggle beta mode');
    }
  };

  const generateCode = async () => {
    try {
      const res = await api.post('/api/invite/generate');
      setNewCode(res.data.invite.code);
      fetchInviteCodes();
    } catch (err) {
      setError('Failed to generate invite code');
    }
  };

  const revokeCode = async (code) => {
    try {
      await api.post(`/api/invite/${code}/revoke`);
      fetchInviteCodes();
    } catch (err) {
      setError('Failed to revoke invite code');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 shadow-lg border border-[#333]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-minecraft text-white">BETA Invite System</h2>
        <button
          onClick={toggleBetaMode}
          className={`px-4 py-2 rounded font-minecraft ${
            betaMode
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white transition-colors`}
        >
          {betaMode ? 'Disable BETA Mode' : 'Enable BETA Mode'}
        </button>
      </div>

      {newCode && (
        <div className="mb-6 p-4 bg-[#2d2d2d] rounded border border-[#4a4a4a]">
          <h3 className="text-lg font-minecraft text-green-400 mb-2">New Invite Code Generated!</h3>
          <div className="flex items-center gap-2">
            <code className="bg-[#1a1a1a] px-3 py-2 rounded font-mono text-white">{newCode}</code>
            <button
              onClick={() => navigator.clipboard.writeText(newCode)}
              className="px-3 py-2 bg-[#333] hover:bg-[#444] rounded text-white transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={generateCode}
          className="px-4 py-2 bg-[#4a90e2] hover:bg-[#357abd] rounded font-minecraft text-white transition-colors"
        >
          Generate New Code
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-minecraft text-white mb-4">Active Invite Codes</h3>
        {inviteCodes.length === 0 ? (
          <p className="text-gray-400">No active invite codes</p>
        ) : (
          inviteCodes.map((invite) => (
            <div
              key={invite.code}
              className="bg-[#2d2d2d] p-4 rounded border border-[#4a4a4a] flex justify-between items-center"
            >
              <div>
                <code className="text-white font-mono">{invite.code}</code>
                <div className="text-sm text-gray-400 mt-1">
                  Created: {new Date(invite.createdAt).toLocaleDateString()}
                  {invite.expiresAt && (
                    <span className="ml-2">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {invite.used && (
                  <div className="text-sm text-gray-400">
                    Used by: {invite.usedBy?.username || 'Unknown'}
                  </div>
                )}
              </div>
              {!invite.used && !invite.revoked && (
                <button
                  onClick={() => revokeCode(invite.code)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InviteCodeManager; 