import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { Attachment } from '../../types';
import { AngelLogo } from '../ui/AngelLogo';
import { ChatComposer } from './ChatComposer';

const chatGreetings=['How was your day?','What is on your mind?','Want to talk?','What shall we figure out?','Tell me what you are working on.','Where should we start?','Anything you want to explore?','I am here. What is up?'];
const searchIdeas=['Latest tech news','Design a marketing plan','Research something for me','Help me build a project'];

export const ChatView:React.FC=()=>{
 const {activeConversation,messages,sendMessage,isChatStreaming,settings,setActiveTab,createConversation}=useAngel();
 const light=settings.theme==='light'; const endRef=useRef<HTMLDivElement>(null); const greeting=useMemo(()=>chatGreetings[Math.floor(Math.random()*chatGreetings.length)],[]);
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages,isChatStreaming]);
 const handleSend=async(text:string,attachments:Attachment[])=>{if(!text.trim()&&!attachments.length)return;await sendMessage(text,attachments)};
 const newChat=()=>createConversation();
 return <div className="flex h-full min-h-0 flex-col">
  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
   <div className="mx-auto flex w-full max-w-4xl flex-col px-4 pb-40 pt-10 sm:px-6">
    {messages.length===0?<div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[.035] shadow-2xl"><AngelLogo size={42} glow/></motion.div>
      <motion.h1 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.04}} className={`text-4xl sm:text-5xl font-semibold tracking-tight ${light?'text-slate-950':'text-white'}`}>{greeting}</motion.h1>
      <p className={`mt-4 text-sm ${light?'text-slate-500':'text-neutral-500'}`}>Try searching for something real.</p>
      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">{searchIdeas.map(x=><button key={x} onClick={()=>setActiveTab('chat')} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition ${light?'border-slate-200 bg-white hover:bg-slate-50 text-slate-600':'border-white/8 bg-white/[.03] hover:bg-white/[.06] text-neutral-400'}`}><Search className="h-3.5 w-3.5"/>{x}</button>)}</div>
    </div>:<div className="space-y-6">{messages.map((m:any)=><motion.div key={m.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role==='user'?(light?'bg-slate-100 text-slate-900':'bg-white/[.08] text-white'):(light?'text-slate-800':'text-neutral-200')}`}>{m.content}</div></motion.div>)}{isChatStreaming&&<div className="flex items-center gap-2 text-xs text-neutral-500"><Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-400"/>Angel is thinking...</div>}<div ref={endRef}/></div>}
   </div>
  </div>
  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6"><div className="pointer-events-auto mx-auto w-full max-w-4xl"><ChatComposer value="" onChange={()=>{}} onSend={handleSend} isStreaming={isChatStreaming} isLight={light} onVisual={()=>setActiveTab('visual_mode')} onVoice={()=>setActiveTab('voice')}/></div></div>
 </div>;
};
