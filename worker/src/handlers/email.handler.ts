import { mailInboxService } from '../services/mail-inbox.service';
import { mailService } from '../services/mail.service';
import type { Env } from '../types/env.types';

/**
 * Cloudflare Email Routing entry point.
 * - When `forward_to` is set: forwards the incoming email to that verified address
 *   and logs the incoming activity entry in `onevault-storage` D1.
 * - When `forward_to` is null ("None"): parses and saves the full raw MIME + formatted
 *   content into `onevault-storage` D1 so it can be viewed in the OneVault Inbox modal.
 */
export async function handleIncomingEmail(
  message: ForwardableEmailMessage,
  env: Env
): Promise<void> {
  const account = await mailService.findByAddress(env, message.to);

  if (!account) {
    message.setReject('Unknown recipient');
    return;
  }

  if (account.forward_to) {
    await message.forward(account.forward_to);
    try {
      await mailInboxService.saveForwardedActivity(
        env,
        account,
        message.from,
        message.headers
      );
    } catch (err) {
      console.error('Failed to log forwarded email activity:', err);
    }
    return;
  }

  // Forward To === None: save full raw MIME & formatted message into D1
  await mailInboxService.saveIncomingMessage(
    env,
    account,
    message.raw,
    message.from
  );
}
