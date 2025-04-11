# dryai-mcp-server

This project implements an [MCP server](https://spec.modelcontextprotocol.io/) for [Dry.ai](https://dry.ai).

## Steps to Configure the Server

1. Log in to [Dry.ai](https://dry.ai) and navigate to your **Dry Profile**.

2. Generate an **MCP Token** from your profile. Make note of this token, as you will use it later.

3. Ensure node (min v18) is installed on your system.

4. Run `npm run build` in the root of the dryai-mcp-server project 

   5. Modify your `claude_desktop_config.json` file to include the following configuration:

      ```json
      {
         "mcpServers": {
           "dryai": {
            "command": "npx",
            "args": ["-y", "@dryai/dryai-mcp-server"],
            "env": {
               "MCP_TOKEN": "<MCP TOKEN>"
            }
         }
         }
      }
      ```

6. Run Claude Desktop - it will connect to dry and all of your configured smartspaces wlll appear as tools to ask questions and add items

