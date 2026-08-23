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
    if (!confirm('⚠️ Tem certeza que deseja apagar todos os registros de afiliados?\n\nEsta ação não pode ser desfeita e irá remover:\n- Todos os afiliados\n- Todas as comissões\n- Todos os cliques rastreados')) {
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
        alert(`✅ Registros apagados com sucesso!\n\n${data.stats.deletedAffiliates} afiliados\n${data.stats.deletedCommissions} comissões\n${data.stats.deletedClicks} cliques`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Migração de Códigos de Afiliados
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ferramenta administrativa para gerenciar códigos de afiliados
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden mb-8">
          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Sobre esta ferramenta</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  Atualiza códigos de afiliados do formato numérico (6 dígitos) para o novo formato baseado no nome do usuário.
                  Isso torna os links mais personalizados e fáceis de compartilhar.
                </p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleMigrate}
                disabled={loading}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Migrando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Iniciar Migração</span>
                    </>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:via-red-800 hover:to-rose-800 text-white px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {resetLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Apagando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Apagar Registros</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Atenção</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Apagar registros irá remover permanentemente todos os afiliados, comissões e cliques rastreados do banco de dados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-800">Erro</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 p-6 sm:p-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Migração Concluída!</h2>
                  <p className="text-white/90">Processo finalizado com sucesso</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl">
                  <p className="text-3xl font-bold text-blue-600">{result.stats.total}</p>
                  <p className="text-gray-700 font-medium mt-1">Total</p>
                  <p className="text-xs text-gray-500 mt-1">Registros processados</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-2xl">
                  <p className="text-3xl font-bold text-green-600">{result.stats.updated}</p>
                  <p className="text-gray-700 font-medium mt-1">Atualizados</p>
                  <p className="text-xs text-gray-500 mt-1">Códigos migrados</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 rounded-2xl">
                  <p className="text-3xl font-bold text-gray-600">{result.stats.skipped}</p>
                  <p className="text-gray-700 font-medium mt-1">Pulados</p>
                  <p className="text-xs text-gray-500 mt-1">Já no novo formato</p>
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Detalhes da Migração</span>
                </h3>
                <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alteração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.results.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'updated' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {r.status === 'updated' ? '✓ Atualizado' : '○ Pulado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {r.userName || r.userId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {r.status === 'updated' ? (
                              <span className="text-green-600 font-medium">
                                {r.oldCode} → {r.newCode}
                              </span>
                            ) : (
                              <span className="text-gray-500">{r.reason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
