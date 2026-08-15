import { describe, expect, it } from "vitest";
import { CATEGORIES, LANGUAGES } from "./articles";
import { LANGUAGE_KEYWORDS } from "../client/src/components/CodeBlock";

describe("article catalog", () => {
  it("exposes a stable set of editor languages and debugging categories", () => {
    expect(LANGUAGES).toContain("Java");
    expect(LANGUAGES).toContain("TypeScript");
    expect(CATEGORIES).toContain("Performance");
    expect(CATEGORIES).toContain("Infrastructure");
  });

  it("keeps syntax highlighting language-aware for Java and SQL", () => {
    expect(LANGUAGE_KEYWORDS.Java.test("public")).toBe(true);
    expect(LANGUAGE_KEYWORDS.Java.test("SELECT")).toBe(false);
    expect(LANGUAGE_KEYWORDS.SQL.test("SELECT")).toBe(true);
  });
});
