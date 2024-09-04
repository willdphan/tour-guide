import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';
import { Node, Project, PropertyAssignment, SourceFile, SyntaxKind } from 'ts-morph';

import * as parser from '@babel/parser';
import { parse as parseHTML } from 'node-html-parser';
import { chromium } from 'playwright';

interface ComponentMetadata {
  name: string;
  props: { name: string; type: string }[];
  description: string;
  dependencies: string[];
  filePath: string;
  snippet: string;
  stateManagement: string[];
  interfaces: string[];
  testFile: string | null;
  stylingApproach: string;
  accessibility: { role: string; ariaAttributes: { [key: string]: string } }[];
  forms: { name: string; fields: { name: string; type: string }[] }[];
  eventHandlers: string[];
  lifecycleMethods: string[];
  customHooks: string[];
}

interface RouteMetadata {
  path: string;
  component: string;
  params?: string[];
  guards?: string[];
  parentRoute?: string;
}

interface ApiEndpointMetadata {
  path: string;
  method: string;
  parameters: { name: string; type: string }[];
  responseType?: string;
}

interface NavigationItem {
  label: string;
  path: string;
  children?: NavigationItem[];
}

interface ElementMetadata {
  tag: string;
  id?: string;
  classes: string[];
  attributes: { [key: string]: string };
  textContent?: string;
  children: ElementMetadata[];
}

interface PageMetadata {
  url: string;
  title: string;
  description: string;
  elements: ElementMetadata[];
}

interface AppMetadata {
  components: ComponentMetadata[];
  routes: RouteMetadata[];
  apiEndpoints: ApiEndpointMetadata[];
  performanceMetrics: { [key: string]: number };
  seoMetadata: { [key: string]: string };
  dependencyGraph: { [key: string]: string[] };
  entryPoints: string[];
  navigationStructure: NavigationItem[];
  pages: PageMetadata[];
  globalStyles: string[];
  thirdPartyScripts: string[];
  environmentVariables: string[];
  buildConfiguration: any;
}

