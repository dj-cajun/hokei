import { describe, expect, it } from "vitest";
import {
  canonicalParticipantPair,
  otherParticipantId,
} from "@/lib/messages/conversation";

describe("conversation helpers", () => {
  it("canonicalParticipantPair sorts ids", () => {
    expect(canonicalParticipantPair("b", "a")).toEqual(["a", "b"]);
    expect(canonicalParticipantPair("a", "b")).toEqual(["a", "b"]);
  });

  it("otherParticipantId returns peer", () => {
    expect(
      otherParticipantId(
        { participantAId: "a", participantBId: "b" },
        "a"
      )
    ).toBe("b");
  });
});
