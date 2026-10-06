import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EMPTY_WIZARD_DETAILS, type WizardDetails } from "@/validation/property";

export type WizardStep = 1 | 2 | 3 | 4;

/** One unit of the draft. `createdId` is set once the backend has created it, so a retry skips it. */
export interface WizardUnit {
  key: string;
  label: string;
  description: string;
  floor: string;
  createdId?: string;
}

interface WizardState {
  step: WizardStep;
  details: WizardDetails;
  units: WizardUnit[];
  /** Set right after the property is created, so a retry never creates a second one. */
  propertyId?: string;
  imagesUploaded: boolean;
  setStep: (step: WizardStep) => void;
  setDetails: (patch: Partial<WizardDetails>) => void;
  addUnit: (unit: Omit<WizardUnit, "key" | "createdId">) => void;
  updateUnit: (key: string, patch: Omit<WizardUnit, "key" | "createdId">) => void;
  removeUnit: (key: string) => void;
  markUnitCreated: (key: string, createdId: string) => void;
  setPropertyId: (propertyId: string) => void;
  markImagesUploaded: () => void;
  reset: () => void;
}

const INITIAL = {
  step: 1 as WizardStep,
  details: EMPTY_WIZARD_DETAILS,
  units: [] as WizardUnit[],
  propertyId: undefined as string | undefined,
  imagesUploaded: false,
};

/**
 * Draft of the create-property wizard, kept in sessionStorage so a refresh keeps the work.
 * Only the form fields, units, step, property id, created unit ids and the images flag are saved.
 * Image files are never stored. Hydration is manual (see the wizard) to avoid a server mismatch.
 */
export const usePropertyWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...INITIAL,
      setStep: (step) => set({ step }),
      setDetails: (patch) => set((state) => ({ details: { ...state.details, ...patch } })),
      addUnit: (unit) =>
        set((state) => ({ units: [...state.units, { ...unit, key: crypto.randomUUID() }] })),
      updateUnit: (key, patch) =>
        set((state) => ({
          units: state.units.map((unit) => (unit.key === key ? { ...unit, ...patch } : unit)),
        })),
      removeUnit: (key) => set((state) => ({ units: state.units.filter((unit) => unit.key !== key) })),
      markUnitCreated: (key, createdId) =>
        set((state) => ({
          units: state.units.map((unit) => (unit.key === key ? { ...unit, createdId } : unit)),
        })),
      setPropertyId: (propertyId) => set({ propertyId }),
      markImagesUploaded: () => set({ imagesUploaded: true }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: "property-wizard-draft",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (state) => ({
        step: state.step,
        details: state.details,
        units: state.units,
        propertyId: state.propertyId,
        imagesUploaded: state.imagesUploaded,
      }),
    },
  ),
);
