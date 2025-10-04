import { randomUUID } from "node:crypto";
import { DomainEvent } from "../@types/event.type";
import { publish } from "./rabbitmq.service";


export async function publishDomainEvent<T extends DomainEvent>(
    evt: Omit<T, "id" | "occurredAt"> & { name: T["name"] }
) {
    const enriched: DomainEvent = {
        id: randomUUID(),
        occurredAt: new Date().toISOString(),
        ...evt as any,
    };
    await publish(evt.name, enriched);
    return enriched;
}