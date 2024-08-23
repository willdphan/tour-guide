// npx tsx src/app/sdk/run_sdk.ts

import * as fs from 'fs';
import * as path from 'path';
import { Node, Project, PropertyAssignment, SourceFile, SyntaxKind } from 'ts-morph';

import * as parser from '@babel/parser';

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

  // Import traverse dynamically
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
        if (['useSelector', 'useDispatch', 'useContext'].includes(calleeName)) {
          stateManagement.push(calleeName);
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
    }
  });

  const snippet = source.split('\n').slice(0, 5).join('\n');

  // Determine styling approach if not already set
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
    stylingApproach
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
  const routesFilePath = path.join(rootDir, 'src', 'app', 'routes.ts');
  
  if (!fs.existsSync(routesFilePath)) {
    console.warn(`Warning: Routes file not found at ${routesFilePath}`);
    return [];
  }

  const sourceFile = project.addSourceFileAtPath(routesFilePath);
  const routes: RouteMetadata[] = [];

  sourceFile.getVariableDeclarations().forEach(declaration => {
    if (declaration.getName() === 'routes') {
      const initializer = declaration.getInitializer();
      if (initializer && Node.isArrayLiteralExpression(initializer)) {
        initializer.getElements().forEach(element => {
          if (Node.isObjectLiteralExpression(element)) {
            const pathProp = element.getProperty('path');
            const nameProp = element.getProperty('name');

            if (pathProp && nameProp && Node.isPropertyAssignment(pathProp) && Node.isPropertyAssignment(nameProp)) {
              const path = pathProp.getInitializer()?.getText();
              const name = nameProp.getInitializer()?.getText();

              if (path && name) {
                routes.push({ path: path.replace(/'/g, ''), component: name.replace(/'/g, '') });
              }
            }
          }
        });
      }
    }
  });

  return routes;
}

async function generateAppMetadata(rootDir: string): Promise<AppMetadata> {
  const components: ComponentMetadata[] = [];
  const project = new Project();
  const routes = analyzeRoutes(project, rootDir);

  async function analyzeDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        await analyzeDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const metadata = await analyzeComponent(filePath, project);
        if (metadata.name) {
          components.push(metadata);
        }
      }
    }
  }

  await analyzeDir(path.join(rootDir, 'src', 'app'));

  return { components, routes };
}

async function generateMetadataFile(rootDir: string) {
  const metadata = await generateAppMetadata(rootDir);
  
  const outputDir = path.join(rootDir, 'src', 'app', 'api', 'parse', 'metadata');
  const outputPath = path.join(outputDir, 'app-metadata.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata file generated at ${outputPath}`);
}

export { generateAppMetadata, generateMetadataFile };