import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const chatTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_meps',
      description: 'Search for MEPs (Members of European Parliament) in our database. Use this to find MEPs by name, country, or political group.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'MEP name or partial name to search for',
          },
          country: {
            type: 'string',
            description: 'Country name (e.g., "Germany", "France", "Portugal")',
          },
          political_group: {
            type: 'string',
            description: 'Political group short name: EPP, S&D, RE, Greens/EFA, ECR, The Left, PfE, ESN, or NI',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Get statistics about MEPs - total count, distribution by country and political group. Use this to answer questions like "how many MEPs are there?" or "which country has the most MEPs?"',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information about MEPs, Parliament news, or political positions. ALWAYS use this when our database lacks data. Good queries: "MEPs joined European Parliament 2026 incoming members", "MEP position on Mercosur agreement", "environmental regulation European Parliament MEPs"',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Detailed search query. Be specific - include dates, topics, "European Parliament", "MEP", etc.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_changes',
      description: 'Get recent changes in Parliament membership - new MEPs who joined, MEPs who left, or MEPs who changed political groups. Use this to answer questions about "newest MEPs", "who joined recently", or "recent membership changes".',
      parameters: {
        type: 'object',
        properties: {
          change_type: {
            type: 'string',
            enum: ['joined', 'left', 'group_change', 'all'],
            description: 'Type of change to filter: "joined" for new members, "left" for departures, "group_change" for political group switches, "all" for everything',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
          },
        },
      },
    },
  },
];
