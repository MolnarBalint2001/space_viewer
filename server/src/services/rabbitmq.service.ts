import amqp, { Channel, ChannelModel, Options } from "amqplib";
import { env } from "../config/env";

export type RabbitConfig = {
    url: string; // amqp://user:pass@host:5672
    exchange: string; // domain-events
};

let conn: ChannelModel;
let channel: Channel;
let cfg: RabbitConfig = {
    url: env.RABBITMQ_URL,
    exchange: env.RABBITMQ_EXCHANGE,
};
let initialized = false;

export async function initRabbit(customCfg?: Partial<RabbitConfig>) {
    if (initialized) return;
    if (customCfg) {
        cfg = { ...cfg, ...customCfg };
    }
    conn = await amqp.connect(cfg.url);
    channel = await conn.createChannel();
    await channel.prefetch(1);

    await channel.assertExchange(cfg.exchange, "topic", { durable: true });
    await channel.assertExchange(`${cfg.exchange}.dlx`, "fanout", { durable: true });

    process.on("SIGINT", closeRabbit);
    process.on("SIGTERM", closeRabbit);
    initialized = true;
}

export async function publish(routingKey: string, message: object, options?: Options.Publish) {
    if (!initialized) throw new Error("RabbitMQ not initialized. Call initRabbit() first.");
    const body = Buffer.from(JSON.stringify(message));
    const ok = channel.publish(cfg.exchange, routingKey, body, {
        contentType: "application/json",
        persistent: true,
        ...options,
    });
    if (!ok) await new Promise((res) => channel.once("drain", res));
}

export async function subscribe(
    queue: string,
    bindingKey: string,
    onMessage: (payload: any, raw: amqp.ConsumeMessage, ch: Channel) => Promise<void> | void
) {
    if (!initialized) throw new Error("RabbitMQ not initialized. Call initRabbit() first.");

    await channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: `${cfg.exchange}.dlx`,
    });
    await channel.bindQueue(queue, cfg.exchange, bindingKey);

    await channel.consume(
        queue,
        async (msg) => {
            if (!msg) return;
            try {
                const payload = JSON.parse(msg.content.toString());
                await onMessage(payload, msg, channel);
                channel.ack(msg);
            } catch (err) {
                console.error("Consumer error, nacking…", err);
                channel.nack(msg, false, false);
            }
        },
        { noAck: false }
    );
}

export async function closeRabbit() {
    try {
        await channel?.close();
    } catch { }
    try {
        await conn.close()
    } catch { }
}
