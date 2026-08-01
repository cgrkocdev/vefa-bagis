import { describe, expect, it } from "vitest";
import { definitionInputSchema, projectInputSchema, sacrificeDonationInputSchema } from "./schemas";
import { normalizePhone } from "../phone";

const id = "cm12345678901234567890123";

describe("Yedirenk iş kuralı doğrulamaları", () => {
  it("telefon numarasını Türkiye E.164 biçimine getirir", () => {
    expect(normalizePhone("0532 111 22 33")).toBe("+905321112233");
    expect(normalizePhone("+49 151 12345678")).toBe("+49 151 12345678");
  });

  it("tanım kodunu standartlaştırır", () => {
    const result = definitionInputSchema.parse({ type: "DONATION_GROUP", code: "şükür kurbanı", name: "Şükür Kurbanı" });
    expect(result.code).toBe("ŞÜKÜR_KURBANI");
    expect(result.isActive).toBe(true);
  });

  it("sıfır veya negatif hisse fiyatını reddeder", () => {
    const result = projectInputSchema.safeParse({
      yearId: id, departmentId: id, typeId: id, groupId: id, destinationCountryId: id,
      projectNumber: 1, name: "2026 Somali Projesi", animalType: "CATTLE", shareCapacity: 7,
      sharePrice: 0, currencyId: id, isVirtual: false, status: "OPEN",
    });
    expect(result.success).toBe(false);
  });

  it("bağışta idempotency anahtarını zorunlu tutar", () => {
    const result = sacrificeDonationInputSchema.safeParse({
      donor: { firstName: "Ali", lastName: "Yılmaz", phone: "+905321112233", phoneCountry: "TR" },
      projectId: id, typeId: id, groupId: id, amount: 100, currencyId: id,
      paymentMethodId: id, receiptDate: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
