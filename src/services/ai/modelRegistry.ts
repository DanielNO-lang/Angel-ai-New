export type AngelModelTier = 'free' | 'plus' | 'pro';
export interface AngelModelDefinition { id:string; label:string; provider:string; tier:AngelModelTier; description:string; available:boolean; supportsThinking:boolean; supportsVision:boolean; }
export const ANGEL_MODELS:AngelModelDefinition[]=[
{id:'gemini-3.8-flash',label:'Gemini 3.8 Flash',provider:'gemini',tier:'free',description:'Fast everyday Angel model',available:true,supportsThinking:true,supportsVision:true},
{id:'gemini-3.8-pro',label:'Gemini 3.8 Pro',provider:'gemini',tier:'plus',description:'Higher reasoning and larger workloads',available:false,supportsThinking:true,supportsVision:true},
{id:'openai-reasoning',label:'OpenAI Reasoning',provider:'openai',tier:'plus',description:'Advanced reasoning model slot',available:false,supportsThinking:true,supportsVision:true},
{id:'claude-sonnet',label:'Claude Sonnet',provider:'anthropic',tier:'pro',description:'Long-form reasoning model slot',available:false,supportsThinking:true,supportsVision:true},
];
export const DEFAULT_ANGEL_MODEL=ANGEL_MODELS[0];
export function getSelectedAngelModel(){if(typeof localStorage==='undefined')return DEFAULT_ANGEL_MODEL;const id=localStorage.getItem('angel_selected_model');return ANGEL_MODELS.find(m=>m.id===id&&m.available)||DEFAULT_ANGEL_MODEL;}
export function setSelectedAngelModel(id:string){const model=ANGEL_MODELS.find(m=>m.id===id&&m.available)||DEFAULT_ANGEL_MODEL;if(typeof localStorage!=='undefined')localStorage.setItem('angel_selected_model',model.id);return model;}
