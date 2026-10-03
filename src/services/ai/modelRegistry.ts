export type AngelModelTier='free'|'pro'|'enterprise';
export interface AngelModelDefinition{id:string;label:string;provider:'gemini'|'openai'|'anthropic'|'local';tier:AngelModelTier;description:string;available:boolean;supportsThinking:boolean;supportsVision:boolean;supportsAudio:boolean;}
export const ANGEL_MODELS:AngelModelDefinition[]=[
{id:'gemini-3.8-flash',label:'Gemini 3.8 Flash',provider:'gemini',tier:'free',description:'Fast multimodal everyday model',available:true,supportsThinking:true,supportsVision:true,supportsAudio:true},
{id:'gemini-3.8-pro',label:'Gemini 3.8 Pro',provider:'gemini',tier:'pro',description:'Deep reasoning and larger workloads',available:true,supportsThinking:true,supportsVision:true,supportsAudio:true},
{id:'gemini-3.1-flash-lite',label:'Gemini 3.1 Flash Lite',provider:'gemini',tier:'free',description:'Ultra-fast lightweight model',available:true,supportsThinking:false,supportsVision:true,supportsAudio:false},
{id:'gemini-3.1-flash-image',label:'Gemini 3.1 Flash Image',provider:'gemini',tier:'pro',description:'Image generation and visual editing',available:true,supportsThinking:false,supportsVision:true,supportsAudio:false},
{id:'gpt-4o',label:'GPT-4o',provider:'openai',tier:'pro',description:'OpenAI multimodal model',available:false,supportsThinking:false,supportsVision:true,supportsAudio:false},
{id:'gpt-4o-mini',label:'GPT-4o Mini',provider:'openai',tier:'free',description:'Lightweight OpenAI model',available:false,supportsThinking:false,supportsVision:true,supportsAudio:false},
{id:'claude-3-7-sonnet',label:'Claude 3.7 Sonnet',provider:'anthropic',tier:'enterprise',description:'Extended-reasoning Anthropic model',available:false,supportsThinking:true,supportsVision:true,supportsAudio:false},
{id:'llama-3.3-70b-local',label:'Llama 3.3 70B Local',provider:'local',tier:'free',description:'Private self-hosted model slot',available:false,supportsThinking:false,supportsVision:false,supportsAudio:false},
];
export const DEFAULT_ANGEL_MODEL=ANGEL_MODELS[0];
export function getSelectedAngelModel(){if(typeof localStorage==='undefined')return DEFAULT_ANGEL_MODEL;const id=localStorage.getItem('angel_selected_model');return ANGEL_MODELS.find(m=>m.id===id)||DEFAULT_ANGEL_MODEL;}
export function setSelectedAngelModel(id:string){const model=ANGEL_MODELS.find(m=>m.id===id)||DEFAULT_ANGEL_MODEL;if(typeof localStorage!=='undefined')localStorage.setItem('angel_selected_model',model.id);return model;}
