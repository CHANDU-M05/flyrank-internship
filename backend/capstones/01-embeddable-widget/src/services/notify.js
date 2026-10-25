// Confirmation "email" for a new submission. In this $0 setup it's a
// console log (swap for Mailpit/SMTP later) — what's actually graded is
// that its failure can never take down the submission response.
//
// NOTIFY_SHOULD_FAIL=true lets you deterministically prove the failure path
// (Probe 5 in the capstone brief) without depending on a flaky real service.
async function sendConfirmation(submission, widget) {
  if (process.env.NOTIFY_SHOULD_FAIL === 'true') {
    throw new Error('simulated notify failure');
  }
  console.log(
    `[notify] would email/webhook tenant ${widget.tenant_id} — new submission ${submission.id} on widget "${widget.title}"`
  );
  return { status: 'sent' };
}

// Wraps sendConfirmation so a failure is recorded but never propagated to
// the caller's control flow — the storing of the submission has already
// succeeded and must stay succeeded.
async function notifySafely(submission, widget) {
  try {
    await sendConfirmation(submission, widget);
    return 'sent';
  } catch (err) {
    console.error('[notify] side effect failed (submission still stored):', err.message);
    return 'failed';
  }
}

module.exports = { notifySafely };
