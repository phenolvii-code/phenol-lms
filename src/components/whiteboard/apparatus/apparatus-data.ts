export interface ApparatusItemInfo {
  kind: string;
  name: string;
  arabicName: string;
  category: 'Glassware' | 'Assembly & Heating' | 'Gas & Reaction' | 'Measurement';
  width: number;
  height: number;
  defaultLiquidColor?: string;
  defaultLiquidLevel?: number;
  description: string;
}

export const APPARATUS_CATALOG: ApparatusItemInfo[] = [
  // Glassware & Containers
  {
    kind: 'beaker',
    name: 'Graduated Beaker (250 mL)',
    arabicName: 'كأس مدرج (بشر)',
    category: 'Glassware',
    width: 100,
    height: 120,
    defaultLiquidColor: '#2563EB', // CuSO4 blue
    defaultLiquidLevel: 0.55,
    description: 'Standard cylindrical beaker with pour spout and volume graduation lines.',
  },
  {
    kind: 'erlenmeyer',
    name: 'Conical Flask (Erlenmeyer)',
    arabicName: 'دورق مخروطي (إرلنماير)',
    category: 'Glassware',
    width: 110,
    height: 140,
    defaultLiquidColor: '#EC4899', // Phenolphthalein endpoint
    defaultLiquidLevel: 0.45,
    description: 'Conical titration flask with narrow neck to prevent splashing during swirling.',
  },
  {
    kind: 'round_bottom_flask',
    name: 'Round-Bottom Flask',
    arabicName: 'دورق كروي (مستدير القاع)',
    category: 'Glassware',
    width: 100,
    height: 140,
    defaultLiquidColor: '#C9A038',
    defaultLiquidLevel: 0.5,
    description: 'Spherical flask for uniform heating in organic synthesis and boiling.',
  },
  {
    kind: 'distilling_flask',
    name: 'Distillation Flask with Side Arm',
    arabicName: 'دورق تقطير ذو شعبة جانبية',
    category: 'Glassware',
    width: 130,
    height: 150,
    defaultLiquidColor: '#B91C1C',
    defaultLiquidLevel: 0.4,
    description: 'Round flask with 75-degree angled side arm for vapor exit into condenser.',
  },
  {
    kind: 'test_tube',
    name: 'Test Tube with Solution',
    arabicName: 'أنبوبة اختبار',
    category: 'Glassware',
    width: 36,
    height: 130,
    defaultLiquidColor: '#059669', // Fe2+ green
    defaultLiquidLevel: 0.6,
    description: 'Cylindrical test tube with curved bottom and liquid meniscus.',
  },
  {
    kind: 'test_tube_rack',
    name: 'Test Tube Rack (6 Tubes)',
    arabicName: 'حامل أنابيب اختبار',
    category: 'Glassware',
    width: 170,
    height: 110,
    description: 'Laboratory rack holding multiple test tubes with varying reagent colors.',
  },
  {
    kind: 'watch_glass_dish',
    name: 'Evaporating Dish & Watch Glass',
    arabicName: 'جفنة تبخير وزجاجة ساعة',
    category: 'Glassware',
    width: 110,
    height: 60,
    defaultLiquidColor: '#3B82F6',
    defaultLiquidLevel: 0.35,
    description: 'Porcelain shallow evaporating dish for crystallization and drying.',
  },

  // Assembly & Heating
  {
    kind: 'burette_stand',
    name: 'Burette on Retort Stand with Clamp',
    arabicName: 'سحاحة كاملة مع حامل وماسك',
    category: 'Assembly & Heating',
    width: 110,
    height: 240,
    defaultLiquidColor: '#7C3AED', // KMnO4 purple
    defaultLiquidLevel: 0.7,
    description: 'Accurate volumetric burette with stopcock valve, clamp, and heavy cast-iron base.',
  },
  {
    kind: 'bunsen_burner_tripod',
    name: 'Bunsen Burner with Tripod & Gauze',
    arabicName: 'موقد بنزن مع حامل ثلاثي وشبكة تسخين',
    category: 'Assembly & Heating',
    width: 120,
    height: 180,
    description: 'Gas burner with luminous/non-luminous flame, cast tripod, and ceramic wire gauze.',
  },
  {
    kind: 'crucible_tripod',
    name: 'Porcelain Crucible on Pipeclay Triangle',
    arabicName: 'بوتقة تسخين على مثلث خزفي',
    category: 'Assembly & Heating',
    width: 100,
    height: 150,
    description: 'High-temperature porcelain crucible with lid for strong thermal decomposition.',
  },
  {
    kind: 'liebig_condenser',
    name: 'Liebig Water Condenser',
    arabicName: 'مكثف ليبيج المائي',
    category: 'Assembly & Heating',
    width: 180,
    height: 80,
    defaultLiquidColor: '#60A5FA',
    description: 'Double-jacketed counter-current cooling condenser with water inlet/outlet nipples.',
  },
  {
    kind: 'separatory_funnel',
    name: 'Separatory Funnel (Two Phases)',
    arabicName: 'قمع فصل (طبقتان غير ممتزجتين)',
    category: 'Assembly & Heating',
    width: 90,
    height: 180,
    defaultLiquidColor: '#F59E0B', // Organic layer + aqueous layer
    defaultLiquidLevel: 0.65,
    description: 'Pear-shaped funnel with PTFE tap displaying immiscible organic and aqueous layers.',
  },

  // Gas & Reaction Setups
  {
    kind: 'boiling_delivery_tube',
    name: 'Boiling Tube with Delivery Tube',
    arabicName: 'أنبوبة غليان مع أنبوبة توصيل كوعية',
    category: 'Gas & Reaction',
    width: 140,
    height: 140,
    defaultLiquidColor: '#78350F',
    defaultLiquidLevel: 0.45,
    description: 'Gas generation apparatus (e.g. Methane preparation from sodium acetate + soda lime).',
  },
  {
    kind: 'gas_collecting_trough',
    name: 'Pneumatic Trough & Inverted Gas Jar',
    arabicName: 'حوض مائي ومخبار تجميع الغاز فوق الماء',
    category: 'Gas & Reaction',
    width: 180,
    height: 140,
    defaultLiquidColor: '#38BDF8',
    defaultLiquidLevel: 0.5,
    description: 'Classic gas collection apparatus over water for insoluble organic gases (CH4, C2H4, C2H2).',
  },
  {
    kind: 'u_tube',
    name: 'U-Tube for Gas Drying / Electrolysis',
    arabicName: 'أنبوبة على شكل حرف U للتجفيف والتحليل الكهربي',
    category: 'Gas & Reaction',
    width: 110,
    height: 130,
    defaultLiquidColor: '#93C5FD',
    defaultLiquidLevel: 0.5,
    description: 'U-shaped drying tube with calcium chloride granules or electrolysis limbs.',
  },
  {
    kind: 'buchner_funnel',
    name: 'Buchner Funnel & Filter Flask',
    arabicName: 'قمع بوخنر ودورق ترشيح مفرغ',
    category: 'Gas & Reaction',
    width: 110,
    height: 160,
    description: 'Suction vacuum filtration apparatus with porcelain Buchner funnel and side-arm flask.',
  },

  // Measurement & Liquid Handling
  {
    kind: 'graduated_cylinder',
    name: 'Graduated Measuring Cylinder (100 mL)',
    arabicName: 'مخبار مدرج دقيق (100 مل)',
    category: 'Measurement',
    width: 60,
    height: 170,
    defaultLiquidColor: '#0EA5E9',
    defaultLiquidLevel: 0.65,
    description: 'Tall graduated cylinder with hexagonal base and volumetric calibration ticks.',
  },
  {
    kind: 'thermometer',
    name: 'Laboratory Thermometer (-10°C to 110°C)',
    arabicName: 'ترمومتر معملي دقيق مدرج',
    category: 'Measurement',
    width: 30,
    height: 180,
    description: 'Stem thermometer with red alcohol expansion reservoir and degree graduations.',
  },
  {
    kind: 'dropper',
    name: 'Pasteur Pipette / Dropper with Bulb',
    arabicName: 'قطارة كيميائية مع انتفاخ مطاطي',
    category: 'Measurement',
    width: 40,
    height: 140,
    defaultLiquidColor: '#EF4444',
    description: 'Glass dropper with red suction bulb and hanging solution droplet at tip.',
  },
];
