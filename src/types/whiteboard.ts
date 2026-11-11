/**
 * PHENOL ACADEMY — Whiteboard Type Definitions
 * Purpose-built for Dr. Omar Magdi's academic chemistry instruction.
 */

export type WhiteboardTool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'laser'
  | 'shape'
  | 'text'
  | 'table'
  | 'formula'
  | 'molecule'
  | 'mindmap'
  | 'energy_diagram'
  | 'image';

export type ShapeKind =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'curved_arrow'
  | 'double_headed_arrow'
  | 'triangle';

export type BackgroundPattern = 'ivory_blank' | 'grid' | 'dots' | 'dark_chalkboard' | 'dark_grid';

export interface ViewportTransform {
  x: number; // pan offset X in screen px
  y: number; // pan offset Y in screen px
  zoom: number; // scale factor (e.g. 1.0 = 100%)
}

export interface Point2D {
  x: number;
  y: number;
  pressure?: number;
}

export interface BaseWhiteboardElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  zIndex: number;
  isLocked?: boolean;
}

export interface StrokeElement extends BaseWhiteboardElement {
  type: 'stroke';
  points: Point2D[];
  color: string;
  size: number;
  isHighlighter?: boolean;
  opacity?: number;
}

export interface ShapeElement extends BaseWhiteboardElement {
  type: 'shape';
  shapeKind: ShapeKind;
  width: number;
  height: number;
  endX?: number; // for straight lines & arrows
  endY?: number;
  controlX?: number; // for curved reaction arrows
  controlY?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed';
}

export interface TextElement extends BaseWhiteboardElement {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  width?: number;
}

export interface TableElement extends BaseWhiteboardElement {
  type: 'table';
  rows: number;
  cols: number;
  headers: string[];
  cells: string[][];
  colWidths: number[];
  rowHeight: number;
  borderColor: string;
  headerBgColor: string;
  cellBgColor: string;
}

export interface ChemicalFormulaElement extends BaseWhiteboardElement {
  type: 'formula';
  equation: string; // e.g. "CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O"
  subtitle?: string; // reaction conditions e.g. "conc. H2SO4, 180°C"
  deltaH?: string; // e.g. "ΔH = -890 kJ/mol"
  fontSize: number;
  color: string;
}

export interface ChemAtom {
  id: string;
  symbol: string; // "C", "H", "O", "N", "Cl", etc.
  x: number;
  y: number;
  charge?: number; // +1, -1
  lonePairs?: number; // 1, 2
}

export interface ChemBond {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  bondOrder: 1 | 2 | 3 | 'wedge' | 'dash';
}

export interface CurvedMechanismArrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
  barbCount: 1 | 2; // 1 = radical single electron, 2 = electron pair
}

export interface MoleculeElement extends BaseWhiteboardElement {
  type: 'molecule';
  name: string; // e.g. "Benzene", "Toluene", "Phenol", "Esterification Mechanism"
  atoms: ChemAtom[];
  bonds: ChemBond[];
  curvedArrows: CurvedMechanismArrow[];
  showCarbons?: boolean;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  children?: MindMapNode[];
}

export interface MindMapElement extends BaseWhiteboardElement {
  type: 'mindmap';
  title: string;
  rootNode: MindMapNode;
}

export interface EnergyDiagramElement extends BaseWhiteboardElement {
  type: 'energy_diagram';
  reactionName: string;
  isExothermic: boolean; // exothermic vs endothermic
  reactantsLabel: string;
  productsLabel: string;
  eaLabel: string; // Activation Energy
  deltaHLabel: string; // Enthalpy change
  width: number;
  height: number;
}

export interface ImageElement extends BaseWhiteboardElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
}

export type WhiteboardElement =
  | StrokeElement
  | ShapeElement
  | TextElement
  | TableElement
  | ChemicalFormulaElement
  | MoleculeElement
  | MindMapElement
  | EnergyDiagramElement
  | ImageElement;

export interface WhiteboardDocument {
  id: string;
  title: string;
  courseId?: string;
  lessonId?: string;
  elements: WhiteboardElement[];
  viewport: ViewportTransform;
  background: BackgroundPattern;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}
