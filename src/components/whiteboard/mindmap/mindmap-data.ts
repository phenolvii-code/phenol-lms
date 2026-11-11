import { MindMapNode } from '@/types/whiteboard';

export interface MindMapPreset {
  id: string;
  title: string;
  description: string;
  rootNode: MindMapNode;
}

export const MINDMAP_PRESETS: MindMapPreset[] = [
  {
    id: 'hydrocarbons',
    title: 'Hydrocarbons Classification (تصنيف الهيدروكربونات)',
    description: 'Complete breakdown of Aliphatic vs Aromatic hydrocarbons for Thanaweya Amma.',
    rootNode: {
      id: 'root-hc',
      text: 'الهيدروكربونات (Hydrocarbons)',
      x: 0,
      y: 0,
      color: '#501325',
      children: [
        {
          id: 'hc-aliphatic',
          text: 'أليفاتية (Aliphatic)',
          x: -180,
          y: -80,
          color: '#1E3A8A',
          children: [
            {
              id: 'hc-alkanes',
              text: 'ألكانات مشبعة (CₙH₂ₙ₊₂)',
              x: -330,
              y: -140,
              color: '#065F46',
            },
            {
              id: 'hc-alkenes',
              text: 'ألكينات غير مشبعة (CₙH₂ₙ)',
              x: -330,
              y: -80,
              color: '#065F46',
            },
            {
              id: 'hc-alkynes',
              text: 'ألكاينات ثلاثية (CₙH₂ₙ₋₂)',
              x: -330,
              y: -20,
              color: '#065F46',
            },
            {
              id: 'hc-cyclo',
              text: 'ألكانات حلقية مشبعة',
              x: -330,
              y: 40,
              color: '#065F46',
            },
          ],
        },
        {
          id: 'hc-aromatic',
          text: 'أروماتية (Aromatic)',
          x: 180,
          y: -80,
          color: '#C9A038',
          children: [
            {
              id: 'hc-benzene',
              text: 'بنزين عطري (C₆H₆)',
              x: 320,
              y: -120,
              color: '#B91C1C',
            },
            {
              id: 'hc-toluene',
              text: 'طولوين (C₆H₅CH₃)',
              x: 320,
              y: -60,
              color: '#B91C1C',
            },
            {
              id: 'hc-naphthalene',
              text: 'نفثالين (C₁₀H₈)',
              x: 320,
              y: 0,
              color: '#B91C1C',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'functional_groups',
    title: 'Functional Groups & Derivatives (مشتقات الهيدروكربونات)',
    description: 'Alcohols, Phenols, Aldehydes, Ketones, Carboxylic Acids & Esters.',
    rootNode: {
      id: 'root-fg',
      text: 'مشتقات الهيدروكربونات',
      x: 0,
      y: 0,
      color: '#501325',
      children: [
        {
          id: 'fg-alcohols',
          text: 'كحولات وفينولات (-OH)',
          x: -200,
          y: -90,
          color: '#059669',
        },
        {
          id: 'fg-carbonyl',
          text: 'ألدهيدات وكيتونات (>C=O)',
          x: -200,
          y: 70,
          color: '#0284C7',
        },
        {
          id: 'fg-acids',
          text: 'أحماض كربوكسيلية (-COOH)',
          x: 200,
          y: -90,
          color: '#D97706',
        },
        {
          id: 'fg-esters',
          text: 'إسترات عضوية (-COO-)',
          x: 200,
          y: 70,
          color: '#9333EA',
        },
      ],
    },
  },
  {
    id: 'blank_mindmap',
    title: 'Blank Mind Map (خريطة ذهنية جديدة)',
    description: 'Start with a central topic node and sprout branches freely.',
    rootNode: {
      id: 'root-blank',
      text: 'الموضوع الرئيسي (Central Topic)',
      x: 0,
      y: 0,
      color: '#501325',
      children: [
        { id: 'b-1', text: 'فكرة رئيسية 1 (Branch 1)', x: -160, y: -60, color: '#1E3A8A' },
        { id: 'b-2', text: 'فكرة رئيسية 2 (Branch 2)', x: 160, y: -60, color: '#065F46' },
      ],
    },
  },
];
