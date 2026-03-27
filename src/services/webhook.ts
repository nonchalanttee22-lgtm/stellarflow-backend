import axios from "axios";

type WebhookPayload =
  | {
      embeds: Array<{
        title: string;
        color: number;
        fields: Array<{
          name: string;
          value: string;
          inline?: boolean;
        }>;
      }>;
    }
  | {
      blocks: Array<
        | {
            type: "header";
            text: {
              type: "plain_text";
              text: string;
            };
          }
        | {
            type: "section";
            fields?: Array<{
              type: "mrkdwn";
              text: string;
            }>;
            text?: {
              type: "mrkdwn";
              text: string;
            };
          }
      >;
    };

type ErrorDetails = {
  errorType: string;
  errorMessage: string;
  attempts: number;
  service: string;
  pricePair: string;
  timestamp: Date;
};

export class WebhookService {
  private webhookUrl: string | undefined;
  private platform: string;

  constructor() {
    this.webhookUrl =
      process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    this.platform = process.env.NOTIFICATION_PLATFORM || "slack";
  }

  async sendErrorNotification(errorDetails: ErrorDetails): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    const message = this.formatMessage(errorDetails);

    try {
      await axios.post(this.webhookUrl, message, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });
    } catch (error) {
      console.error("Failed to send webhook notification:", error);
    }
  }

  private formatMessage(errorDetails: ErrorDetails): WebhookPayload {
    const { errorMessage, attempts, service, pricePair, timestamp } =
      errorDetails;

    if (this.platform === "discord") {
      return {
        embeds: [
          {
            title: "Price Fetch Error",
            color: 0xff0000,
            fields: [
              { name: "Service", value: service, inline: true },
              { name: "Price Pair", value: pricePair, inline: true },
              {
                name: "Failed Attempts",
                value: attempts.toString(),
                inline: true,
              },
              { name: "Error", value: errorMessage.substring(0, 500) },
              { name: "Time", value: new Date(timestamp).toISOString() },
            ],
          },
        ],
      };
    }

    return {
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "Price Fetch Error" },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Service:*\n${service}` },
            { type: "mrkdwn", text: `*Price Pair:*\n${pricePair}` },
            { type: "mrkdwn", text: `*Failed Attempts:*\n${attempts}/3` },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date(timestamp).toISOString()}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:*\n\`\`\`${errorMessage.substring(0, 500)}\`\`\``,
          },
        },
      ],
    };
  }
}

export const webhookService = new WebhookService();
