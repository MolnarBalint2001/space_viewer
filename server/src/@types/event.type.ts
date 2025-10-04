import { Order } from "../domain/entities/Order";

export type DomainEventName = "order.created" | "order.status-changed" | "feedback.received";

export interface DomainEvent<TPayload = any> {
  name: DomainEventName;
  occurredAt: string;
  id: string;
  payload: TPayload;
}

export type OrderCreatedPayload = Order;

export type OrderCreatedEvent = DomainEvent<OrderCreatedPayload> & {
  name: "order.created";
};

export interface FeedbackReceivedPayload {
  feedbackId: string;
  rating: number;
  comment: string;
  submittedAt: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

export type FeedbackReceivedEvent = DomainEvent<FeedbackReceivedPayload> & {
  name: "feedback.received";
};
