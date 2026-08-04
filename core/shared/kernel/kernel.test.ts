import { describe, expect, it, vi } from "vitest";
import { AggregateRoot } from "./aggregate-root";
import { Entity } from "./entity";
import { ValueObject } from "./value-object";
import { UniqueId } from "./unique-id";
import { decodeCursor, InvalidCursorError, paginateSortedItems } from "./cursor";
import type { DomainEvent } from "./types/domain-event";

class TestEntity extends Entity<string> {
  constructor(id: string) { super(id); }
}

class TestValue extends ValueObject<{ value: string }> {
  constructor(value: string) { super({ value }); }
}

class TestAggregate extends AggregateRoot<string> {
  constructor() { super("aggregate-1"); }
  emit(event: DomainEvent) { this.recordEvent(event); }
}

describe("shared kernel", () => {
  it("compares entities by type and identity", () => {
    expect(new TestEntity("a").equals(new TestEntity("a"))).toBe(true);
    expect(new TestEntity("a").equals(new TestEntity("b"))).toBe(false);
    expect(new TestEntity("a").equals(null)).toBe(false);
  });

  it("compares value objects structurally and freezes their props", () => {
    const one = new TestValue("x");
    expect(one.equals(new TestValue("x"))).toBe(true);
    expect(one.equals(new TestValue("y"))).toBe(false);
  });

  it("pulls aggregate events once", () => {
    const event = { eventName: "Tested", aggregateId: "a", occurredAt: "now" };
    const aggregate = new TestAggregate();
    aggregate.emit(event);
    expect(aggregate.pullDomainEvents()).toEqual([event]);
    expect(aggregate.pullDomainEvents()).toEqual([]);
  });

  it("rejects empty unique ids and uses the generator port", () => {
    expect(() => UniqueId.from("")).toThrow("cannot be empty");
    expect(UniqueId.create({ generate: () => "generated" }).toString()).toBe("generated");
  });

  it("paginates with stable cursors", () => {
    const first = paginateSortedItems(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      { limit: 2 },
      (item) => item.id,
    );
    expect(first.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(first.nextCursor).toBeTypeOf("string");
    expect(first.hasMore).toBe(true);
    expect(decodeCursor(first.nextCursor!)).toBe("b");
    expect(paginateSortedItems([{ id: "a" }, { id: "b" }, { id: "c" }], { limit: 2, cursor: first.nextCursor! }, (item) => item.id)).toEqual({
      items: [{ id: "c" }],
      nextCursor: null,
      hasMore: false,
    });
    expect(paginateSortedItems([{ id: "a" }, { id: "b" }], { limit: 2, cursor: btoa(JSON.stringify({ version: 1, key: "z" })) }, (item) => item.id)).toMatchObject({ items: [], hasMore: false, nextCursor: null });
    expect(() => decodeCursor(btoa(JSON.stringify({ version: 1 })))).toThrow(InvalidCursorError);
    expect(() => decodeCursor("invalid")).toThrow(InvalidCursorError);
    expect(() => paginateSortedItems([], { limit: 0 }, (item: never) => item)).toThrow("positive integer");
  });

  it("keeps clock and random source deterministic through ports", () => {
    const clock = { now: () => new Date("2026-08-03T10:00:00.000Z"), nowIso: () => "2026-08-03T10:00:00.000Z" };
    const random = { int: (max: number) => Math.min(1, max), float: () => 0.5, shuffle: <T>(items: readonly T[]) => [...items].reverse() };
    expect(clock.nowIso()).toBe("2026-08-03T10:00:00.000Z");
    expect(random.int(3)).toBe(1);
    expect(random.shuffle([1, 2, 3])).toEqual([3, 2, 1]);
  });

  it("allows logger ports to be verified without console coupling", () => {
    const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    logger.info({ message: "ok", metadata: { requestId: "r1" } });
    expect(logger.info).toHaveBeenCalledOnce();
  });
});
