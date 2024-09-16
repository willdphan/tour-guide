"""
Graph RAG with visual component try today.

WHY IT DOESN'T WORK:
- unable to read metadata that contains components, elements, and other details.
- unable to provide relevant answers, when asked to find simple chicken page it gives:
> Finished chain.
INFO:__main__:Response: It seems there was an issue retrieving the information about the available pages in the application. Could you please specify more details or try a different query?
- information provided needs to be more detailed and easier to grab.
"""

import ast
import os
import uuid
import traceback
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents.format_scratchpad.openai_tools import format_to_openai_tool_messages
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser
from langchain.agents import AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import BaseTool
from langchain.prompts import PromptTemplate
from langchain_core.messages import BaseMessage
import json

import re
import networkx as nx

class UIComponent(BaseModel):
    id: str
    type: str
    label: str = ""
    properties: Dict[str, Any] = {}
    page: str = ""

class UserFlow(BaseModel):
    id: str
    name: str
    steps: List[str]
    start_page: str
    end_page: str

class SimpleGraphManager:
    def __init__(self):
        self.graph = nx.Graph()

    def create_node(self, node_type: str, properties: Dict[str, Any]):
        node_id = properties.get('id', str(uuid.uuid4()))
        component_type = properties.pop('type', None)
        self.graph.add_node(node_id, node_type=node_type, component_type=component_type, **properties)

    def run_query(self, query: str) -> List[Dict[str, Any]]:
        if query.startswith("MATCH (c:UIComponent)"):
            return [{'c': {**data, 'type': data['component_type']}} 
                    for _, data in self.graph.nodes(data=True) 
                    if data['node_type'] == 'UIComponent']
        elif query.startswith("MATCH (f:UserFlow"):
            flow_id = query.split("{id: '")[1].split("'")[0]
            for _, data in self.graph.nodes(data=True):
                if data['node_type'] == 'UserFlow' and data['id'] == flow_id:
                    return [{'f': data}]
        return []

from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferMemory
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import json
import os

class NextJSUIGraphConstructor:
    def __init__(self, graph_manager, llm):
        self.graph_manager = graph_manager
        self.llm = llm

    def build_graph(self, metadata_directory: str):
        logger.debug(f"Starting to build graph from metadata directory: {metadata_directory}")
        self.add_components_and_routes_from_metadata(metadata_directory)
        self.generate_user_flows()

    def add_components_and_routes_from_metadata(self, metadata_directory):
        metadata_file = os.path.join(metadata_directory, 'app-metadata.json')
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)

        # Add components
        for component in metadata.get('components', []):
            self.graph_manager.create_node('UIComponent', {
                'id': component['name'],
                'type': 'Component',
                'label': component['name'],
                'filePath': component['filePath'],
                'props': component.get('props', []),
                'description': component.get('description', ''),
            })

        # Add routes
        for route in metadata.get('routes', []):
            self.graph_manager.create_node('UIComponent', {
                'id': route['path'],
                'type': 'Page',
                'label': f"Page: {route['path']}",
                'page': route['path'],
                'component': route['component'],
                'parentRoute': route.get('parentRoute', ''),
            })

        logger.debug(f"Added {len(metadata.get('components', []))} components and {len(metadata.get('routes', []))} routes to the graph")

    def generate_user_flows(self):
        components = self.graph_manager.run_query("MATCH (c:UIComponent) RETURN c")
        components_str = "\n".join([str(c['c']) for c in components])

        prompt = PromptTemplate(
            input_variables=["components"],
            template="""
            Based on the following Next.js UI components and routes, generate possible user flows:

            {components}

            For each flow, provide:
            1. A unique ID
            2. A descriptive name
            3. A list of steps using the component labels and page routes
            4. The starting page route
            5. The ending page route

            Output the flows as a JSON array in the following format:
            [
                {{"id": "flow1", "name": "Navigate to Create Project", "steps": ["Click 'New Project' button on /", "Fill in project details on /projects/new", "Click 'Create Project' button on /projects/new"], "start_page": "/", "end_page": "/projects/new"}},
                ...
            ]
            """
        )

        llm_response = self.llm.invoke(prompt.format(components=components_str))
        
        # Extract the content from the LLM response
        if isinstance(llm_response, BaseMessage):
            flows_str = llm_response.content
        elif isinstance(llm_response, Dict):
            flows_str = llm_response.get('content', str(llm_response))
        else:
            flows_str = str(llm_response)

        # Extract JSON content from potential markdown code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', flows_str)
        if json_match:
            flows_json = json_match.group(1)
        else:
            flows_json = flows_str

        try:
            flows = json.loads(flows_json)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Raw LLM output: {flows_str}")
            flows = []

        for flow in flows:
            self.graph_manager.create_node("UserFlow", UserFlow(**flow).dict())

