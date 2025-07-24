import { gemini, createAgent } from "@inngest/agent-kit";


import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer.  You write readable, maintaible code. You write simple next.js and ReactJS components and snippets",
      model: gemini({ model: "gemini-2.0-flash"}),
    });

    const { output } = await  codeAgent.run(
      `write the following component : ${event.data.value}`,
    );

    console.log(output);

    return { output };
  },
);