async function analyzeComponent(filePath: string, project: Project): Promise<ComponentMetadata> {
  const source = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  let componentName = '';
  const props: { name: string; type: string }[] = [];
  let description = '';
  const dependencies: string[] = [];
  const stateManagement: string[] = [];
  const interfaces: string[] = [];
  let stylingApproach = 'None';
  const accessibility: { role: string; ariaAttributes: { [key: string]: string } }[] = [];
  const forms: { name: string; fields: { name: string; type: string }[] }[] = [];
  const eventHandlers: string[] = [];
  const lifecycleMethods: string[] = [];
  const customHooks: string[] = [];

  const { default: traverse } = await import('@babel/traverse');

  function extractPropsFromParams(params: any[]) {
    params.forEach(param => {
      if (param.type === 'ObjectPattern') {
        param.properties.forEach((prop: any) => {
          if (prop.type === 'ObjectProperty') {
            const propName = (prop.key as any).name;
            const propType = prop.value.typeAnnotation?.typeAnnotation.type || 'any';
            props.push({ name: propName, type: propType });
          }
        });
      } else if (param.type === 'Identifier' && param.name === 'props') {
        const typeAnnotation = param.typeAnnotation;
        if (typeAnnotation && typeAnnotation.type === 'TSTypeAnnotation') {
          const propType = typeAnnotation.typeAnnotation;
          if (propType.type === 'TSTypeLiteral') {
            propType.members.forEach((member: any) => {
              if (member.type === 'TSPropertySignature') {
                const propName = (member.key as any).name;
                const propType = (member.typeAnnotation as any)?.typeAnnotation?.type || 'any';
                props.push({ name: propName, type: propType });
              }
            });
          }
        }
      }
    });
  }

  traverse(ast, {
    FunctionDeclaration(path) {
      componentName = path.node.id?.name || '';
      const comments = path.node.leadingComments;
      if (comments && comments.length > 0) {
        description = comments[0].value.trim();
      }
      extractPropsFromParams(path.node.params);
      if (path.node.id && path.node.id.name.startsWith('use')) {
        customHooks.push(path.node.id.name);
      }
    },
    ArrowFunctionExpression(path) {
      if (path.parent.type === 'VariableDeclarator') {
        componentName = (path.parent.id as any).name;
        extractPropsFromParams(path.node.params);
      }
    },
    ImportDeclaration(path) {
      const importSource = path.node.source.value;
      if (importSource.startsWith('./') || importSource.startsWith('../')) {
        dependencies.push(importSource);
      }
      if (importSource.endsWith('.css') || importSource.endsWith('.scss')) {
        stylingApproach = 'CSS Modules';
      } else if (importSource.includes('styled-components')) {
        stylingApproach = 'Styled Components';
      } else if (importSource.includes('tailwindcss')) {
        stylingApproach = 'Tailwind CSS';
      }
    },
    CallExpression(path) {
      if (path.node.callee.type === 'Identifier') {
        const calleeName = path.node.callee.name;
        if (['useSelector', 'useDispatch', 'useContext', 'useState', 'useEffect', 'useCallback', 'useMemo'].includes(calleeName)) {
          stateManagement.push(calleeName);
        }
        if (calleeName === 'useForm') {
          const formName = path.parent.type === 'VariableDeclarator' ? (path.parent.id as any).name : 'anonymousForm';
          const formFields: { name: string; type: string }[] = [];
          
          path.node.arguments.forEach(arg => {
            if (arg.type === 'ObjectExpression') {
              arg.properties.forEach(prop => {
                if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                  formFields.push({ name: prop.key.name, type: 'unknown' });
                }
              });
            }
          });

          forms.push({ name: formName, fields: formFields });
        }
      }
    },
    TSInterfaceDeclaration(path) {
      interfaces.push(path.node.id.name);
    },
    TSTypeAliasDeclaration(path) {
      interfaces.push(path.node.id.name);
    },
    ClassDeclaration(path) {
      if (path.node.id) {
        componentName = path.node.id.name;
        path.node.body.body.forEach(member => {
          if (member.type === 'ClassProperty' && member.key.type === 'Identifier') {
            props.push({ name: member.key.name, type: (member.typeAnnotation as any)?.typeAnnotation?.type || 'any' });
          }
        });
      }
    },
    ClassMethod(path) {
      const methodName = (path.node.key as any).name;
      if (['componentDidMount', 'componentDidUpdate', 'componentWillUnmount'].includes(methodName)) {
        lifecycleMethods.push(methodName);
      }
    },
    JSXAttribute(path) {
      if ((path.node.name as any).name.startsWith('on')) {
        eventHandlers.push((path.node.name as any).name);
      }
    },
    JSXOpeningElement(path) {
      const attributes = path.node.attributes;
      const role = attributes.find((attr: any) => attr.type === 'JSXAttribute' && attr.name.name === 'role');
      const ariaAttributes = attributes.filter((attr: any) => 
        attr.type === 'JSXAttribute' && attr.name.name.toString().startsWith('aria-')
      );

      if (role || ariaAttributes.length > 0) {
        accessibility.push({
          role: role ? (role.value as any).value : '',
          ariaAttributes: ariaAttributes.reduce((acc: any, attr: any) => {
            acc[attr.name.name] = (attr.value as any).value;
            return acc;
          }, {})
        });
      }
    }
  });

  const snippet = source.split('\n').slice(0, 5).join('\n');

  if (stylingApproach === 'None') {
    if (source.includes('className=')) {
      stylingApproach = 'CSS Classes';
    } else if (source.includes('style=')) {
      stylingApproach = 'Inline Styles';
    }
  }

  const testFile = findTestFile(filePath);

  return {
    name: componentName,
    props,
    description,
    dependencies,
    filePath,
    snippet,
    stateManagement,
    interfaces,
    testFile,
    stylingApproach,
    accessibility,
    forms,
    eventHandlers,
    lifecycleMethods,
    customHooks
  };
}

