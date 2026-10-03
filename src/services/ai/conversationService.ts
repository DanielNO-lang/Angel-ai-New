import { agentExecutionLifecycle } from './agentExecutionLifecycle';
import { contextBuilder } from './contextBuilder';
import { toolRegistry } from './toolRegistry';
import { getSelectedAngelModel } from './modelRegistry';
import { SendMessageOptions, SendMessageResult, ToolExecutionContext } from './types';

export class ConversationService {
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const { prompt, agent, conversationHistory, contextState, onToken, onToolStart, onToolComplete, onError } = options;
    const selectedModel = getSelectedAngelModel();
    const routedModelId = selectedModel.id;
    const routedProvider = selectedModel.provider;
    const lifecycleSession = agentExecutionLifecycle.createSession(agent.id, agent.name);
    const assembledContext = contextBuilder.buildContext({ userPrompt: prompt, conversationMessages: conversationHistory, agent, allMemories: contextState.memories, allTasks: contextState.tasks, allProjects: contextState.projects, activeProjectId: contextState.activeProjectId, availableTools: toolRegistry.getAllTools() });
    agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'context_preparation','Context Assembled',`Curated ${assembledContext.relevantMemories.length} relevant memories, ${assembledContext.recentMessages.length} prior turns. Estimated tokens: ~${assembledContext.totalTokensEstimated}.`,{relevantMemories:assembledContext.relevantMemories.map(m=>m.title),tokensEstimated:assembledContext.totalTokensEstimated});

    const toolCallsExecuted: SendMessageResult['toolCallsExecuted']=[];
    const discoverableTools=toolRegistry.getDiscoverableDeclarations();
    const toolContext:ToolExecutionContext={tasks:contextState.tasks,memories:contextState.memories,projects:contextState.projects,activeProjectId:contextState.activeProjectId,createTask:contextState.createTask,updateTask:contextState.updateTask,createMemory:contextState.createMemory};
    let toolAugmentedInstruction=assembledContext.systemInstruction;
    const toolKeywords=['create task','add task','new task','search workspace','find task','remember that','store memory','save preference','what time','current date'];
    if(toolKeywords.some(kw=>prompt.toLowerCase().includes(kw))){
      try{
        const toolRes=await fetch('/api/ai/tool-call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,systemInstruction:assembledContext.systemInstruction,conversationHistory:assembledContext.recentMessages,tools:discoverableTools,modelId:routedModelId,providerId:routedProvider})});
        if(toolRes.ok){const data=await toolRes.json();if(Array.isArray(data.toolCalls)){for(const call of data.toolCalls){agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'execution',`Invoking Tool: ${call.name}`,`Tool args: ${JSON.stringify(call.args)}`);onToolStart?.(call.name,call.args);const result=await toolRegistry.executeTool(call.name,call.args,toolContext);onToolComplete?.(call.name,result);toolCallsExecuted.push({toolName:call.name,input:call.args,output:result.data,status:result.success?'completed':'failed'});toolAugmentedInstruction+=`\n\n[TOOL EXECUTION REPORT]: Tool "${call.name}" was executed with result: ${result.summary}. Data: ${JSON.stringify(result.data)}. Reflect this result in your response to the user.`;}}}
      }catch(err){console.warn('[ConversationService] Tool negotiation skipped:',err)}
    }

    agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'execution','Initiating Intelligence Stream',`Routing to ${routedProvider} (${routedModelId}).`);
    let accumulatedText='';
    try{
      const response=await fetch('/api/ai/stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,systemInstruction:toolAugmentedInstruction,conversationHistory:assembledContext.recentMessages,modelId:routedModelId,providerId:routedProvider,temperature:agent.modelConfig.temperature})});
      if(!response.ok||!response.body)throw new Error(`HTTP ${response.status}: Failed to connect to Angel intelligence stream`);
      const reader=response.body.getReader();const decoder=new TextDecoder();
      agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'response','Streaming Response','Receiving token stream from provider.');
      while(true){const {value,done}=await reader.read();if(done)break;for(const line of decoder.decode(value,{stream:true}).split('\n')){if(line.startsWith('data: ')){try{const parsed=JSON.parse(line.slice(6));if(parsed.chunk){accumulatedText+=parsed.chunk;onToken?.(parsed.chunk,accumulatedText)}if(parsed.done)break}catch{}}}}
      agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'completed','Execution Completed',`Synthesis completed (${accumulatedText.length} characters emitted).`);
      return {content:accumulatedText||'Angel acknowledged your prompt.',toolCallsExecuted,contextSummary:{memoriesCount:assembledContext.relevantMemories.length,messagesIncluded:assembledContext.recentMessages.length,tokensEstimated:assembledContext.totalTokensEstimated}};
    }catch(err){const errorMsg=err instanceof Error?err.message:String(err);agentExecutionLifecycle.advanceStage(lifecycleSession.sessionId,'failed','Execution Failed',errorMsg);onError?.(errorMsg);throw err;}
  }
}
export const conversationService=new ConversationService();
