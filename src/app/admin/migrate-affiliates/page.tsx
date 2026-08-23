'use client';

import { useState } from 'react';

export default function MigrateAffiliatesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Erro na migração');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os registros de afiliados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setResetLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-affiliate-codes/reset', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-secret',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Registros de afiliados apagados com sucesso!');
      } else {
        setError(data.error || 'Erro ao apagar registros');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Migração de Códigos de Afiliados</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Esta página atualiza os códigos de afiliados existentes do formato numérico (6 dígitos) 
            para o novo formato baseado no nome do usuário.
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={handleMigrate}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Migrando...' : 'Iniciar Migração'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={resetLoading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {resetLoading ? 'Apagando...' : 'Apagar Registros'}
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            ⚠️ Apagar registros irá remover todos os afiliados do banco de dados.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-800">Migração Concluída!</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded">
                <p className="text-2xl font-bold text-blue-600">{result.stats.total}</p>
                <p className="text-gray-600">Total</p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-2xl font-bold text-green-600">{result.stats.updated}</p>
                <p className="text-gray-600">Atualizados</p>
              </div>
              <div className="bg-white p-4 rounded">
                <p className="text-2xl font-bold text-gray-600">{result.stats.skipped}</p>
                <p className="text-gray-600">Pulados</p>
              </div>
            </div>

            <h3 className="font-bold mb-2">Detalhes:</h3>
            <div className="max-h-64 overflow-y-auto">
              {result.results.map((r: any, i: number) => (
                <div key={i} className="text-sm py-1 border-b">
                  <span className={`font-medium ${r.status === 'updated' ? 'text-green-600' : 'text-gray-600'}`}>
                    {r.status === 'updated' ? '✓' : '○'}
                  </span>
                  {' '}
                  {r.userName || r.userId}: {r.status === 'updated' ? `${r.oldCode} → ${r.newCode}` : r.reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