function findTestFile(componentPath: string): string | null {
  const dir = path.dirname(componentPath);
  const baseName = path.basename(componentPath, path.extname(componentPath));
  const testFilePatterns = [
    `${baseName}.test.tsx`,
    `${baseName}.test.ts`,
    `${baseName}.spec.tsx`,
    `${baseName}.spec.ts`,
    `__tests__/${baseName}.test.tsx`,
    `__tests__/${baseName}.test.ts`
  ];

  for (const pattern of testFilePatterns) {
    const testPath = path.join(dir, pattern);
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  return null;
}

function analyzeRoutes(project: Project, rootDir: string): RouteMetadata[] {
  const routes: RouteMetadata[] = [];

  const routePatterns = [
    path.join(rootDir, 'src', 'app', 'routes.ts'),
    path.join(rootDir, 'src', 'app', 'routes.tsx'),
    path.join(rootDir, 'src', 'routes.ts'),
    path.join(rootDir, 'src', 'routes.tsx'),
    path.join(rootDir, 'pages', '**', '*.tsx'),  // For Next.js file-based routing
  ];

  routePatterns.forEach(pattern => {
    const files = glob.sync(pattern);
    files.forEach(filePath => {
      const sourceFile = project.addSourceFileAtPath(filePath);

      sourceFile.getVariableDeclarations().forEach(declaration => {
        if (declaration.getName() === 'routes') {
          const initializer = declaration.getInitializer();
          if (initializer && Node.isArrayLiteralExpression(initializer)) {
            initializer.getElements().forEach(element => {
              if (Node.isObjectLiteralExpression(element)) {
                const pathProp = element.getProperty('path');
                const componentProp = element.getProperty('component') || element.getProperty('element');

                if (pathProp && componentProp && Node.isPropertyAssignment(pathProp) && Node.isPropertyAssignment(componentProp)) {
                  const path = pathProp.getInitializer()?.getText().replace(/['"]/g, '');
                  const component = componentProp.getInitializer()?.getText().replace(/['"]/g, '');

                  if (path && component) {
                    const route: RouteMetadata = { path, component };
                    
                    // Extract route parameters
                    const params = path.match(/:[a-zA-Z]+/g);
                    if (params) {
                      route.params = params.map(param => param.slice(1));
                    }

                    // Extract route guards (if any)
                    const guardProp = element.getProperty('guard');
                    if (guardProp && Node.isPropertyAssignment(guardProp)) {
                      route.guards = [guardProp.getInitializer()?.getText() || ''];
                    }

                    routes.push(route);
                  }
                }
              }
            });
          }
        }
      });

      // For Next.js file-based routing
      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (defaultExport) {
        const name = defaultExport.getName();
        const filePath = sourceFile.getFilePath();
        const relativePath = path.relative(rootDir, filePath);
        const routePath = '/' + relativePath.replace(/\.(tsx|ts|js|jsx)$/, '').replace(/index$/, '');
        routes.push({ path: routePath, component: name });
      }
    });
  });

  return routes;
}

async function analyzeProductPages(rootDir: string): Promise<RouteMetadata[]> {
  const productsFilePath = path.join(rootDir, 'src', 'data', 'products.ts');
  const routes: RouteMetadata[] = [];

  if (fs.existsSync(productsFilePath)) {
    const content = fs.readFileSync(productsFilePath, 'utf-8');
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript']
    });

    const { default: traverse } = await import('@babel/traverse');

    traverse(ast, {
      VariableDeclarator(path) {
        if (path.node.id.name === 'products') {
          path.node.init.elements.forEach((element) => {
            const slugProperty = element.properties.find(prop => prop.key.name === 'slug');
            const nameProperty = element.properties.find(prop => prop.key.name === 'name');
            if (slugProperty && nameProperty) {
              const slug = slugProperty.value.value;
              const name = nameProperty.value.value;
              routes.push({
                path: `/product/${slug}`,
                component: `${name} Product Page`,
                parentRoute: '/product'
              });
            }
          });
        }
      }
    });
  }

  return routes;
}

async function analyzeApiEndpoints(rootDir: string): Promise<ApiEndpointMetadata[]> {
  const apiEndpoints: ApiEndpointMetadata[] = [];
  const apiDir = path.join(rootDir, 'src', 'api');

  if (fs.existsSync(apiDir)) {
    const files = glob.sync(path.join(apiDir, '**', '*.{ts,js}'));
    for (const filePath of files) {
      const source = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const { default: traverse } = await import('@babel/traverse');

      traverse(ast, {
        ExportDefaultDeclaration(path) {
          if (path.node.declaration.type === 'ObjectExpression') {
            const methods = ['get', 'post', 'put', 'delete', 'patch'];
            methods.forEach(method => {
              const prop = path.node.declaration.properties.find(p => p.key.name === method);
              if (prop) {
                const parameters: { name: string; type: string }[] = [];
                let responseType = 'unknown';
                if (prop.value.type === 'Function Expression' || prop.value.type === 'ArrowFunctionExpression') {
                  prop.value.params.forEach(param => {
                    if (param.type === 'Identifier') {
                      parameters.push({ name: param.name, type: 'unknown' });
                    }
                  });

                  // Try to extract response type
                  if (prop.value.returnType && prop.value.returnType.typeAnnotation) {
                    responseType = prop.value.returnType.typeAnnotation.type;
                  }
                }
                apiEndpoints.push({
                  path: `/${path.relative(apiDir, filePath).replace(/\.(ts|js)$/, '')}`,
                  method,
                  parameters,
                  responseType
                });
              }
            });
          }
        }
      });
    }
  }

  return apiEndpoints;
}

async function extractPerformanceMetrics(rootDir: string): Promise<{ [key: string]: number }> {
  const configPath = path.join(rootDir, 'next.config.js');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const ast = parser.parse(configContent, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    const metrics: { [key: string]: number } = {};

    const { default: traverse } = await import('@babel/traverse');

    traverse(ast, {
      ObjectProperty(path) {
        if (path.node.key.name === 'experimental') {
          path.node.value.properties.forEach((prop: any) => {
            if (prop.key.name === 'largePageDataBytes') {
              metrics.largePageDataBytes = prop.value.value;
            }
          });
        }
      }
    });

    return metrics;
  }
  return {};
}

async function extractSeoMetadata(rootDir: string): Promise<{ [key: string]: string }> {
  const seoMetadata: { [key: string]: string } = {};
  const indexPath = path.join(rootDir, 'pages', 'index.tsx');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const { default: traverse } = await import('@babel/traverse');

    traverse(ast, {
      JSXElement(path) {
        if (path.node.openingElement.name.name === 'Head') {
          path.node.children.forEach((child: any) => {
            if (child.type === 'JSXElement' && child.openingElement.name.name === 'meta') {
              const nameProp = child.openingElement.attributes.find((attr: any) => attr.name.name === 'name');
              const contentProp = child.openingElement.attributes.find((attr: any) => attr.name.name === 'content');
              if (nameProp && contentProp) {
                seoMetadata[nameProp.value.value] = contentProp.value.value;
              }
            }
          });
        }
      }
    });
  }

  return seoMetadata;
}

function createDependencyGraph(components: ComponentMetadata[]): { [key: string]: string[] } {
  const graph: { [key: string]: string[] } = {};
  components.forEach(component => {
    graph[component.name] = component.dependencies.map(dep => {
      const match = dep.match(/^['"](.+)['"]$/);
      return match ? match[1] : dep;
    });
  });
  return graph;
}

async function extractNavigationStructure(rootDir: string): Promise<NavigationItem[]> {
  const navigationStructure: NavigationItem[] = [];
  const navFiles = [
    path.join(rootDir, 'src', 'components', 'Navigation.tsx'),
    path.join(rootDir, 'src', 'components', 'Header.tsx'),
    path.join(rootDir, 'src', 'components', 'Sidebar.tsx'),
    // Add more potential locations for navigation components
  ];
  for (const filePath of navFiles) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      const { default: traverse } = await import('@babel/traverse');

      traverse(ast, {
        JSXElement(path) {
          if (path.node.openingElement.name.name === 'Link' || path.node.openingElement.name.name === 'NavLink') {
            const hrefAttr = path.node.openingElement.attributes.find((attr: any) => attr.name.name === 'href');
            const labelNode = path.node.children.find((child: any) => child.type === 'JSXText' || child.type === 'StringLiteral');
            
            if (hrefAttr && labelNode) {
              const href = (hrefAttr.value as any).value;
              const label = labelNode.type === 'JSXText' ? labelNode.value.trim() : labelNode.value;
              navigationStructure.push({ label, path: href });
            }
          }
        }
      });
    }
  }
  return navigationStructure;
}

function identifyEntryPoints(rootDir: string): string[] {
  const entryPoints: string[] = [];
  const possibleEntryPoints = [
    path.join(rootDir, 'src', 'index.tsx'),
    path.join(rootDir, 'src', 'main.tsx'),
    path.join(rootDir, 'pages', '_app.tsx'),
    path.join(rootDir, 'src', 'app', 'layout.tsx'),
  ];
  possibleEntryPoints.forEach(entryPoint => {
    if (fs.existsSync(entryPoint)) {
      entryPoints.push(entryPoint);
    }
  });
  return entryPoints;
}

async function analyzeElement(element: any): Promise<ElementMetadata> {
  if (!element || typeof element !== 'object') {
    console.warn('Invalid element received:', element);
    return {
      tag: 'unknown',
      classes: [],
      attributes: {},
      children: []
    };
  }

  const metadata: ElementMetadata = {
    tag: element.tagName ? element.tagName.toLowerCase() : 'unknown',
    classes: element.classList ? Array.from(element.classList) : [],
    attributes: {},
    children: []
  };

  if (element.id) {
    metadata.id = element.id;
  }

  if (element.attributes) {
    if (Array.isArray(element.attributes)) {
      for (const attr of element.attributes) {
        metadata.attributes[attr.name] = attr.value;
      }
    } else if (typeof element.attributes === 'object') {
      Object.keys(element.attributes).forEach(key => {
        metadata.attributes[key] = element.attributes[key];
      });
    }
  }

  if (element.textContent && (!element.childNodes || element.childNodes.length === 0)) {
    metadata.textContent = element.textContent.trim();
  }

  if (element.childNodes) {
    for (const child of element.childNodes) {
      if (child.nodeType === 1) { // Element node
        metadata.children.push(await analyzeElement(child));
      }
    }
  }

  return metadata;
}

async function analyzePage(url: string): Promise<PageMetadata> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const pageMetadata: PageMetadata = {
      url,
      title: await page.title(),
      description: await page.$eval('meta[name="description"]', (element: any) => element.content).catch(() => ''),
      elements: []
    };

    const bodyHTML = await page.evaluate(() => document.body.innerHTML);

    if (!bodyHTML) {
      console.warn('No HTML content found for page:', url);
      return pageMetadata;
    }

    const root = parseHTML(bodyHTML);
    const rootElement = await analyzeElement(root);
    pageMetadata.elements = [rootElement]; // Wrap in an array

    return pageMetadata;
  } catch (error) {
    console.error('Error analyzing page:', url, error);
    return {
      url,
      title: 'Error',
      description: 'Failed to analyze page',
      elements: []
    };
  } finally {
    await browser.close();
  }
}

