/** 1:1 대화 참가자 쌍 — 항상 동일한 (A,B) 순서로 저장 */
export function canonicalParticipantPair(
  userIdA: string,
  userIdB: string
): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export function otherParticipantId(
  conversation: { participantAId: string; participantBId: string },
  myId: string
): string {
  return conversation.participantAId === myId
    ? conversation.participantBId
    : conversation.participantAId;
}
