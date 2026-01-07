export type ElementType = 'person' | 'system' | 'container' | 'component';

export interface BaseElement {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  properties?: Record<string, any>;
}

export interface Person extends BaseElement {
  type: 'person';
}

export interface SoftwareSystem extends BaseElement {
  type: 'system';
  external?: boolean;
}

export interface Container extends BaseElement {
  type: 'container';
  technology?: string[];
  systemId: string;
}

export interface Component extends BaseElement {
  type: 'component';
  technology?: string[];
  systemId: string;
  containerId: string;
}

export type Element = Person | SoftwareSystem | Container | Component;

export interface Relationship {
  from: string;
  to: string;
  description?: string;
  technology?: string[];
  tags?: string[];
  properties?: Record<string, any>;
}

export interface FlowStep {
  seq: number;
  from: string;
  to: string;
  description?: string;
  technology?: string[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
  tags?: string[];
}

export interface ContainerInstance {
  container: string;
  replicas?: number;
  properties?: Record<string, any>;
}

export interface DeploymentNode {
  id: string;
  name: string;
  technology?: string[];
  children?: DeploymentNode[];
  instances?: ContainerInstance[];
  properties?: Record<string, any>;
}

export interface Deployment {
  id: string;
  name: string;
  description?: string;
  nodes?: DeploymentNode[];
}

export interface C4Model {
  persons: Person[];
  systems: SoftwareSystem[];
  containers: Container[];
  components: Component[];
  relationships: Relationship[];
  flows: Flow[];
  deployments: Deployment[];
  options: Options;
}

export type ViewType = 'landscape' | 'context' | 'container' | 'component' | 'deployment';

// Flattened deployment node for rendering (includes parent path for nesting)
export interface FlatDeploymentNode {
  type: 'deploymentNode';
  id: string;
  name: string;
  technology?: string[];
  depth: number;
  parentId?: string;
  instances?: ContainerInstance[];
  hasChildren?: boolean;
  childCount?: number;
}

// Instance node representing a deployed container (pod)
export interface FlatInstanceNode {
  type: 'instanceNode';
  id: string;
  name: string;
  containerRef: string;
  replicas?: number;
  parentId: string;
  depth: number;
}

export type DeploymentElement = FlatDeploymentNode | FlatInstanceNode;

export interface Options {
  showMinimap: boolean;
}
