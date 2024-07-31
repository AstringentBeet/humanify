import {
  GemmaChatWrapper,
  getLlama,
  LlamaChatSession,
  LlamaGrammar,
} from "node-llama-cpp";
import { Gbnf } from "./gbnf.js";

export type Prompt = (
  systemPrompt: string,
  userPrompt: string,
  responseGrammar: Gbnf
) => Promise<string>;

export async function llama(opts?: {
  seed?: number;
  modelPath?: string;
}): Promise<Prompt> {
  const llama = await getLlama();
  const model = await llama.loadModel({
    modelPath: opts?.modelPath ?? "models/model.gguf",
  });

  const context = await model.createContext({ seed: opts?.seed });

  return async (systemPrompt, userPrompt, responseGrammar) => {
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      autoDisposeSequence: true,
      chatWrapper: new GemmaChatWrapper(),
      systemPrompt,
    });
    const response = await session.promptWithMeta(userPrompt, {
      temperature: 0.8,
      grammar: new LlamaGrammar(llama, {
        grammar: `${responseGrammar}`,
      }),
      stopOnAbortSignal: true,
    });
    session.dispose();
    return responseGrammar.parseResult(response.responseText);
  };
}