async function analyzeGlobalStyles(rootDir: string): Promise<string[]> {
  const globalStyles: string[] = [];
  const styleFiles = glob.sync(path.join(rootDir, 'src', '**', '*.{css,scss,less}'));
  
  styleFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes(':root') || content.includes('html') || content.includes('body')) {
      globalStyles.push(file);
    }
  });

  return globalStyles;
}

function analyzeThirdPartyScripts(rootDir: string): string[] {
  const scripts: string[] = [];
  const htmlFiles = glob.sync(path.join(rootDir, '**', '*.html'));
  
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/<script[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/g);
    if (matches) {
      scripts.push(...matches);
    }
  });

  return scripts;
}

function analyzeEnvironmentVariables(rootDir: string): string[] {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  const variables: string[] = [];

  envFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(/^[A-Z_][A-Z0-9_]*=/gm);
      if (matches) {
        variables.push(...matches.map(match => match.slice(0, -1)));
      }
    }
  });

  return variables;
}

function analyzeBuildConfiguration(rootDir: string): any {
  const configFiles = ['next.config.js', 'webpack.config.js', 'tsconfig.json', 'package.json'];
  const config: any = {};

  configFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        config[file] = JSON.parse(content);
      } catch {
        // If it's not JSON, it's likely a JS file
        config[file] = 'Non-JSON configuration file';
      }
    }
  });

  return config;
}

