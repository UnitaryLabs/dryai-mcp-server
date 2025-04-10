import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises"; // Import fs for file system operations

const DRY_URL_QA_BASE = "http://velocity-local.dry:8080/api/dryqa";
const DRY_URL_CREATE_BASE = "http://velocity-local.dry:8080/api/drycreate";
const USER_AGENT = "dry-app/1.0";

// Helper function for making NWS API requests
async function makeDryRequest<RequestType, ResponseType>(url: string, data: RequestType): Promise<ResponseType | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as ResponseType;
  } catch (error) {
    console.error("Error making Dry request:", error);
    return null;
  }
}

interface DryResponse {
  dryContext?: string;
  success?: boolean;
}

interface DryRequest {
  smartspace?: string;
  user?: string;
  query?: string;
  type?: string;
}

// Create server instance
const server = new McpServer({
  name: "dryai",
  version: "1.0.0",
});

async function loadToolsFromJson() {
  try {

    //const jsonData = await fs.readFile("../tools.json", "utf-8");

    const dryTools = {
      "user": "41DTZUC2JC15D",
      "smartspaces" : [
        {
          "name": "get-megpt",
          "description": "Get personal quantified info from dry.ai's me-gpt database",
          "schemaDescription": "question the user wants to ask about the data stored in me-gpt database",
          "smartspace": "3YT18UWB2YRID"
        },
        {
          "name": "get-congressgpt",
          "description": "Get information about congress from dry.ai's congress gpt, which contains the full text of the congressional record",
          "schemaDescription": "keywords that will be to search for relevant speeches in the database - only the values that will appear in the speech text",
          "smartspace": "3P5T3H3K26MB0"
        },
        {
          "name": "create-exercise-megpt",
          "type":"2XJJVIVNHIBTA",
          "description": "Add an exercise performed by the user to dry.ai's me-gpt database. Add mentioned exercises immediately without additional verification. Display the link which is returned " +
              "after so the user can examine.",
          "schemaDescription": "description of the exercise provided by the user",
          "smartspace": "3YT18UWB2YRID"
        },
      ]
    }

    // Log the array to confirm data is correctly loaded

    // Initialize tools from JSON data
    dryTools.smartspaces.forEach((tool: any) => {

      server.tool(
          tool.name,
          tool.description,
          {
            query: z.string().describe(tool.schemaDescription),
          },
          async ({ query }) => {
            const dryUrl = tool.type ? DRY_URL_CREATE_BASE : DRY_URL_QA_BASE;
            const dryData: DryRequest = {
              user: dryTools.user,
              smartspace: tool.smartspace,
              query: query,
              type: tool.type
            };
            const dryResponse = await makeDryRequest<DryRequest, DryResponse>(dryUrl, dryData);

            if (!dryResponse) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Failed to get information for the query: ${query}.`,
                  },
                ],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: dryResponse.dryContext || `No context found for the query: ${query}.`,
                },
              ],
            };
          }
      );
    });
  } catch (error) {
    console.error("Error loading tools from JSON:", error);
  }
}

// Start the server
async function main() {
  await loadToolsFromJson();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dry.AI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});