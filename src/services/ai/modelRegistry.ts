export type AngelModel={id:string;label:string;tier:'free'|'pro'|'enterprise';available:boolean};
export const ANGEL_MODELS:AngelModel[]=[
{id:'angel-fast',label:'Angel Fast',tier:'free',available:true},
{id:'angel-reason',label:'Angel Reasoning',tier:'pro',available:false},
{id:'angel-pro',label:'Angel Pro',tier:'pro',available:false},
{id:'angel-vision',label:'Angel Vision',tier:'pro',available:false},
{id:'angel-agent',label:'Angel Agent',tier:'enterprise',available:false},
];
export const DEFAULT_ANGEL_MODEL=ANGEL_MODELS[0];
let selected=DEFAULT_ANGEL_MODEL.id;
export const setSelectedAngelModel=(id:string)=>{const model=ANGEL_MODELS.find(m=>m.id===id)||DEFAULT_ANGEL_MODEL;selected=model.id;return model};
export const getSelectedAngelModel=()=>ANGEL_MODELS.find(m=>m.id===selected)||DEFAULT_ANGEL_MODEL;
