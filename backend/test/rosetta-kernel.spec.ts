import { describe, it, expect } from "vitest";
import { applyRosettaKernel } from "../rosetta/kernel";

describe("Rosetta Kernel – Phase 2 Governance Tests", () => {

  it("Normal mode should NOT mutate prompt", async () => {
    const raw = "Explain Lamport clocks.";
    const { transformedPrompt } = applyRosettaKernel(raw, "User", "Operator", false);

    // In transparent mode it should still wrap
    expect(transformedPrompt).toContain("ROSETTA KERNEL");
    expect(transformedPrompt).toContain(raw);
  });

  it("Managed governance should hide internal details", async () => {
    const raw = "What is CRIES?";
    const { transformedPrompt } = applyRosettaKernel(raw, "User", "Operator", true);

    expect(transformedPrompt).toContain("managed mode");
    expect(transformedPrompt).not.toContain("Δ-WHOAMI");
    expect(transformedPrompt).not.toContain("CRIES CHECK");
  });

  it("Transparent mode should show full kernel header", async () => {
    const raw = "Describe audit trails";
    const { transformedPrompt } = applyRosettaKernel(raw, "User", "Operator", false);

    expect(transformedPrompt).toContain("ROSETTA KERNEL");
    expect(transformedPrompt).toContain("Boot Logic");
    expect(transformedPrompt).toContain("CRIES CHECK");
    expect(transformedPrompt).toContain("Lamport Counter");
    expect(transformedPrompt).toContain("Version: vΩ3.4");
  });

  it("Kernel should increment lamport counter", async () => {
    const raw = "Test lamport increment";

    const { context } = applyRosettaKernel(raw, "User", "Operator", false);
    const firstLamport = context.lamport;

    const { context: c2 } = applyRosettaKernel(raw, "User", "Operator", false);
    const secondLamport = c2.lamport;

    expect(secondLamport).toBeGreaterThan(firstLamport);
  });

  it("Boot receipt should generate correct structure", async () => {
    const raw = "Check receipts";
    const { receipts } = applyRosettaKernel(raw, "User", "Operator", false);

    expect(Array.isArray(receipts)).toBe(true);
    expect(receipts.length).toBe(1);

    const receipt = receipts[0];
    expect(receipt.receipt_type).toBe("Δ-BOOTCONFIRM");
    expect(receipt.status).toBe("BOOTED");
    expect(receipt.witness).toBe("Rosetta Kernel");
    expect(receipt.lamport).toBeDefined();
  });

  it("Persona resolution should return Architect for founder", async () => {
    const { context } = applyRosettaKernel(
      "Hello",
      "Michael Tobin Gomes",
      "Operator",
      false
    );

    expect(context.persona).toBe("Architect");
  });

  it("Persona resolution should default to Viewer", async () => {
    const { context } = applyRosettaKernel(
      "Hello",
      "Random Person",
      "User",
      false
    );

    expect(context.persona).toBe("Viewer");
  });

  it("Kernel header should never include undefined values", async () => {
    const { transformedPrompt } = applyRosettaKernel(
      "Test",
      "User",
      "Operator",
      false
    );

    expect(transformedPrompt).not.toContain("undefined");
    expect(transformedPrompt).not.toContain("null");
  });

  it("Kernel should not reference Rosetta.html anymore", async () => {
    const { transformedPrompt } = applyRosettaKernel(
      "Test",
      "User",
      "Operator",
      false
    );

    expect(transformedPrompt).not.toContain("html");
    expect(transformedPrompt).not.toContain("Rosetta.html");
  });
});