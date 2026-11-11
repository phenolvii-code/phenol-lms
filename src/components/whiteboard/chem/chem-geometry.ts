import { ChemAtom, ChemBond, MoleculeElement } from '@/types/whiteboard';

const BOND_LENGTH = 44; // Standard ChemDraw bond length in px

/**
 * Calculates the standard zigzag coordinates for sprouting a new atom from an existing atom.
 * Follows ChemDraw standard valence angles (120° for sp2/sp3 projection).
 */
export function calculateNextZigzagPos(
  atoms: ChemAtom[],
  bonds: ChemBond[],
  clickedAtomId: string
): { x: number; y: number } {
  const atom = atoms.find((a) => a.id === clickedAtomId);
  if (!atom) return { x: 0, y: 0 };

  // Find all bonds connected to this atom
  const connectedBonds = bonds.filter(
    (b) => b.fromAtomId === clickedAtomId || b.toAtomId === clickedAtomId
  );

  if (connectedBonds.length === 0) {
    // First bond: sprout up-right at 30 degrees (pi / 6)
    const angle = -Math.PI / 6;
    return {
      x: Math.round(atom.x + BOND_LENGTH * Math.cos(angle)),
      y: Math.round(atom.y + BOND_LENGTH * Math.sin(angle)),
    };
  }

  if (connectedBonds.length === 1) {
    // Single connected bond: alternate zigzag!
    const bond = connectedBonds[0];
    const otherId = bond.fromAtomId === clickedAtomId ? bond.toAtomId : bond.fromAtomId;
    const otherAtom = atoms.find((a) => a.id === otherId);
    if (!otherAtom) {
      return { x: atom.x + BOND_LENGTH, y: atom.y };
    }

    // Incoming vector from otherAtom -> atom
    const incomingAngle = Math.atan2(atom.y - otherAtom.y, atom.x - otherAtom.x);

    // Standard organic chemistry alternates +120° or -120° (2*pi/3)
    // We check the vertical deflection: if incoming went up, we go down (+60° relative to horizontal)
    const deltaY = atom.y - otherAtom.y;
    let nextAngle: number;
    if (deltaY < 0) {
      // Was climbing up, now descend down-right (+30 deg)
      nextAngle = Math.PI / 6;
    } else {
      // Was descending down, now climb up-right (-30 deg)
      nextAngle = -Math.PI / 6;
    }

    // If moving leftwards, mirror horizontally
    if (atom.x < otherAtom.x) {
      nextAngle = Math.PI - nextAngle;
    }

    return {
      x: Math.round(atom.x + BOND_LENGTH * Math.cos(nextAngle)),
      y: Math.round(atom.y + BOND_LENGTH * Math.sin(nextAngle)),
    };
  }

  if (connectedBonds.length === 2) {
    // Branching! Sprout at the angle opposite to the average of the 2 existing bonds
    const angles = connectedBonds.map((b) => {
      const otherId = b.fromAtomId === clickedAtomId ? b.toAtomId : b.fromAtomId;
      const otherAtom = atoms.find((a) => a.id === otherId);
      return otherAtom ? Math.atan2(otherAtom.y - atom.y, otherAtom.x - atom.x) : 0;
    });

    // Average vector of the two existing bonds
    const avgX = Math.cos(angles[0]) + Math.cos(angles[1]);
    const avgY = Math.sin(angles[0]) + Math.sin(angles[1]);
    const branchAngle = Math.atan2(-avgY, -avgX);

    return {
      x: Math.round(atom.x + BOND_LENGTH * Math.cos(branchAngle)),
      y: Math.round(atom.y + BOND_LENGTH * Math.sin(branchAngle)),
    };
  }

  // 3 or more bonds: quaternary carbon
  const angles = connectedBonds.map((b) => {
    const otherId = b.fromAtomId === clickedAtomId ? b.toAtomId : b.fromAtomId;
    const otherAtom = atoms.find((a) => a.id === otherId);
    return otherAtom ? Math.atan2(otherAtom.y - atom.y, otherAtom.x - atom.x) : 0;
  });
  // Pick an angle maximally distant from existing angles
  const branchAngle = angles[0] + Math.PI / 2;
  return {
    x: Math.round(atom.x + BOND_LENGTH * Math.cos(branchAngle)),
    y: Math.round(atom.y + BOND_LENGTH * Math.sin(branchAngle)),
  };
}

/**
 * Creates a standalone Benzene ring anchored at (x, y)
 */
export function createBenzeneRing(centerX: number, centerY: number, radius = 40): { atoms: ChemAtom[]; bonds: ChemBond[] } {
  const atoms: ChemAtom[] = [];
  const bonds: ChemBond[] = [];
  const prefix = `bz-${Date.now()}`;

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    atoms.push({
      id: `${prefix}-a${i}`,
      symbol: 'C',
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    });
  }

  for (let i = 0; i < 6; i++) {
    const nextIdx = (i + 1) % 6;
    bonds.push({
      id: `${prefix}-b${i}`,
      fromAtomId: atoms[i].id,
      toAtomId: atoms[nextIdx].id,
      bondOrder: i % 2 === 0 ? 2 : 1, // Alternating double bonds
    });
  }

  return { atoms, bonds };
}

/**
 * Creates a Cyclohexane ring (single bonds)
 */
export function createCyclohexaneRing(centerX: number, centerY: number, radius = 40): { atoms: ChemAtom[]; bonds: ChemBond[] } {
  const ring = createBenzeneRing(centerX, centerY, radius);
  ring.bonds.forEach((b) => {
    b.bondOrder = 1;
  });
  return ring;
}

/**
 * Creates a Cyclopentane ring (5-carbon ring)
 */
export function createCyclopentaneRing(centerX: number, centerY: number, radius = 38): { atoms: ChemAtom[]; bonds: ChemBond[] } {
  const atoms: ChemAtom[] = [];
  const bonds: ChemBond[] = [];
  const prefix = `cp-${Date.now()}`;

  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    atoms.push({
      id: `${prefix}-a${i}`,
      symbol: 'C',
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    });
  }

  for (let i = 0; i < 5; i++) {
    const nextIdx = (i + 1) % 5;
    bonds.push({
      id: `${prefix}-b${i}`,
      fromAtomId: atoms[i].id,
      toAtomId: atoms[nextIdx].id,
      bondOrder: 1,
    });
  }

  return { atoms, bonds };
}
