
import React, { useState, useEffect, useRef } from 'react';
import { AssessmentSession } from '../types';
import { Clock, Send, ShieldAlert, CheckCircle2, Camera, Lock } from 'lucide-react';

interface CandidateExamProps {
  session: AssessmentSession;
  onComplete: (answers: Record<string, string>) => void;
}

const CandidateExam: React.FC<CandidateExamProps> = ({ session, onComplete }) => {
  const [step, setStep] = useState<'CONSENT' | 'TEST'>('CONSENT');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isFinished, setIsFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (step === 'TEST') {
      const timer = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
      
      // Simulação de acesso à camera para "integridade"
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(() => console.log("Câmera não disponível"));

      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  if (step === 'CONSENT') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl text-white"><Lock size={28} /></div>
            <h1 className="text-3xl font-extrabold text-slate-800">Termo de Consentimento</h1>
          </div>
          <div className="prose prose-slate text-slate-600 mb-8 space-y-4">
            <p>Olá, <strong>{session.candidateName}</strong>.</p>
            <p>Em conformidade com a <strong>LGPD (Lei Geral de Proteção de Dados)</strong>, informamos que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Seus dados e respostas serão utilizados exclusivamente para este processo seletivo.</li>
              <li>A sessão será cronometrada e monitorada para garantir a integridade técnica.</li>
              <li>Seus dados serão anonimizados ou excluídos após a conclusão do ciclo de recrutamento.</li>
            </ul>
          </div>
          <button 
            onClick={() => setStep('TEST')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-200"
          >
            Aceitar e Iniciar Avaliação (1h)
          </button>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[currentIdx];

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
          <h2 className="text-3xl font-bold mb-4">Teste Finalizado</h2>
          <p className="text-slate-500">Suas respostas foram processadas pela nossa IA e enviadas ao time de Delivery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">SAP</div>
          <div>
            <h2 className="font-bold text-slate-800">{session.role} - {session.seniority}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{session.industry}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:block w-32 h-20 bg-black rounded-lg overflow-hidden border-2 border-slate-200">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover grayscale opacity-50" />
          </div>
          <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-12 px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-8 py-4 bg-slate-50 border-b flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase">Questão {currentIdx + 1} / {session.questions.length}</span>
            <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-blue-600 border border-blue-100 uppercase">{currentQ.type}</span>
          </div>
          
          <div className="p-10">
            <h3 className="text-2xl font-semibold text-slate-800 mb-10 leading-snug">{currentQ.text}</h3>
            
            {currentQ.isMultipleChoice ? (
              <div className="grid gap-4">
                {currentQ.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswers(p => ({...p, [currentQ.id]: opt}))}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center space-x-4 ${
                      answers[currentQ.id] === opt ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500">{String.fromCharCode(65+i)}</span>
                    <span className="font-medium">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                className="w-full h-64 p-6 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-slate-700 text-lg transition-all"
                placeholder="Desenvolva sua resposta técnica detalhadamente..."
                value={answers[currentQ.id] || ''}
                onChange={e => setAnswers(p => ({...p, [currentQ.id]: e.target.value}))}
              />
            )}
          </div>

          <div className="p-8 bg-slate-50 border-t flex justify-between">
            <button 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(p => p - 1)}
              className="px-6 py-3 font-bold text-slate-400 disabled:opacity-30"
            >
              Voltar
            </button>
            <button 
              onClick={() => currentIdx < session.questions.length - 1 ? setCurrentIdx(p => p + 1) : (setIsFinished(true), onComplete(answers))}
              className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center space-x-2"
            >
              <span>{currentIdx === session.questions.length - 1 ? 'Finalizar e Enviar' : 'Próxima Questão'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <ShieldAlert size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">Sessão Segura e Criptografada</span>
        </div>
      </main>
    </div>
  );
};

export default CandidateExam;