async function generateAppMetadata(rootDir: string): Promise<AppMetadata> {
  const components: ComponentMetadata[] = [];
  const project = new Project();
  let routes = analyzeRoutes(project, rootDir);
  const productRoutes = await analyzeProductPages(rootDir);
  routes = routes.concat(productRoutes);

  async function analyzeDir(dir: string) {
    const files = glob.sync(path.join(dir, '**', '*.{tsx,jsx,ts,js}'));
    for (const filePath of files) {
      if (filePath.includes('node_modules')) continue;

      const metadata = await analyzeComponent(filePath, project);
      if (metadata.name) {
        components.push(metadata);
      }
    }
  }

  await analyzeDir(path.join(rootDir, 'src'));
  await analyzeDir(path.join(rootDir, 'pages')); // For Next.js projects

  const apiEndpoints = await analyzeApiEndpoints(rootDir);
  const performanceMetrics = await extractPerformanceMetrics(rootDir);
  const seoMetadata = await extractSeoMetadata(rootDir);
  const dependencyGraph = createDependencyGraph(components);
  const navigationStructure = await extractNavigationStructure(rootDir);
  const entryPoints = identifyEntryPoints(rootDir);

  const pages: PageMetadata[] = [];
  for (const route of routes) {
    const pageMetadata = await analyzePage(`http://localhost:3000${route.path}`);
    pages.push(pageMetadata);
  }

  const globalStyles = await analyzeGlobalStyles(rootDir);
  const thirdPartyScripts = analyzeThirdPartyScripts(rootDir);
  const environmentVariables = analyzeEnvironmentVariables(rootDir);
  const buildConfiguration = analyzeBuildConfiguration(rootDir);

  return {
    components,
    routes,
    apiEndpoints,
    performanceMetrics,
    seoMetadata,
    dependencyGraph,
    navigationStructure,
    entryPoints,
    pages,
    globalStyles,
    thirdPartyScripts,
    environmentVariables,
    buildConfiguration
  };
}

async function generateMetadataFile(rootDir: string) {
  try {
    const metadata = await generateAppMetadata(rootDir);

    const outputDir = "/Users/williamphan/Desktop/tourguide/src/app/sdk/metadata"
    const outputPath = path.join(outputDir, 'app-metadata.json');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata file generated successfully at ${outputPath}`);
  } catch (error) {
    console.error('Error generating metadata file:', error);
  }
}

export { generateAppMetadata, generateMetadataFile };