import { ConnectionClosedError, ProtocolError } from "puppeteer-core";
import { expect, test, vi } from "vitest";
import { rejectAfterClosingMailPage } from "../scripts/modes";

const openError = new Error("navigation failed");
const missingTarget = new ProtocolError();
missingTarget.originalMessage = "No target with given id found";
const unexpectedProtocolError = new ProtocolError();
unexpectedProtocolError.originalMessage = "Target is busy";

test("closes the page and rejects with the original opening error", async () => {
  const close = vi.fn().mockResolvedValue(undefined);
  const error = await rejectAfterClosingMailPage({ close }, openError).catch(
    (failure: unknown) => failure,
  );
  expect(error).toBe(openError);
  expect(close).toHaveBeenCalledOnce();
});

test.each([
  ["the connection is closed", new ConnectionClosedError("Connection closed.")],
  ["the target is gone", missingTarget],
])("preserves the opening error when %s", async (_reason, closeError) => {
  const close = vi.fn().mockRejectedValue(closeError);
  const error = await rejectAfterClosingMailPage({ close }, openError).catch(
    (failure: unknown) => failure,
  );
  expect(error).toBe(openError);
});

test.each([
  ["another protocol error", unexpectedProtocolError],
  ["a plain error with the missing-target message", new Error(missingTarget.originalMessage)],
])("reports both failures when closing throws %s", async (_reason, closeError) => {
  const close = vi.fn().mockRejectedValue(closeError);
  const error = await rejectAfterClosingMailPage({ close }, openError).catch(
    (failure: unknown) => failure,
  );
  expect(error).toMatchObject({
    name: "AggregateError",
    message: "Opening the mail and closing its page failed",
    errors: [openError, closeError],
    cause: closeError,
  });
});
