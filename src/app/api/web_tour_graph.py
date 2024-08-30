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

class NextJSUIGraphConstructor:
    def __init__(self, graph_manager, llm):
        self.graph_manager = graph_manager
        self.llm = llm

    def build_graph(self, directory: str):
        logger.debug(f"Starting to build graph from directory: {directory}")
        self.add_ui_components_and_pages(directory)
        self.generate_user_flows()

    def add_ui_components_and_pages(self, directory):
        components_and_pages = self.parse_nextjs_files(directory)
        for item in components_and_pages:
            logger.debug(f"Adding to graph: {item}")
            self.graph_manager.create_node(item.type, item.dict())

    def parse_nextjs_files(self, directory):
        items = []
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                    file_path = os.path.join(root, file)
                    logger.debug(f"Processing file: {file_path}")
                    with open(file_path, 'r') as f:
                        content = f.read()
                        rel_path = os.path.relpath(file_path, directory)
                        route = '/' + os.path.splitext(rel_path)[0].replace('\\', '/')
                        if route.endswith('/index'):
                            route = route[:-5]
                        
                        logger.debug(f"Adding page: {route}")
                        items.append(UIComponent(
                            id=f"page_{route}",
                            type="Page",
                            label=f"Page: {route}",
                            page=route
                        ))
                        
                        items.extend(self.extract_components(content, route))
                        dynamic_routes = self.extract_dynamic_routes(content)
                        for dynamic_route in dynamic_routes:
                            logger.debug(f"Adding dynamic route: {dynamic_route}")
                            items.append(UIComponent(
                                id=f"page_{dynamic_route}",
                                type="DynamicPage",
                                label=f"Dynamic Page: {dynamic_route}",
                                page=dynamic_route
                            ))
        return items

    def extract_components(self, content, page):
        components = []
        component_regex = r'(?:export\s+default\s+function|function|const)\s+(\w+)\s*\([^)]*\)\s*{'
        matches = re.finditer(component_regex, content)
        for match in matches:
            component_name = match.group(1)
            logger.debug(f"Extracted component: {component_name} on page {page}")
            components.append(UIComponent(
                id=f"{page}_{component_name}",
                type="Component",
                label=component_name,
                page=page
            ))

        form_regex = r'<(input|button|select|textarea)[^>]*>'
        form_matches = re.finditer(form_regex, content, re.IGNORECASE)
        for match in form_matches:
            element_type = match.group(1).lower()
            label = re.search(r'placeholder="([^"]*)"', match.group(0))
            label = label.group(1) if label else ""
            logger.debug(f"Extracted form element: {element_type} with label '{label}' on page {page}")
            components.append(UIComponent(
                id=f"{page}_{element_type}_{len(components)}",
                type=element_type,
                label=label,
                page=page
            ))

        return components

    def extract_dynamic_routes(self, content):
        dynamic_routes = []
        array_pattern = r'const\s+(\w+)\s*=\s*\[(.*?)\];'
        array_matches = re.finditer(array_pattern, content, re.DOTALL)
        
        for match in array_matches:
            array_name = match.group(1)
            array_content = match.group(2)
            logger.debug(f"Found array: {array_name}")
            
            try:
                array_items = ast.literal_eval(f"[{array_content}]")
                for item in array_items:
                    if isinstance(item, dict) and 'slug' in item:
                        route = f"/product/{item['slug']}"
                        logger.debug(f"Extracted dynamic route: {route}")
                        dynamic_routes.append(route)
            except:
                logger.debug("Failed to parse array with ast, falling back to regex")
                slug_pattern = r"slug:\s*['\"](.+?)['\"]"
                slug_matches = re.finditer(slug_pattern, array_content)
                for slug_match in slug_matches:
                    route = f"/product/{slug_match.group(1)}"
                    logger.debug(f"Extracted dynamic route (regex): {route}")
                    dynamic_routes.append(route)
        
        return dynamic_routes
    def extract_components(self, content, page):
        components = []
        component_regex = r'(?:export\s+default\s+function|function|const)\s+(\w+)\s*\([^)]*\)\s*{'
        matches = re.finditer(component_regex, content)
        for match in matches:
            component_name = match.group(1)
            components.append(UIComponent(
                id=f"{page}_{component_name}",
                type="Component",
                label=component_name,
                page=page
            ))

        form_regex = r'<(input|button|select|textarea)[^>]*>'
        form_matches = re.finditer(form_regex, content, re.IGNORECASE)
        for match in form_matches:
            element_type = match.group(1).lower()
            label = re.search(r'placeholder="([^"]*)"', match.group(0))
            label = label.group(1) if label else ""
            components.append(UIComponent(
                id=f"{page}_{element_type}_{len(components)}",
                type=element_type,
                label=label,
                page=page
            ))

        return components

    def generate_user_flows(self):
        components = self.graph_manager.run_query("MATCH (c:UIComponent) RETURN c")
        components_str = "\n".join([str(c['c']) for c in components])

        prompt = PromptTemplate(
            input_variables=["components"],
            template="""
            Based on the following Next.js UI components, generate possible user flows:

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


class GetComponentInfoTool(BaseTool):
    name = "get_component_info"
    description = "Get information about a specific UI component"
    graph_manager: SimpleGraphManager = Field(exclude=True)

    def _run(self, component_id: str) -> str:
        for node_id, data in self.graph_manager.graph.nodes(data=True):
            if data['node_type'] == 'UIComponent' and data['id'] == component_id:
                return str({**data, 'type': data['component_type']})
        return f"No component found with id: {component_id}"

class GetUserFlowStepsTool(BaseTool):
    name = "get_user_flow_steps"
    description = "Get steps for a particular user flow"
    graph_manager: SimpleGraphManager = Field(exclude=True)

    def _run(self, flow_id: str) -> str:
        for _, data in self.graph_manager.graph.nodes(data=True):
            if data['node_type'] == 'UserFlow' and data['id'] == flow_id:
                return f"Flow: {data['name']}\nSteps: {', '.join(data['steps'])}\nStart Page: {data['start_page']}\nEnd Page: {data['end_page']}"
        return f"No user flow found with id: {flow_id}"

class FindNavigationPathTool(BaseTool):
    name = "find_navigation_path"
    description = "Find a navigation path between two pages"
    graph_manager: SimpleGraphManager = Field(exclude=True)

    def _run(self, start_page: str, end_page: str) -> str:
        all_pages = [data['page'] for _, data in self.graph_manager.graph.nodes(data=True) 
                     if data['node_type'] in ['Page', 'DynamicPage']]
        logger.debug(f"All pages in graph: {all_pages}")

        start_nodes = [n for n, d in self.graph_manager.graph.nodes(data=True) 
                       if d['node_type'] in ['Page', 'DynamicPage'] and d['page'] == start_page]
        end_nodes = [n for n, d in self.graph_manager.graph.nodes(data=True) 
                     if d['node_type'] in ['Page', 'DynamicPage'] and d['page'] == end_page]

        logger.debug(f"Start nodes: {start_nodes}")
        logger.debug(f"End nodes: {end_nodes}")

        if not start_nodes or not end_nodes:
            return f"No path found between {start_page} and {end_page}. Available pages: {', '.join(all_pages)}"

        try:
            path = nx.shortest_path(self.graph_manager.graph, start_nodes[0], end_nodes[0])
            steps = [self.graph_manager.graph.nodes[node]['label'] for node in path if 'label' in self.graph_manager.graph.nodes[node]]
            return f"Navigation path: {' -> '.join(steps)}"
        except nx.NetworkXNoPath:
            return f"No path found between {start_page} and {end_page}. Available pages: {', '.join(all_pages)}"
from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferMemory

class NextJSUIGuideAgent:
    def __init__(self, repo_path: str):
        self.graph_manager = SimpleGraphManager()
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
        self.graph_constructor = NextJSUIGraphConstructor(self.graph_manager, self.llm)
        self.build_graph(repo_path)
        self.setup_agent()

    def build_graph(self, repo_path: str):
        try:
            self.graph_constructor.build_graph(repo_path)
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

# Example usage
if __name__ == "__main__":
    repo_path = "/Users/williamphan/Desktop/tourguide/src"
    logger.info(f"Initializing UI Guide Agent with repo path: {repo_path}")
    ui_guide = NextJSUIGuideAgent(repo_path)

    try:
        queries = [
            "How do I navigate to the chicken page?",
            "What pages are available in the application?",
            "Show me all the product pages",
        ]

        for query in queries:
            logger.info(f"Processing query: {query}")
            response = ui_guide.get_guidance(query)
            logger.info(f"Response: {response}\n")

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        logger.error(traceback.format_exc())