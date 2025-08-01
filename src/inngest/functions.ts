import { gemini, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter"

import { inngest } from "./client";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("code-loom-test")
      return sandbox.sandboxId
    })

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer.  You write readable, maintaible code. You write simple next.js and ReactJS components and snippets",
      model: gemini({ model: "gemini-2.0-flash"}),
    });

    const { output } = await  codeAgent.run(
      `write the following component : ${event.data.value}`,
    );

    const sandoxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId)
      const host =  sandbox.getHost(3000)
      return `https://${host} `
    })

    console.log(output);

    return { output, sandoxUrl };
  },
);