import { gemini, createAgent, createTool } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter"

import { inngest } from "./client";
import { getSandbox } from "./utils";
import z, { file } from "zod";
import { stderr, stdout } from "process";
import { PROMPT } from "@/prompt";

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
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.0-flash"}),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" }

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data
                  }
                })
                return result.stdout
              } catch (e)  {
                console.log(
                  `Command failed: ${e} \n stdout: ${buffers.stdout} \n stderror: ${buffers.stderr} `
                )

                return `Command failed: ${e} \n stdout: ${buffers.stdout} \n stderror: ${buffers.stderr} `
              }
            })
          },

        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or Update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {}
                const sandbox = await getSandbox(sandboxId)

                for(const file of files){
                  await sandbox.files.write(file.path, file.content)
                  updatedFiles[file.path] = file.content
                }

                return updatedFiles
              } catch (e) {
                return "Error: " + e
              }
            })

            if(typeof newFiles === 'object')
              network.state.data.files = newFiles

          }
        }),

        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId)
                const contents = []

                for(const file of files){
                  const content = await sandbox.files.read(file)
                  contents.push({ path: file, content})
                }
                return JSON.stringify(contents)

              } catch (e) {
                return "Error on Reading File: " + e
              }
            }) 
          }
        })
      ]

      
    });

    const { output } = await  codeAgent.run(
      `write the following component : ${event.data.value}`,
    );

    const sandoxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId)
      const host =  sandbox.getHost(3000)
      return `https://${host} `
    })

    return { output, sandoxUrl };
  },
);

