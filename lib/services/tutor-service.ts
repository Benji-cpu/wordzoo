export async function startSession(
  _userId: string,
  _mode: string,
  _languageId: string
): Promise<{ sessionId: string }> {
  throw new Error('Not implemented');
}

export async function sendMessage(
  _sessionId: string,
  _message: string
): Promise<{ reply: string }> {
  throw new Error('Not implemented');
}