from langchain.tools import BaseTool
from typing import Dict, List, Any

class GetComponentInfoTool(BaseTool):
    name = "get_component_info"
    description = "Get information about a specific UI component"
    graph_manager: Any  # Add this line

    def __init__(self, graph_manager):
        super().__init__()
        self.graph_manager = graph_manager

    def _run(self, component_id: str) -> Dict[str, Any]:
        query = f"MATCH (c:UIComponent {{id: '{component_id}'}}) RETURN c"
        result = self.graph_manager.run_query(query)
        if result:
            return result[0]['c']
        return {}

class GetUserFlowStepsTool(BaseTool):
    name = "get_user_flow_steps"
    description = "Get the steps for a specific user flow"
    graph_manager: Any  # Add this line

    def __init__(self, graph_manager):
        super().__init__()
        self.graph_manager = graph_manager

    def _run(self, flow_id: str) -> List[str]:
        query = f"MATCH (f:UserFlow {{id: '{flow_id}'}}) RETURN f"
        result = self.graph_manager.run_query(query)
        if result:
            return result[0]['f'].get('steps', [])
        return []

class FindNavigationPathTool(BaseTool):
    name = "find_navigation_path"
    description = "Find a navigation path between two pages"
    graph_manager: Any  # Add this line

    def __init__(self, graph_manager):
        super().__init__()
        self.graph_manager = graph_manager

    def _run(self, start_page: str, end_page: str) -> List[str]:
        query = f"""
        MATCH path = shortestPath((start:UIComponent {{id: '{start_page}'}})-[*]-(end:UIComponent {{id: '{end_page}'}}))
        RETURN [node in nodes(path) | node.id] as path
        """
        result = self.graph_manager.run_query(query)
        if result:
            return result[0]['path']
        return []

# Update the NextJSUIGuideAgent class to use these tools
class NextJSUIGuideAgent:
    def __init__(self, metadata_path: str):
        self.graph_manager = SimpleGraphManager()
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
        self.graph_constructor = NextJSUIGraphConstructor(self.graph_manager, self.llm)
        self.metadata = parse_app_metadata(metadata_path)
        if self.metadata is None:
            raise ValueError("Failed to load metadata")
        self.build_graph(metadata_path)
        self.setup_agent()

    def build_graph(self, metadata_path: str):
        try:
            self.graph_constructor.build_graph(metadata_path)
        except Exception as e:
            print(f"Error building graph: {e}")
            print(traceback.format_exc())
            raise

    def setup_agent(self):
        system_prompt = """
        You are a UI guide assistant specialized in Next.js applications. Your task is to help users navigate the application's interface.
        Use the provided graph of UI components and automatically generated user flows to offer guidance.
        When explaining navigation steps, be clear and concise. Refer to UI elements by their visible labels or descriptions and include the page routes.
        If you need to find a path between pages, use the find_navigation_path tool.
        Always provide step-by-step instructions for navigation queries, considering the Next.js routing system.
        """

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        tools = [
            GetComponentInfoTool(graph_manager=self.graph_manager),
            GetUserFlowStepsTool(graph_manager=self.graph_manager),
            FindNavigationPathTool(graph_manager=self.graph_manager)
        ]

        llm_with_tools = self.llm.bind_tools(tools)

        agent = (
            {
                "input": lambda x: x["input"],
                "agent_scratchpad": lambda x: format_to_openai_tool_messages(
                    x["intermediate_steps"]
                ),
            }
            | prompt
            | llm_with_tools
            | OpenAIToolsAgentOutputParser()
        )

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            memory=ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        )

    def get_guidance(self, query: str) -> str:
        try:
            response = self.agent_executor.invoke({"input": query})
            return response['output']
        except Exception as e:
            return f"Error: {str(e)}"



def parse_app_metadata(metadata_path):
    try:
        if os.path.isdir(metadata_path):
            metadata_path = os.path.join(metadata_path, 'app-metadata.json')
        
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Metadata file not found at {metadata_path}")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        logger.debug(f"Loaded metadata: {json.dumps(metadata, indent=2)}")
        return metadata
    except Exception as e:
        logger.error(f"Error loading metadata: {str(e)}")
        return None
# Example usage
if __name__ == "__main__":
    metadata_path = "/Users/williamphan/Desktop/tourguide/src/app/sdk/metadata"
    logger.info(f"Initializing UI Guide Agent with metadata path: {metadata_path}")
    ui_guide = NextJSUIGuideAgent(metadata_path)

    try:
        queries = [
            "How do I navigate to the chicken page?",
            "What pages are available in the application?",
        ]

        for query in queries:
            logger.info(f"Processing query: {query}")
            response = ui_guide.get_guidance(query)
            logger.info(f"Response: {response}\n")

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        logger.error(traceback.format_exc())
