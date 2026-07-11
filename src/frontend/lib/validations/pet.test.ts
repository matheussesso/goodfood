import { describe, it, expect } from "vitest";
import { petFormSchema } from "./pet";

const validPet = {
  name: "Rex",
  type: "dog" as const,
  sex: "male" as const,
  neutered: true,
  breed: "Vira-lata",
  weight: 12.5,
  age: 24,
  microchip_number: "123456789012345",
};

describe("petFormSchema", () => {
  it("accepts a valid pet", () => {
    expect(petFormSchema.safeParse(validPet).success).toBe(true);
  });

  it("rejects a missing name", () => {
    const withoutName: Record<string, unknown> = { ...validPet };
    delete withoutName.name;
    expect(petFormSchema.safeParse(withoutName).success).toBe(false);
  });

  it("requires sex", () => {
    const withoutSex: Record<string, unknown> = { ...validPet };
    delete withoutSex.sex;
    expect(petFormSchema.safeParse(withoutSex).success).toBe(false);
  });

  it("requires neutered", () => {
    const withoutNeutered: Record<string, unknown> = { ...validPet };
    delete withoutNeutered.neutered;
    expect(petFormSchema.safeParse(withoutNeutered).success).toBe(false);
  });

  it("accepts an omitted microchip_number", () => {
    const withoutMicrochip: Record<string, unknown> = { ...validPet };
    delete withoutMicrochip.microchip_number;
    expect(petFormSchema.safeParse(withoutMicrochip).success).toBe(true);
  });

  it("rejects a microchip_number with letters", () => {
    expect(petFormSchema.safeParse({ ...validPet, microchip_number: "ABC123456789" }).success).toBe(false);
  });

  it("rejects a microchip_number shorter than 9 digits", () => {
    expect(petFormSchema.safeParse({ ...validPet, microchip_number: "12345" }).success).toBe(false);
  });

  it("rejects a weight above 120kg", () => {
    expect(petFormSchema.safeParse({ ...validPet, weight: 500 }).success).toBe(false);
  });

  it("rejects an age above 360 months", () => {
    expect(petFormSchema.safeParse({ ...validPet, age: 400 }).success).toBe(false);
  });

  it("requires breed", () => {
    const withoutBreed: Record<string, unknown> = { ...validPet };
    delete withoutBreed.breed;
    expect(petFormSchema.safeParse(withoutBreed).success).toBe(false);
  });

  it("rejects a blank breed", () => {
    expect(petFormSchema.safeParse({ ...validPet, breed: "   " }).success).toBe(false);
  });

  it("requires weight", () => {
    const withoutWeight: Record<string, unknown> = { ...validPet };
    delete withoutWeight.weight;
    expect(petFormSchema.safeParse(withoutWeight).success).toBe(false);
  });

  it("requires age", () => {
    const withoutAge: Record<string, unknown> = { ...validPet };
    delete withoutAge.age;
    expect(petFormSchema.safeParse(withoutAge).success).toBe(false);
  });
});
