
import React, { useState, useEffect } from 'react';
import { UserRole, AssessmentSession, Seniority, SAPModule } from './types';
import Layout from './components/Layout';
import CandidateExam from './components/CandidateExam';
import { generateAssessmentQuestions, evaluateAssessment } from './services/geminiService';
import { Plus, Link, Eye, ShieldCheck, Database, FileText, Clock, Check, Info, BrainCircuit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{name: string, role: UserRole} | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [examSession, setExamSession] = useState<AssessmentSession | null>(null);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AssessmentSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sapta_v2_sessions');
    if (stored) setSessions(JSON.parse(stored));

    const hash = window.location.hash;
    if (hash.startsWith('#/exam/')) {
      const id = hash.replace('#/exam/', '');
      const s = JSON.parse(localStorage.getItem('sapta_v2_sessions') || '[]').find((x: any) => x.id === id);
      if (s && s.status !== 'COMPLETED') setExamSession(s);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sapta_v2_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);

    try {
      const qs = await generateAssessmentQuestions(
        data.role as SAPModule, 
        data.seniority as Seniority, 
        data.industry as any, 
        data.context as string
      );
      
      const newS: AssessmentSession = {
        id: Math.random().toString(36).substring(7),
        candidateName: data.name as string,
        candidateEmail: data.email as string,
        role: data.role as SAPModule,
        seniority: data.seniority as Seniority,
        industry: data.industry as any,
        status: 'PENDING',
        questions: qs,
        answers: {},
        knowledgeSourceContext: data.context as string,
        createdAt: Date.now(),
        consentLGPD: true
      };
      
      setSessions(p => [newS, ...p]);
      setShowCreateModal(false);
    } catch (err) {
      alert("Falha na IA: Verifique a API Key.");
    } finally {
      setLoading(false);
    }
  };

  const completeExam = async (ans: Record<string, string>) => {
    if (!examSession) return;
    setLoading(true);
    const { score, analysis } = await evaluateAssessment({ ...examSession, answers: ans });
    const updated = sessions.map(s => s.id === examSession.id ? { ...s, status: 'COMPLETED' as const, answers: ans, score, analysis, completedAt: Date.now() } : s);
    setSessions(updated);
    setExamSession(null);
    window.location.hash = '';
    setLoading(false);
  };

  if (examSession) return <CandidateExam session={examSession} onComplete={completeExam} />;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-12 text-center animate-in fade-in duration-700">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <BrainCircuit className="w-16 h-16 text-blue-500" />
            <h1 className="text-6xl font-black tracking-tighter">SAPTA <span className="text-blue-500">AI</span></h1>
          </div>
          <p className="text-slate-400 text-xl font-medium">Enterprise Talent Intelligence System</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[UserRole.ADMIN, UserRole.RH, UserRole.DELIVERY].map(r => (
            <button key={r} onClick={() => setCurrentUser({name: 'User ' + r, role: r})} className="bg-slate-900/50 backdrop-blur-md p-10 rounded-3xl border border-slate-800 hover:border-blue-500 hover:bg-slate-800 transition-all text-left group">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <ShieldCheck />
              </div>
              <h3 className="text-2xl font-bold mb-2">{r}</h3>
              <p className="text-slate-500">Acesso restrito ao perfil de {r.toLowerCase()}.</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Assessments', value: sessions.length, icon: FileText, color: 'text-blue-600' },
              { label: 'Pending', value: sessions.filter(s => s.status === 'PENDING').length, icon: Clock, color: 'text-amber-500' },
              { label: 'Completed', value: sessions.filter(s => s.status === 'COMPLETED').length, icon: Check, color: 'text-green-500' },
              { label: 'Avg Accuracy', value: `${Math.round(sessions.reduce((a, b) => a + (b.score || 0), 0) / (sessions.filter(s => s.score).length || 1))}%`, icon: BrainCircuit, color: 'text-purple-500' }
            ].map((s, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 ${s.color}`}><s.icon /></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black mb-8 text-slate-800 uppercase tracking-tight">Talent Benchmarking</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessions.filter(s => s.status === 'COMPLETED')}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="candidateName" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={50} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div className="flex items-center space-x-3 text-slate-400"><Info size={16} /> <span className="text-xs font-bold uppercase">Base de Dados LGPD Ativa</span></div>
             <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center space-x-2">
               <Plus size={18} /> <span>New Assessment</span>
             </button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Candidate</th>
                  <th className="px-8 py-5">Spec / Seniority</th>
                  <th className="px-8 py-5">Industry</th>
                  <th className="px-8 py-5">Result</th>
                  <th className="px-8 py-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-800">{s.candidateName}<br/><span className="text-xs font-normal text-slate-400">{s.candidateEmail}</span></td>
                    <td className="px-8 py-5"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black uppercase mr-2">{s.role}</span> <span className="text-xs font-bold text-slate-400">{s.seniority}</span></td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{s.industry}</td>
                    <td className="px-8 py-5">
                      {s.status === 'COMPLETED' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full border-4 border-blue-100 flex items-center justify-center font-black text-xs text-blue-600">{s.score}%</div>
                          <span className="text-[10px] font-black uppercase text-green-500">Passed</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-amber-500 flex items-center"><Clock size={10} className="mr-1" /> Pending</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        {s.status === 'PENDING' ? (
                          <button 
                            onClick={() => {
                              const url = `${window.location.origin}${window.location.pathname}#/exam/${s.id}`;
                              navigator.clipboard.writeText(url);
                              setCopiedId(s.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className={`flex items-center space-x-1 text-[10px] font-black uppercase transition-colors ${copiedId === s.id ? 'text-green-500' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            <Link size={14} /> <span>{copiedId === s.id ? 'Copied' : 'Get Link'}</span>
                          </button>
                        ) : (
                          <button onClick={() => setSelectedAnalysis(s)} className="text-slate-400 hover:text-slate-900"><Eye size={18} /></button>
                        )}
                        <button onClick={() => setSessions(p => p.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAnalysis && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Análise Técnica IA</h2>
                  <p className="text-slate-500">Candidato: {selectedAnalysis.candidateName}</p>
                </div>
                <div className="text-5xl font-black text-blue-600">{selectedAnalysis.score}%</div>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mb-8 whitespace-pre-wrap leading-relaxed text-slate-700">
                {selectedAnalysis.analysis}
              </div>
              <button onClick={() => setSelectedAnalysis(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest">Fechar Relatório</button>
           </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-10 border-b bg-slate-50/50">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Config Test</h2>
              <p className="text-slate-400 font-medium">A IA criará um exame baseado nestes parâmetros.</p>
            </div>
            <form onSubmit={createSession} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" required placeholder="Nome Completo" className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-medium" />
                <input name="email" type="email" required placeholder="Email" className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-medium" />
                <select name="role" required className="p-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700">
                   <option value="ABAP">ABAP</option>
                   <option value="FI">FI</option>
                   <option value="PROJECT_MANAGEMENT">Management</option>
                   <option value="CPI">CPI/BTP</option>
                </select>
                <select name="seniority" required className="p-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700">
                   <option value={Seniority.JUNIOR}>Junior</option>
                   <option value={Seniority.PLENO}>Pleno</option>
                   <option value={Seniority.SENIOR}>Senior</option>
                </select>
                <select name="industry" required className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700">
                   <option value="Pharma">Pharma Industry</option>
                   <option value="Retail">Retail & CPG</option>
                   <option value="Food & Beverage">Food Industry</option>
                </select>
                <textarea name="context" placeholder="Simular Integração Sharepoint: Cole aqui requisitos específicos, manuais ou contexto do projeto para a IA usar como base..." className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 h-32 outline-none focus:border-blue-500" />
              </div>
              <div className="flex space-x-4 pt-4">
                 <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                 <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 disabled:bg-blue-300">
                   {loading ? 'Building Exam...' : 'Generate Assessment'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
