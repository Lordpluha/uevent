@startuml
skinparam shadowing false
skinparam responseMessageBelowArrow true
skinparam sequence {
  ArrowColor #475569
  LifeLineBorderColor #94A3B8
  LifeLineBackgroundColor #F8FAFC
  ParticipantBorderColor #334155
  ParticipantBackgroundColor #FFFFFF
  ActorBorderColor #334155
  ActorBackgroundColor #FFFFFF
}

title uEvent Sequence Diagram

actor User
participant "Web App" as Web
participant "API: Events/Organizations" as EventsAPI
participant "API: Payments" as PaymentsAPI
participant "Stripe" as Stripe
participant "API: Notifications" as NotifAPI
participant "SMTP" as SMTP

== Discover Event ==
User -> Web : Open event page
Web -> EventsAPI : GET /events/:id
EventsAPI --> Web : Event + organizer data

opt Follow organizer
  User -> Web : Click Follow
  Web -> EventsAPI : POST /organizations/:id/follow
  EventsAPI --> Web : { followed: true }
end

== Checkout ==
User -> Web : Buy ticket
Web -> PaymentsAPI : POST /payments/intent (ticket metadata)
PaymentsAPI -> Stripe : Create PaymentIntent
Stripe --> PaymentsAPI : paymentIntent + client_secret
PaymentsAPI --> Web : client_secret

Web -> Stripe : confirmPayment(client_secret)
Stripe --> Web : status (succeeded/processing)

Web -> PaymentsAPI : GET /payments/:paymentIntentId
PaymentsAPI --> Web : stored payment status

== Payment Succeeded Side Effects ==
Stripe -> PaymentsAPI : webhook payment_intent.succeeded
PaymentsAPI -> PaymentsAPI : apply side-effects
PaymentsAPI -> PaymentsAPI : issue purchased tickets
PaymentsAPI -> NotifAPI : create in-app notifications
NotifAPI --> PaymentsAPI : saved

opt SMTP configured + user allows email
  PaymentsAPI -> SMTP : send payment email
  SMTP --> PaymentsAPI : ok
end

opt Recovery path from success page
  Web -> PaymentsAPI : POST /payments/:id/reconcile
  PaymentsAPI --> Web : { success: true }
end

User -> Web : Open success page
User -> Web : Download ticket PDF
User -> Web : Open notifications
@enduml